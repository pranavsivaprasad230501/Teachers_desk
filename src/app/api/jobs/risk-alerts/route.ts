import { serverEnv } from "@/lib/env";
import {
  buildFeeReminderMessage,
  queueNotification,
} from "@/lib/notifications";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { CentreRecord, FeeRecord, StudentRecord, AttendanceRecord } from "@/lib/types";

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function dayOfMonth(date = new Date()) {
  return Number(date.toISOString().slice(8, 10));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (serverEnv.CRON_SECRET && secret !== serverEnv.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const today = new Date();
  const currentMonth = monthKey(today);
  const todayDay = dayOfMonth(today);

  const [{ data: centres }, { data: students }, { data: attendance }, { data: fees }] =
    await Promise.all([
      supabase.from("centres").select("id, name"),
      supabase
        .from("students")
        .select("id, centre_id, branch_id, batch_id, name, parent_phone, fee_amount, fee_due_date")
        .eq("status", "active"),
      supabase
        .from("attendance")
        .select("student_id, status, date")
        .gte("date", `${currentMonth}-01`)
        .lte("date", `${currentMonth}-31`),
      supabase.from("fees").select("*").eq("month", currentMonth),
    ]);

  const centreMap = new Map(
    ((centres ?? []) as Array<Pick<CentreRecord, "id" | "name">>).map((centre) => [centre.id, centre])
  );

  for (const student of (students ?? []) as Array<
    Pick<
      StudentRecord,
      "id" | "centre_id" | "branch_id" | "batch_id" | "name" | "parent_phone" | "fee_amount" | "fee_due_date"
    >
  >) {
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

    await supabase
      .from("fees")
      .update({
        status: todayDay > student.fee_due_date ? "overdue" : studentFee.status,
        reminder_stage: reminderStage,
      })
      .eq("id", studentFee.id);
  }

  return Response.json({ ok: true });
}
