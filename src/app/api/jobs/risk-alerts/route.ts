import { redirect } from "next/navigation";

import { serverEnv } from "@/lib/env";
import {
  buildClassReminderEmailSubject,
  buildClassReminderMessage,
  buildFeeReminderEmailSubject,
  buildFeeReminderMessage,
  buildHolidayEmailSubject,
  buildHolidayMessage,
  buildTestReminderEmailSubject,
  buildTestReminderMessage,
  queueNotification,
} from "@/lib/notifications";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  AttendanceRecord,
  CentreRecord,
  FeeRecord,
  NotificationMessageRecord,
  StudentRecord,
} from "@/lib/types";

const APP_TIMEZONE = "Asia/Kolkata";

type TestReminderRow = {
  id: string;
  title: string;
  test_date: string;
  batch_id: string;
  batches: {
    id: string;
    centre_id: string;
    branch_id: string | null;
    name: string;
  };
};

type TimetableReminderRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  topic: string | null;
  batch_id: string;
  batches: {
    id: string;
    centre_id: string;
    branch_id: string | null;
    name: string;
  };
};

type HolidayReminderRow = {
  id: string;
  centre_id: string;
  branch_id: string | null;
  holiday_date: string;
  title: string;
  notes: string | null;
  branches?: {
    name: string;
  } | null;
};

function getDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const isoDate = `${lookup.year}-${lookup.month}-${lookup.day}`;
  const monthKey = `${lookup.year}-${lookup.month}`;
  const dayOfMonth = Number(lookup.day);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    isoDate,
    monthKey,
    dayOfMonth,
    weekday: weekdayMap[lookup.weekday] ?? 0,
  };
}

function timeLabel(value: string) {
  return value.slice(0, 5);
}

function notificationKey(category: string, studentId: string, eventId: string) {
  return `${category}:${studentId}:${eventId}`;
}

