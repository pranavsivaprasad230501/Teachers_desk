"use server";

import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import {
  ensureDefaultBranch,
  ensureFeesForMonth,
  ensureTrialSubscription,
  getAppContextForUser,
  getMonthKey,
  getStudentsForBatch,
} from "@/lib/data";
import {
  buildAbsenceEmailSubject,
  buildAbsenceMessage,
  buildBroadcastMessage,
  queueNotification,
} from "@/lib/notifications";
import { isMissingColumnInSchemaCache } from "@/lib/supabase-errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  BranchRecord,
  CentreRecord,
  EnrollmentSubmissionRecord,
  TestScoreRecord,
} from "@/lib/types";

const optionalString = z.preprocess(
  (value) => {
    if (value == null) {
      return undefined;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().optional()
);

const optionalUuid = z.preprocess(
  (value) => {
    if (value == null) {
      return undefined;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().uuid().optional()
);

const optionalPositiveNumber = z.preprocess(
  (value) => {
    if (value == null) {
      return undefined;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : Number(trimmed);
    }

    if (typeof value === "number" && Number.isNaN(value)) {
      return undefined;
    }

    return value;
  },
  z.number().min(1).optional()
);

const createCentreSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
});

const createBranchSchema = z.object({
  name: z.string().min(2),
  phone: optionalString.refine((value) => !value || value.length >= 10, {
    message: "Phone must be at least 10 digits",
  }),
  address: optionalString.refine((value) => !value || value.length >= 5, {
    message: "Address must be at least 5 characters",
  }),
});

const createBatchSchema = z.object({
  branchId: optionalUuid,
  name: z.string().min(2),
  subject: z.string().min(2),
  grade: z.string().min(2),
  schedule: z.string().min(2),
  capacity: optionalPositiveNumber,
});

const createStudentSchema = z.object({
  branchId: optionalUuid,
  name: z.string().min(2),
  parentName: optionalString,
  parentEmail: optionalString.pipe(z.email().optional()),
  parentPhone: z.string().min(10),
  batchId: optionalUuid,
  feeAmount: z.coerce.number().min(1),
  feeDueDate: z.coerce.number().min(1).max(28),
  rollNumber: optionalString,
});

async function insertStudentWithParentEmailFallback(
  payload: {
    centre_id: string;
    branch_id: string | null;
    batch_id?: string | null;
    name: string;
    parent_name: string | null;
    parent_email: string | null;
    parent_phone: string;
    fee_amount: number;
    fee_due_date: number;
    roll_number?: string | null;
    portal_token: string;
  },
  select = false
) {
  const supabase = await createServerSupabaseClient();

  if (select) {
    const result = await supabase.from("students").insert(payload).select("id").single();

    if (result.error && isMissingColumnInSchemaCache(new Error(result.error.message), "parent_email")) {
      const { parent_email, ...fallbackPayload } = payload;
      void parent_email;
      return supabase.from("students").insert(fallbackPayload).select("id").single();
    }

    return result;
  }

  const result = await supabase.from("students").insert(payload);

  if (result.error && isMissingColumnInSchemaCache(new Error(result.error.message), "parent_email")) {
    const { parent_email, ...fallbackPayload } = payload;
    void parent_email;
    return supabase.from("students").insert(fallbackPayload);
  }

  return result;
}

async function updateStudentContactsWithParentEmailFallback(payload: {
  studentId: string;
  centreId: string;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string;
}) {
  const supabase = await createServerSupabaseClient();

  const result = await supabase
    .from("students")
    .update({
      parent_name: payload.parentName,
      parent_email: payload.parentEmail,
      parent_phone: payload.parentPhone,
    })
    .eq("id", payload.studentId)
    .eq("centre_id", payload.centreId);

  if (result.error && isMissingColumnInSchemaCache(new Error(result.error.message), "parent_email")) {
    return supabase
      .from("students")
      .update({
        parent_name: payload.parentName,
        parent_phone: payload.parentPhone,
      })
      .eq("id", payload.studentId)
      .eq("centre_id", payload.centreId);
  }

  return result;
}

const updateStudentContactsSchema = z.object({
  studentId: z.string().uuid(),
  parentName: optionalString,
  parentEmail: optionalString.pipe(z.email().optional()),
  parentPhone: z.string().min(10),
});

const inviteStaffSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  role: z.enum(["teacher", "admin"]),
  branchId: optionalUuid,
});

