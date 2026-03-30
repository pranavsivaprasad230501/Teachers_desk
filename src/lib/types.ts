import type { Database } from "@/lib/database.types";

export type StaffRole = "owner" | "admin" | "teacher";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];

export type CentreRecord = TableRow<"centres">;
export type BranchRecord = TableRow<"branches">;
export type StaffMembershipRecord = TableRow<"staff_memberships"> & {
  role: StaffRole;
};
export type SubscriptionRecord = TableRow<"subscriptions"> & {
  status: SubscriptionStatus;
};
export type BatchRecord = TableRow<"batches">;
export type StudentRecord = TableRow<"students">;
export type AttendanceRecord = TableRow<"attendance">;
export type FeeRecord = TableRow<"fees">;
export type RiskAlertRecord = TableRow<"risk_alerts">;
export type NotificationMessageRecord = TableRow<"notification_messages">;
export type EnrollmentFormRecord = TableRow<"enrollment_forms">;
export type EnrollmentSubmissionRecord = TableRow<"enrollment_submissions">;
export type TimetableEntryRecord = TableRow<"timetable_entries">;
export type TestRecord = TableRow<"tests">;
export type TestScoreRecord = TableRow<"test_scores">;
export type StaffInviteRecord = TableRow<"staff_invites">;

export type StudentWithBatchAndBranch = StudentRecord & {
  batches?: Pick<BatchRecord, "name"> | null;
  branches?: Pick<BranchRecord, "name"> | null;
};

export type AttendanceStudentRow = StudentRecord & {
  attendance_status: AttendanceRecord["status"] | null;
};

export type FeeWithStudent = FeeRecord & {
  students?: (Pick<StudentRecord, "name" | "fee_due_date"> & {
    branches?: Pick<BranchRecord, "name"> | null;
    batches?: Pick<BatchRecord, "name"> | null;
  }) | null;
};

export type TimetableEntryWithBatch = TimetableEntryRecord & {
  batches?: Pick<BatchRecord, "name" | "subject" | "grade"> | null;
};

export type TestWithBatch = TestRecord & {
  batches?: Pick<BatchRecord, "name" | "subject"> | null;
};

export type TestScoreWithStudent = TestScoreRecord & {
  students?: Pick<StudentRecord, "name"> | null;
};

export type RiskAlertWithStudent = RiskAlertRecord & {
  students?: (Pick<StudentRecord, "name" | "parent_phone"> & {
    batches?: Pick<BatchRecord, "name"> | null;
  }) | null;
};

export type NotificationMessageWithRelations = NotificationMessageRecord & {
  students?: Pick<StudentRecord, "name"> | null;
  branches?: Pick<BranchRecord, "name"> | null;
  batches?: Pick<BatchRecord, "name"> | null;
};

export type EnrollmentFormWithBranch = EnrollmentFormRecord & {
  centres?: Pick<CentreRecord, "name"> | null;
  branches?: Pick<BranchRecord, "name"> | null;
};

export type EnrollmentSubmissionWithBranch = EnrollmentSubmissionRecord & {
  branches?: Pick<BranchRecord, "name"> | null;
};

export type PortalStudent = StudentRecord & {
  centres?: Pick<CentreRecord, "name" | "phone"> | null;
  batches?: Pick<BatchRecord, "name"> | null;
};

export type TestScoreWithTest = Pick<TestScoreRecord, "marks"> & {
  tests?: Pick<TestRecord, "title" | "max_marks" | "test_date"> | null;
};

export type AppContext = {
  userId: string;
  phone: string | null;
  centre: CentreRecord | null;
  branch: BranchRecord | null;
  branches: BranchRecord[];
  membership: StaffMembershipRecord | null;
  role: StaffRole | null;
  subscription: SubscriptionRecord | null;
};