function payloadValue(payload: NotificationMessageRecord["payload"], key: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = payload[key];
  return typeof value === "string" ? value : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const interactiveRun = url.searchParams.get("run") === "1";

  if (!interactiveRun && serverEnv.CRON_SECRET && secret !== serverEnv.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const today = new Date();
  const { isoDate, monthKey: currentMonth, dayOfMonth: todayDay, weekday } = getDateParts(today);

  const [
    { data: centres },
    { data: students },
    { data: attendance },
    { data: fees },
    { data: tests },
    { data: timetableEntries },
    { data: holidays },
    { data: existingMessages },
  ] = await Promise.all([
    supabase.from("centres").select("id, name"),
    supabase
      .from("students")
      .select("id, centre_id, branch_id, batch_id, name, parent_phone, parent_email, fee_amount, fee_due_date")
      .eq("status", "active"),
    supabase
      .from("attendance")
      .select("student_id, status, date")
      .gte("date", `${currentMonth}-01`)
      .lte("date", `${currentMonth}-31`),
    supabase.from("fees").select("*").eq("month", currentMonth),
    supabase
      .from("tests")
      .select("id, title, test_date, batch_id, batches!inner(id, centre_id, branch_id, name)")
      .eq("test_date", isoDate),
    supabase
      .from("timetable_entries")
      .select("id, weekday, start_time, end_time, topic, batch_id, batches!inner(id, centre_id, branch_id, name)")
      .eq("weekday", weekday),
    supabase
      .from("holidays")
      .select("id, centre_id, branch_id, holiday_date, title, notes, branches(name)")
      .eq("holiday_date", isoDate),
    supabase
      .from("notification_messages")
      .select("student_id, category, payload")
      .eq("channel", "email")
      .gte("scheduled_for", `${isoDate}T00:00:00.000Z`)
      .lt("scheduled_for", `${isoDate}T23:59:59.999Z`),
  ]);

  const centreMap = new Map(
    ((centres ?? []) as Array<Pick<CentreRecord, "id" | "name">>).map((centre) => [centre.id, centre])
  );
  const activeStudents = (students ?? []) as Array<
    Pick<
      StudentRecord,
      | "id"
      | "centre_id"
      | "branch_id"
      | "batch_id"
      | "name"
      | "parent_phone"
      | "parent_email"
      | "fee_amount"
      | "fee_due_date"
    >
  >;
  const deliveredKeys = new Set(
    ((existingMessages ?? []) as NotificationMessageRecord[])
      .map((message) => {
        const eventId = payloadValue(message.payload, "event_id");
        return message.student_id && eventId ? notificationKey(message.category, message.student_id, eventId) : null;
      })
      .filter((value): value is string => value !== null)
  );
  const todaysTests = (tests ?? []) as TestReminderRow[];
  const todaysTimetableEntries = (timetableEntries ?? []) as TimetableReminderRow[];
  const todaysHolidays = (holidays ?? []) as HolidayReminderRow[];

  for (const student of activeStudents) {
    const studentAttendance = ((attendance ?? []) as Array<
      Pick<AttendanceRecord, "student_id" | "status" | "date">
    >).filter((entry) => entry.student_id === student.id);
    const presentCount = studentAttendance.filter((entry) => entry.status === "present").length;
    const attendanceRate =
      studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 100;

    if (studentAttendance.length >= 3 && attendanceRate < 60) {
      await supabase.from("risk_alerts").insert({
        centre_id: student.centre_id,
        student_id: student.id,
        alert_type: "low_attendance",
        severity: "high",
        metadata: { attendance_rate: attendanceRate, month: currentMonth },
      });
    }

    const studentFee = ((fees ?? []) as FeeRecord[]).find((fee) => fee.student_id === student.id);
    const centre = centreMap.get(student.centre_id);
    if (!centre || !studentFee || studentFee.status === "paid") {
      continue;
    }

    const daysUntilDue = student.fee_due_date - todayDay;
    let category: string | null = null;
    let reminderStage: string | null = null;

    if (daysUntilDue === 3) {
      category = "fee_due_soon";
      reminderStage = "due_soon";
    } else if (daysUntilDue === 0) {
      category = "fee_due_today";
      reminderStage = "due_today";
    } else if (daysUntilDue === -7) {
      category = "fee_overdue_7";
      reminderStage = "overdue_7";
    }

    if (!category || studentFee.reminder_stage === reminderStage) {
      continue;
    }

    await queueNotification({
      centreId: student.centre_id,
      branchId: student.branch_id,
      studentId: student.id,
      batchId: student.batch_id,
      category,
      recipientPhone: student.parent_phone,
      messageBody: buildFeeReminderMessage(
        student.name,
        Number(student.fee_amount),
        Number(student.fee_due_date),
        centre.name
      ),
      payload: { month: currentMonth, reminder_stage: reminderStage },
    });

    if (student.parent_email) {
      await queueNotification({
        centreId: student.centre_id,
        branchId: student.branch_id,
        studentId: student.id,
        batchId: student.batch_id,
        category,
        channel: "email",
        recipientEmail: student.parent_email,
        messageBody: buildFeeReminderMessage(
          student.name,
          Number(student.fee_amount),
          Number(student.fee_due_date),
          centre.name
        ),
        payload: {
          month: currentMonth,
          reminder_stage: reminderStage,
          subject: buildFeeReminderEmailSubject(student.name, centre.name, Number(student.fee_due_date)),
        },
      });
    }

    await supabase
      .from("fees")
      .update({
        status: todayDay > student.fee_due_date ? "overdue" : studentFee.status,
        reminder_stage: reminderStage,
      })
      .eq("id", studentFee.id);
  }

  for (const test of todaysTests) {
    const centre = centreMap.get(test.batches.centre_id);
    if (!centre) {
      continue;
    }

    for (const student of activeStudents.filter((item) => item.batch_id === test.batch_id && item.parent_email)) {
      const key = notificationKey("test_reminder", student.id, test.id);
      if (deliveredKeys.has(key)) {
        continue;
      }

      await queueNotification({
        centreId: student.centre_id,
        branchId: student.branch_id,
        studentId: student.id,
        batchId: student.batch_id,
        category: "test_reminder",
        channel: "email",
        recipientEmail: student.parent_email,
        messageBody: buildTestReminderMessage(student.name, centre.name, test.title, test.batches.name, test.test_date),
        payload: {
          event_id: test.id,
          event_date: test.test_date,
          subject: buildTestReminderEmailSubject(centre.name, test.title, test.test_date),
        },
      });
      deliveredKeys.add(key);
    }
  }

  for (const entry of todaysTimetableEntries) {
    const centre = centreMap.get(entry.batches.centre_id);
    if (!centre) {
      continue;
    }

    for (const student of activeStudents.filter((item) => item.batch_id === entry.batch_id && item.parent_email)) {
      const key = notificationKey("class_schedule", student.id, entry.id);
      if (deliveredKeys.has(key)) {
        continue;
      }

      await queueNotification({
        centreId: student.centre_id,
        branchId: student.branch_id,
        studentId: student.id,
        batchId: student.batch_id,
        category: "class_schedule",
        channel: "email",
        recipientEmail: student.parent_email,
        messageBody: buildClassReminderMessage(
          student.name,
          centre.name,
          entry.batches.name,
          entry.topic ?? "General class",
          timeLabel(entry.start_time),
          timeLabel(entry.end_time)
        ),
        payload: {
          event_id: entry.id,
          event_date: isoDate,
          subject: buildClassReminderEmailSubject(centre.name, entry.batches.name, timeLabel(entry.start_time)),
        },
      });
      deliveredKeys.add(key);
    }
  }

  for (const holiday of todaysHolidays) {
    const centre = centreMap.get(holiday.centre_id);
    if (!centre) {
      continue;
    }

    const affectedStudents = activeStudents.filter((student) => {
      if (student.centre_id !== holiday.centre_id || !student.parent_email) {
        return false;
      }

      return holiday.branch_id ? student.branch_id === holiday.branch_id : true;
    });

    for (const student of affectedStudents) {
      const key = notificationKey("holiday_notice", student.id, holiday.id);
      if (deliveredKeys.has(key)) {
        continue;
      }

      await queueNotification({
        centreId: student.centre_id,
        branchId: student.branch_id,
        studentId: student.id,
        batchId: student.batch_id,
        category: "holiday_notice",
        channel: "email",
        recipientEmail: student.parent_email,
        messageBody: buildHolidayMessage(centre.name, holiday.title, holiday.holiday_date, holiday.branches?.name ?? null),
        payload: {
          event_id: holiday.id,
          event_date: holiday.holiday_date,
          subject: buildHolidayEmailSubject(centre.name, holiday.title, holiday.holiday_date),
        },
      });
      deliveredKeys.add(key);
    }
  }

  if (interactiveRun) {
    redirect("/dashboard/messages");
  }

  return Response.json({ ok: true });
}