const timetableSchema = z.object({
  batchId: z.string().uuid(),
  weekday: z.coerce.number().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  topic: optionalString,
  room: optionalString,
});

const holidaySchema = z.object({
  branchId: optionalUuid,
  holidayDate: z.string().date(),
  title: z.string().min(2),
  notes: optionalString,
});

const createTestSchema = z.object({
  batchId: z.string().uuid(),
  title: z.string().min(2),
  maxMarks: z.coerce.number().min(1),
  testDate: z.string().min(1),
});

type AttendanceUpsertRow = {
  student_id: string;
  date: string;
  status: "present" | "absent";
  marked_by: string;
};

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createCentreAction(formData: FormData) {
  const user = await requireUser();
  const values = createCentreSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });

  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const { data: centre, error } = await supabase
    .from("centres")
    .insert({
      owner_id: user.id,
      name: values.name,
      phone: values.phone,
      address: values.address,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  const typedCentre = centre as CentreRecord;

  const { error: profileError } = await adminSupabase.from("user_profiles").upsert({
    user_id: user.id,
    phone: user.phone ?? values.phone,
    role_hint: "owner",
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: branch, error: branchError } = await adminSupabase
    .from("branches")
    .insert({
      centre_id: typedCentre.id,
      name: "Main Branch",
      phone: values.phone,
      address: values.address,
      is_main: true,
    })
    .select("*")
    .single();

  if (branchError) {
    throw new Error(branchError.message);
  }
  const typedBranch = branch as BranchRecord;

  const { error: membershipError } = await adminSupabase.from("staff_memberships").upsert(
    {
      user_id: user.id,
      centre_id: typedCentre.id,
      branch_id: typedBranch.id,
      role: "owner",
    },
    { onConflict: "user_id,centre_id" }
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const { error: enrollmentFormError } = await adminSupabase.from("enrollment_forms").insert({
    centre_id: typedCentre.id,
    branch_id: typedBranch.id,
    token: randomUUID(),
  });

  if (enrollmentFormError) {
    throw new Error(enrollmentFormError.message);
  }

  await ensureTrialSubscription(typedCentre.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createBranchAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can create branches.");
  }

  const values = createBranchSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("branches").insert({
    centre_id: appContext.centre.id,
    name: values.name,
    phone: values.phone || null,
    address: values.address || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/branches");
}

export async function createBatchAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can create batches.");
  }

  const defaultBranch = await ensureDefaultBranch(appContext.centre.id);
  const values = createBatchSchema.parse({
    branchId: formData.get("branch_id"),
    name: formData.get("name"),
    subject: formData.get("subject"),
    grade: formData.get("grade"),
    schedule: formData.get("schedule"),
    capacity: formData.get("capacity"),
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("batches").insert({
    centre_id: appContext.centre.id,
    branch_id: values.branchId || defaultBranch.id,
    name: values.name,
    subject: values.subject,
    grade: values.grade,
    schedule: values.schedule,
    capacity: values.capacity ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/batches");
}

export async function createStudentAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can add students.");
  }

  const defaultBranch = await ensureDefaultBranch(appContext.centre.id);
  const values = createStudentSchema.parse({
    branchId: formData.get("branch_id"),
    name: formData.get("name"),
    parentName: formData.get("parent_name"),
    parentEmail: formData.get("parent_email"),
    parentPhone: formData.get("parent_phone"),
    batchId: formData.get("batch_id"),
    feeAmount: formData.get("fee_amount"),
    feeDueDate: formData.get("fee_due_date"),
    rollNumber: formData.get("roll_number"),
  });

  const { error } = await insertStudentWithParentEmailFallback({
    centre_id: appContext.centre.id,
    branch_id: values.branchId || defaultBranch.id,
    batch_id: values.batchId || null,
    name: values.name,
    parent_name: values.parentName || null,
    parent_email: values.parentEmail || null,
    parent_phone: values.parentPhone,
    fee_amount: values.feeAmount,
    fee_due_date: values.feeDueDate,
    roll_number: values.rollNumber || null,
    portal_token: randomUUID(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/fees");
}

export async function updateStudentContactsAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can update student contacts.");
  }

  const values = updateStudentContactsSchema.parse({
    studentId: formData.get("student_id"),
    parentName: formData.get("parent_name"),
    parentEmail: formData.get("parent_email"),
    parentPhone: formData.get("parent_phone"),
  });

  const { error } = await updateStudentContactsWithParentEmailFallback({
    studentId: values.studentId,
    centreId: appContext.centre.id,
    parentName: values.parentName || null,
    parentEmail: values.parentEmail || null,
    parentPhone: values.parentPhone,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/students");
}

export async function moveStudentBatchAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can move students.");
  }

  const studentId = z.string().uuid().parse(formData.get("student_id"));
  const batchId = z.string().uuid().optional().or(z.literal("")).parse(formData.get("batch_id"));

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("students")
    .update({ batch_id: batchId || null })
    .eq("id", studentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/students");
}

export async function saveAttendanceAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre) {
    throw new Error("Centre not found.");
  }

  const batchId = z.string().uuid().parse(formData.get("batch_id"));
  const date = String(formData.get("date"));
  const students = await getStudentsForBatch(batchId);
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const studentIds = students.map((student) => student.id);
  const existingStatusByStudentId = new Map<string, "present" | "absent">();

  if (studentIds.length > 0) {
    const { data: existingAttendance, error: existingAttendanceError } = await supabase
      .from("attendance")
      .select("student_id, status")
      .in("student_id", studentIds)
      .eq("date", date);

    if (existingAttendanceError) {
      throw new Error(existingAttendanceError.message);
    }

    for (const record of existingAttendance ?? []) {
      existingStatusByStudentId.set(record.student_id, record.status);
    }
  }

  const rows: AttendanceUpsertRow[] = students
    .map((student) => {
      const status = formData.get(`status:${student.id}`);
      if (status !== "present" && status !== "absent") {
        return null;
      }

      return {
        student_id: student.id,
        date,
        status,
        marked_by: user.id,
      };
    })
    .filter((row): row is AttendanceUpsertRow => row !== null);

  if (rows.length > 0) {
    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,date" });

    if (error) {
      throw new Error(error.message);
    }
  }

  for (const row of rows) {
    if (row.status !== "absent" || existingStatusByStudentId.get(row.student_id) === "absent") {
      continue;
    }

    const student = students.find((item) => item.id === row.student_id);
    if (!student) {
      continue;
    }

    const { data: recentAbsences } = await supabase
      .from("attendance")
      .select("date, status")
      .eq("student_id", student.id)
      .eq("status", "absent")
      .order("date", { ascending: false })
      .limit(3);

    await queueNotification({
      centreId: appContext.centre.id,
      branchId: student.branch_id,
      studentId: student.id,
      batchId,
      category: "absence_alert",
      recipientPhone: student.parent_phone,
      messageBody: buildAbsenceMessage(student.name, appContext.centre.name, date),
      payload: { student_id: student.id, date },
    });

    if (student.parent_email) {
      await queueNotification({
        centreId: appContext.centre.id,
        branchId: student.branch_id,
        studentId: student.id,
        batchId,
        category: "absence_alert",
        channel: "email",
        recipientEmail: student.parent_email,
        messageBody: buildAbsenceMessage(student.name, appContext.centre.name, date),
        payload: {
          student_id: student.id,
          date,
          subject: buildAbsenceEmailSubject(student.name, appContext.centre.name, date),
        },
      });
    }

    if ((recentAbsences ?? []).length >= 3) {
      await adminSupabase.from("risk_alerts").insert({
        centre_id: appContext.centre.id,
        student_id: student.id,
        alert_type: "consecutive_absence",
        severity: "high",
        metadata: { days: (recentAbsences ?? []).length },
      });
    }
  }

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/messages");
}

export async function markFeePaidAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can manage fees.");
  }

  const feeId = z.string().uuid().parse(formData.get("fee_id"));
  const amount = z.coerce.number().min(0).parse(formData.get("amount_paid"));

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("fees")
    .update({
      status: "paid",
      amount_paid: amount,
      paid_at: new Date().toISOString(),
      reminder_stage: "none",
    })
    .eq("id", feeId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/fees");
  revalidatePath("/dashboard");
}

export async function seedCurrentMonthFeesAction() {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can manage fees.");
  }

  await ensureFeesForMonth(appContext.centre.id, getMonthKey());
  revalidatePath("/dashboard/fees");
}

export async function inviteStaffAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can invite staff.");
  }

  const values = inviteStaffSchema.parse({
    fullName: formData.get("full_name"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    branchId: formData.get("branch_id"),
  });

  const normalizedPhone = values.phone.startsWith("+")
    ? values.phone
    : `+91${values.phone.replace(/\D/g, "")}`;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("staff_invites").insert({
    centre_id: appContext.centre.id,
    branch_id: values.branchId || (appContext.branch?.id ?? null),
    full_name: values.fullName,
    phone: normalizedPhone,
    role: values.role,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/staff");
}

export async function assignTeacherToBatchAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can assign teachers.");
  }

  const teacherUserId = z.string().uuid().parse(formData.get("teacher_user_id"));
  const batchId = z.string().uuid().parse(formData.get("batch_id"));

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("teacher_batch_assignments").upsert(
    {
      teacher_user_id: teacherUserId,
      batch_id: batchId,
    },
    { onConflict: "teacher_user_id,batch_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/batches");
}

export async function createTimetableEntryAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can manage timetable.");
  }

  const values = timetableSchema.parse({
    batchId: formData.get("batch_id"),
    weekday: formData.get("weekday"),
    startTime: formData.get("start_time"),
    endTime: formData.get("end_time"),
    topic: formData.get("topic"),
    room: formData.get("room"),
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("timetable_entries").insert({
    batch_id: values.batchId,
    weekday: values.weekday,
    start_time: values.startTime,
    end_time: values.endTime,
    topic: values.topic || null,
    room: values.room || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/timetable");
}

export async function createHolidayAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can manage holidays.");
  }

  const values = holidaySchema.parse({
    branchId: formData.get("branch_id"),
    holidayDate: formData.get("holiday_date"),
    title: formData.get("title"),
    notes: formData.get("notes"),
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("holidays").insert({
    centre_id: appContext.centre.id,
    branch_id: values.branchId || null,
    holiday_date: values.holidayDate,
    title: values.title,
    notes: values.notes || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/timetable");
}

export async function createTestAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre) {
    throw new Error("Centre not found.");
  }

  const values = createTestSchema.parse({
    batchId: formData.get("batch_id"),
    title: formData.get("title"),
    maxMarks: formData.get("max_marks"),
    testDate: formData.get("test_date"),
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("tests").insert({
    batch_id: values.batchId,
    title: values.title,
    max_marks: values.maxMarks,
    test_date: values.testDate,
    created_by: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/tests");
}

export async function saveTestScoresAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre) {
    throw new Error("Centre not found.");
  }

  const testId = z.string().uuid().parse(formData.get("test_id"));
  const batchId = z.string().uuid().parse(formData.get("batch_id"));
  const students = await getStudentsForBatch(batchId);
  const rows: Array<Pick<TestScoreRecord, "test_id" | "student_id" | "marks">> = students
    .map((student) => {
      const marks = formData.get(`marks:${student.id}`);
      if (marks === null || marks === "") {
        return null;
      }

      return {
        test_id: testId,
        student_id: student.id,
        marks: Number(marks),
      };
    })
    .filter((row): row is Pick<TestScoreRecord, "test_id" | "student_id" | "marks"> => row !== null);

  if (rows.length > 0) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("test_scores")
      .upsert(rows, { onConflict: "test_id,student_id" });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/dashboard/tests");
  revalidatePath("/portal");
}

export async function createBroadcastAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can send broadcasts.");
  }

  const title = z.string().min(2).parse(formData.get("title"));
  const message = z.string().min(2).parse(formData.get("message"));
  const batchId = z.string().uuid().optional().or(z.literal("")).parse(formData.get("batch_id"));
  const branchId = z.string().uuid().optional().or(z.literal("")).parse(formData.get("branch_id"));
  const channel = z.enum(["whatsapp", "email", "both"]).default("both").parse(formData.get("channel") ?? "both");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("broadcast_messages").insert({
    centre_id: appContext.centre.id,
    branch_id: branchId || null,
    batch_id: batchId || null,
    title,
    message,
    created_by: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  let studentsQuery = supabase
    .from("students")
    .select("id, branch_id, batch_id, parent_phone, parent_email")
    .eq("centre_id", appContext.centre.id)
    .eq("status", "active");

  if (branchId) {
    studentsQuery = studentsQuery.eq("branch_id", branchId);
  }
  if (batchId) {
    studentsQuery = studentsQuery.eq("batch_id", batchId);
  }

  const { data: students } = await studentsQuery;
  for (const student of students ?? []) {
    const messageBody = buildBroadcastMessage(title, message, appContext.centre.name);

    if ((channel === "whatsapp" || channel === "both") && student.parent_phone) {
      await queueNotification({
        centreId: appContext.centre.id,
        branchId: student.branch_id,
        studentId: student.id,
        batchId: student.batch_id,
        category: "broadcast",
        channel: "whatsapp",
        recipientPhone: student.parent_phone,
        messageBody,
      });
    }

    if ((channel === "email" || channel === "both") && student.parent_email) {
      await queueNotification({
        centreId: appContext.centre.id,
        branchId: student.branch_id,
        studentId: student.id,
        batchId: student.batch_id,
        category: "broadcast",
        channel: "email",
        recipientEmail: student.parent_email,
        messageBody,
        payload: {
          subject: `${appContext.centre.name}: ${title}`,
        },
      });
    }
  }

  revalidatePath("/dashboard/messages");
}

export async function createEnrollmentFormAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can create enrollment forms.");
  }

  const branchId = z.string().uuid().optional().or(z.literal("")).parse(formData.get("branch_id"));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("enrollment_forms").insert({
    centre_id: appContext.centre.id,
    branch_id: branchId || (appContext.branch?.id ?? null),
    token: randomUUID(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/students");
}

export async function processEnrollmentSubmissionAction(formData: FormData) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  if (!appContext.centre || appContext.role === "teacher") {
    throw new Error("Only owners and admins can process submissions.");
  }

  const submissionId = z.string().uuid().parse(formData.get("submission_id"));
  const action = z.enum(["accept", "reject"]).parse(formData.get("decision"));
  const supabase = await createServerSupabaseClient();

  if (action === "reject") {
    await supabase
      .from("enrollment_submissions")
      .update({ status: "rejected" })
      .eq("id", submissionId);
    revalidatePath("/dashboard/students");
    return;
  }

  const { data: submission, error: fetchError } = await supabase
    .from("enrollment_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    throw new Error(fetchError?.message ?? "Submission not found.");
  }
  const typedSubmission = submission as EnrollmentSubmissionRecord;

  const { data: student, error: studentError } = await insertStudentWithParentEmailFallback(
    {
      centre_id: appContext.centre.id,
      branch_id: typedSubmission.branch_id,
      name: typedSubmission.student_name,
      parent_name: typedSubmission.parent_name,
      parent_email: typedSubmission.parent_email,
      parent_phone: typedSubmission.parent_phone,
      fee_amount: 0,
      fee_due_date: 5,
      portal_token: randomUUID(),
    },
    true
  );

  if (studentError) {
    throw new Error(studentError.message);
  }
  if (!student) {
    throw new Error("Student could not be created.");
  }

  await supabase
    .from("enrollment_submissions")
    .update({
      status: "accepted",
      linked_student_id: student.id,
    })
    .eq("id", submissionId);

  revalidatePath("/dashboard/students");
}
