import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AppContext,
  AttendanceRecord,
  AttendanceStudentRow,
  BatchRecord,
  BranchRecord,
  CentreRecord,
  EnrollmentFormWithBranch,
  EnrollmentSubmissionWithBranch,
  FeeRecord,
  FeeWithStudent,
  HolidayWithBranch,
  NotificationMessageWithRelations,
  RiskAlertWithStudent,
  StaffMembershipRecord,
  StaffInviteRecord,
  SubscriptionRecord,
  SubscriptionStatus,
  StudentRecord,
  StudentWithBatchAndBranch,
  TestScoreWithStudent,
  TestScoreWithTest,
  TestWithBatch,
  TimetableEntryWithBatch,
} from "@/lib/types";

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

function getTrialEndDate() {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14);
  return trialEndDate.toISOString();
}

export function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export async function claimPendingStaffInvites(userId: string, phone: string | null) {
  if (!phone) {
    return;
  }

  const normalized = phone.startsWith("+") ? phone : `+${phone}`;
  const supabase = createAdminSupabaseClient();
  const { data: invites } = await supabase
    .from("staff_invites")
    .select("*")
    .is("claimed_by_user_id", null)
    .eq("phone", normalized);

  for (const invite of (invites ?? []) as StaffInviteRecord[]) {
    await supabase.from("staff_memberships").upsert(
      {
        user_id: userId,
        centre_id: invite.centre_id,
        branch_id: invite.branch_id,
        role: invite.role,
      },
      { onConflict: "user_id,centre_id" }
    );

    await supabase
      .from("staff_invites")
      .update({ claimed_by_user_id: userId })
      .eq("id", invite.id);
  }
}

export const getOwnedCentre = cache(async (userId: string): Promise<CentreRecord | null> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("centres")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CentreRecord | null) ?? null;
});

export async function getOwnedCentreOrThrow(userId: string) {
  const centre = await getOwnedCentre(userId);
  if (!centre) {
    throw new Error("Centre not found for this user.");
  }

  return centre;
}

export async function getMembershipForUser(userId: string): Promise<StaffMembershipRecord | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("staff_memberships")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as StaffMembershipRecord | null) ?? null;
}

async function ensureOwnerMembership(userId: string, centre: CentreRecord) {
  const adminSupabase = createAdminSupabaseClient();
  const { data: existingMembership, error: membershipError } = await adminSupabase
    .from("staff_memberships")
    .select("*")
    .eq("user_id", userId)
    .eq("centre_id", centre.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (existingMembership) {
    return existingMembership as StaffMembershipRecord;
  }

  const branches = await getBranchesForCentre(centre.id);
  const defaultBranchId = branches[0]?.id ?? null;
  const { data, error } = await adminSupabase
    .from("staff_memberships")
    .upsert(
      {
        user_id: userId,
        centre_id: centre.id,
        branch_id: defaultBranchId,
        role: "owner",
      },
      { onConflict: "user_id,centre_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StaffMembershipRecord;
}

export async function getBranchesForCentre(centreId: string): Promise<BranchRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("centre_id", centreId)
    .order("is_main", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BranchRecord[];
}

export async function ensureDefaultBranch(centreId: string): Promise<BranchRecord> {
  async function fetchBranches() {
    return getBranchesForCentre(centreId);
  }

  const existingBranches = await fetchBranches();
  if (existingBranches.length > 0) {
    return existingBranches[0];
  }

  const centre = await getOwnedCentreById(centreId);
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({
      centre_id: centreId,
      name: `${centre?.name ?? "Main"} Branch`,
      phone: centre?.phone ?? null,
      address: centre?.address ?? null,
      is_main: true,
    })
    .select("*")
    .single();

  if (!error) {
    return data as BranchRecord;
  }

  const retriedBranches = await fetchBranches();
  if (retriedBranches.length > 0) {
    return retriedBranches[0];
  }

  throw new Error(error.message);
}

export async function getOwnedCentreById(centreId: string): Promise<CentreRecord | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("centres")
    .select("*")
    .eq("id", centreId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CentreRecord | null) ?? null;
}

export async function ensureTrialSubscription(centreId: string): Promise<SubscriptionRecord> {
  const supabase = createAdminSupabaseClient();

  async function fetchExisting() {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("centre_id", centreId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as SubscriptionRecord | null) ?? null;
  }

  const existing = await fetchExisting();
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      centre_id: centreId,
      status: "trialing",
      trial_ends_at: getTrialEndDate(),
    })
    .select("*")
    .single();

  if (!error) {
    return data as SubscriptionRecord;
  }

  if (error.code === "23505") {
    const retried = await fetchExisting();
    if (retried) {
      return retried;
    }
  }

  throw new Error(error.message);
}

export async function getSubscriptionForCentre(centreId: string) {
  return ensureTrialSubscription(centreId);
}

export async function hasPaidAccess(centreId: string) {
  const subscription = await getSubscriptionForCentre(centreId);
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status);
}

export async function getAppContextForUser(args: {
  userId: string;
  phone: string | null;
}) {
  await claimPendingStaffInvites(args.userId, args.phone);

  const ownedCentre = await getOwnedCentre(args.userId);
  const membership = ownedCentre
    ? await ensureOwnerMembership(args.userId, ownedCentre)
    : await getMembershipForUser(args.userId);

  const centre = ownedCentre
    ? ownedCentre
    : membership
      ? await getOwnedCentreById(membership.centre_id)
      : null;

  const branches = centre ? await getBranchesForCentre(centre.id) : [];
  const branch = membership?.branch_id
    ? branches.find((item) => item.id === membership.branch_id) ?? null
    : branches[0] ?? null;
  const subscription = centre ? await getSubscriptionForCentre(centre.id) : null;

  return {
    userId: args.userId,
    phone: args.phone,
    centre,
    branch,
    branches,
    membership,
    role: membership?.role ?? (ownedCentre ? "owner" : null),
    subscription,
  } satisfies AppContext;
}

export async function getCentreOrThrow(appContext: AppContext) {
  if (!appContext.centre) {
    throw new Error("No centre configured for this account.");
  }

  return appContext.centre;
}

export async function getBatchesForContext(appContext: AppContext): Promise<BatchRecord[]> {
  const centre = await getCentreOrThrow(appContext);
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("batches")
    .select("*")
    .eq("centre_id", centre.id)
    .order("created_at", { ascending: true });

  if (appContext.role === "teacher") {
    const { data: assignments } = await supabase
      .from("teacher_batch_assignments")
      .select("batch_id")
      .eq("teacher_user_id", appContext.userId);
    const batchIds = (assignments ?? []).map((item) => item.batch_id);
    if (batchIds.length === 0) {
      return [];
    }
    query = query.in("id", batchIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BatchRecord[];
}

export async function getBatchesForCentre(centreId: string): Promise<BatchRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("centre_id", centreId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BatchRecord[];
}

export async function getStudentsForContext(
  appContext: AppContext
): Promise<StudentWithBatchAndBranch[]> {
  const centre = await getCentreOrThrow(appContext);
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("students")
    .select("*, batches(name), branches(name)")
    .eq("centre_id", centre.id)
    .order("created_at", { ascending: false });

  if (appContext.role === "teacher") {
    const batches = await getBatchesForContext(appContext);
    const batchIds = batches.map((batch) => batch.id);
    if (batchIds.length === 0) {
      return [];
    }
    query = query.in("batch_id", batchIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StudentWithBatchAndBranch[];
}

export async function getStudentsForCentre(centreId: string): Promise<StudentWithBatchAndBranch[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("students")
    .select("*, batches(name), branches(name)")
    .eq("centre_id", centreId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StudentWithBatchAndBranch[];
}

export async function getStudentsForBatch(batchId: string): Promise<StudentRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("batch_id", batchId)
    .order("roll_number", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StudentRecord[];
}

export async function getAttendanceForDate(
  batchId: string,
  date: string
): Promise<AttendanceStudentRow[]> {
  const students = await getStudentsForBatch(batchId);
  if (students.length === 0) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const studentIds = students.map((student) => student.id);
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("date", date)
    .in("student_id", studentIds);

  if (error) {
    throw new Error(error.message);
  }

  return students.map((student) => {
    const attendance = (data as AttendanceRecord[] | null)?.find(
      (entry) => entry.student_id === student.id
    );
    return {
      ...student,
      attendance_status: attendance?.status ?? null,
    };
  });
}

export async function ensureFeesForMonth(centreId: string, month: string) {
  const supabase = await createServerSupabaseClient();
  const { data: students, error: studentError } = await supabase
    .from("students")
    .select("id, fee_amount")
    .eq("centre_id", centreId)
    .eq("status", "active");

  if (studentError) {
    throw new Error(studentError.message);
  }

  const rows: Array<{
    student_id: string;
    month: string;
    status: "unpaid";
    amount_due: number;
  }> = ((students ?? []) as Array<Pick<StudentRecord, "id" | "fee_amount">>).map((student) => ({
    student_id: student.id,
    month,
    status: "unpaid",
    amount_due: student.fee_amount,
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("fees")
      .upsert(rows, { onConflict: "student_id,month", ignoreDuplicates: true });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function getFeesForMonth(centreId: string, month: string): Promise<FeeWithStudent[]> {
  await ensureFeesForMonth(centreId, month);
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("fees")
    .select("*, students!inner(name, fee_due_date, centre_id, branches(name), batches(name))")
    .eq("month", month)
    .eq("students.centre_id", centreId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FeeWithStudent[];
}

export async function getTimetableForContext(
  appContext: AppContext
): Promise<TimetableEntryWithBatch[]> {
  const batches = await getBatchesForContext(appContext);
  const batchIds = batches.map((batch) => batch.id);
  if (batchIds.length === 0) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("timetable_entries")
    .select("*, batches(name, subject, grade)")
    .in("batch_id", batchIds)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TimetableEntryWithBatch[];
}

export async function getHolidaysForCentre(centreId: string): Promise<HolidayWithBranch[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("holidays")
    .select("*, branches(name)")
    .eq("centre_id", centreId)
    .order("holiday_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as HolidayWithBranch[];
}

export async function getTestsForContext(appContext: AppContext): Promise<TestWithBatch[]> {
  const batches = await getBatchesForContext(appContext);
  const batchIds = batches.map((batch) => batch.id);
  if (batchIds.length === 0) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tests")
    .select("*, batches(name, subject)")
    .in("batch_id", batchIds)
    .order("test_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TestWithBatch[];
}

export async function getTestScores(testId: string): Promise<TestScoreWithStudent[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("test_scores")
    .select("*, students(name)")
    .eq("test_id", testId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TestScoreWithStudent[];
}

export async function getRiskAlertsForCentre(
  centreId: string
): Promise<RiskAlertWithStudent[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("risk_alerts")
    .select("*, students(name, parent_phone, batches(name))")
    .eq("centre_id", centreId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RiskAlertWithStudent[];
}

export async function getNotificationMessagesForCentre(
  centreId: string
): Promise<NotificationMessageWithRelations[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notification_messages")
    .select("*, students(name), branches(name), batches(name)")
    .eq("centre_id", centreId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NotificationMessageWithRelations[];
}

export async function getEnrollmentFormsForCentre(
  centreId: string
): Promise<EnrollmentFormWithBranch[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("enrollment_forms")
    .select("*, branches(name)")
    .eq("centre_id", centreId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EnrollmentFormWithBranch[];
}

export async function getEnrollmentSubmissionsForCentre(
  centreId: string
): Promise<EnrollmentSubmissionWithBranch[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("enrollment_submissions")
    .select("*, branches(name)")
    .eq("centre_id", centreId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EnrollmentSubmissionWithBranch[];
}

export async function getDashboardStats(appContext: AppContext) {
  const centre = await getCentreOrThrow(appContext);
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const month = getMonthKey();
  await ensureFeesForMonth(centre.id, month);
  const { data: centreStudents, error: centreStudentsError } = await supabase
    .from("students")
    .select("id")
    .eq("centre_id", centre.id);

  if (centreStudentsError) {
    throw new Error(centreStudentsError.message);
  }
  const studentIds = (centreStudents ?? []).map((student) => student.id);

  const [studentsResponse, batchesResponse, feesResponse, attendanceResponse, alertsResponse] =
    await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }).eq("centre_id", centre.id),
      supabase.from("batches").select("id", { count: "exact", head: true }).eq("centre_id", centre.id),
      adminSupabase
        .from("fees")
        .select("status, amount_due, amount_paid, students!inner(centre_id)")
        .eq("month", month)
        .eq("students.centre_id", centre.id),
      studentIds.length > 0
        ? adminSupabase.from("attendance").select("status").in("student_id", studentIds)
        : Promise.resolve({ data: [], error: null }),
      adminSupabase
        .from("risk_alerts")
        .select("id", { count: "exact", head: true })
        .eq("centre_id", centre.id)
        .eq("status", "open"),
    ]);

  if (studentsResponse.error || batchesResponse.error || feesResponse.error || attendanceResponse.error || alertsResponse.error) {
    throw new Error(
      studentsResponse.error?.message ??
        batchesResponse.error?.message ??
        feesResponse.error?.message ??
        attendanceResponse.error?.message ??
        alertsResponse.error?.message ??
        "Failed to load dashboard stats."
    );
  }

  const fees = (feesResponse.data ?? []) as FeeRecord[];
  const attendance = (attendanceResponse.data ?? []) as Pick<AttendanceRecord, "status">[];
  const presentCount = attendance.filter((item) => item.status === "present").length;
  const attendanceRate =
    attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  return {
    totalStudents: studentsResponse.count ?? 0,
    totalBatches: batchesResponse.count ?? 0,
    overdueFees: fees.filter((fee) => fee.status !== "paid").length,
    collectedAmount: fees.reduce((total, fee) => total + Number(fee.amount_paid ?? 0), 0),
    pendingAmount: fees
      .filter((fee) => fee.status !== "paid")
      .reduce((total, fee) => total + Number(fee.amount_due ?? 0), 0),
    attendanceRate,
    openAlerts: alertsResponse.count ?? 0,
  };
}

export async function getRecentAttendanceForPortal(
  studentId: string
): Promise<Array<Pick<AttendanceRecord, "date" | "status">>> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("date, status")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<Pick<AttendanceRecord, "date" | "status">>;
}

export async function getTestScoresForStudent(studentId: string): Promise<TestScoreWithTest[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("test_scores")
    .select("marks, tests(title, max_marks, test_date)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TestScoreWithTest[];
}
