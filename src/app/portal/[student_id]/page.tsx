import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarCheck, AlertCircle, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeachersDeskLogo } from '@/components/branding/teachers-desk-logo';
import { getRecentAttendanceForPortal, getMonthKey, getTestScoresForStudent } from '@/lib/data';
import { formatCurrency } from '@/lib/format';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { FeeRecord, PortalStudent } from '@/lib/types';

export default async function ParentPortalPage({
  params,
}: {
  params: Promise<{ student_id: string }>;
}) {
  const { student_id } = await params;
  const supabase = createAdminSupabaseClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      student_id
    );
  const studentQuery = supabase
    .from('students')
    .select('*, centres(name, phone), batches(name)')
    .eq('portal_token', student_id)
    .limit(1)
    .maybeSingle();
  const [{ data: studentByToken }, studentByIdResult] = await Promise.all([
    studentQuery,
    isUuid
      ? supabase
          .from('students')
          .select('*, centres(name, phone), batches(name)')
          .eq('id', student_id)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const studentById = studentByIdResult.data as PortalStudent | null;
  const student = (studentByToken as PortalStudent | null) ?? studentById;

  if (!student) {
    notFound();
  }

  const [attendance, feeResult, scores] = await Promise.all([
    getRecentAttendanceForPortal(student.id),
    supabase
      .from('fees')
      .select('*')
      .eq('student_id', student.id)
      .eq('month', getMonthKey())
      .limit(1)
      .maybeSingle(),
    getTestScoresForStudent(student.id),
  ]);

  const present = attendance.filter((item) => item.status === 'present').length;
  const total = attendance.length;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  const currentFee = feeResult.data as FeeRecord | null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <TeachersDeskLogo
            className="justify-center"
            compact
            markClassName="mx-auto h-12 w-12 rounded-xl bg-sky-600 shadow-lg"
            iconClassName="h-7 w-7 text-white"
            wordmarkClassName="hidden"
          />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{student.centres?.name}</h1>
          <p className="text-muted-foreground">{student.name}&apos;s Academic Record</p>
        </div>

        {/* Action Required Banner for Fees */}
        {currentFee && currentFee.status !== 'paid' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Fee Payment Due</h3>
              <p className="text-sm text-red-700 mt-1">
                Please pay {formatCurrency(Number(currentFee.amount_due ?? student.fee_amount))} for this month.
              </p>
              <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white w-full shadow-sm" disabled>
                Contact Centre To Pay
              </Button>
            </div>
          </div>
        )}

        {/* Fast Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-sky-100 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <CalendarCheck className="w-6 h-6 text-emerald-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{attendanceRate}%</div>
              <p className="text-xs text-muted-foreground font-medium">Attendance</p>
            </CardContent>
          </Card>
          
          <Card className="border-sky-100 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Clock className="w-6 h-6 text-sky-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <p className="text-xs text-muted-foreground font-medium">Classes Attended</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg">Recent Attendance</CardTitle>
            <CardDescription>{student.batches?.name ?? 'Student Record'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 30 }).map((_, i) => {
                const entry = attendance[i];
                let bgClass = "bg-gray-100 border border-gray-200";
                if (entry?.status === 'present') bgClass = "bg-emerald-500 shadow-sm";
                if (entry?.status === 'absent') bgClass = "bg-red-500 shadow-sm";

                return (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-full flex items-center justify-center ${bgClass}`}
                    title={entry?.date ?? `Day ${i+1}`}
                  >
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground justify-center">
               <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5 shadow-sm"></div> Present</span>
               <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-1.5 shadow-sm"></div> Absent</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg">Recent Test Scores</CardTitle>
            <CardDescription>Progress trend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {scores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tests recorded yet.</p>
            ) : (
              scores.map((score, index) => {
                const percent = Math.round((Number(score.marks) / Number(score.tests?.max_marks || 1)) * 100);
                return (
                  <div key={index} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{score.tests?.title}</p>
                        <p className="text-sm text-muted-foreground">{score.tests?.test_date}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {score.marks}/{score.tests?.max_marks}
                      </p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-sky-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Button variant="outline" className="w-full bg-white h-14 border-gray-200 shadow-sm" disabled>
          <Phone className="w-4 h-4 mr-2 text-sky-600" />
          Call Centre Admin: {student.centres?.phone ?? 'Not available'}
        </Button>
        
        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered securely by Teacher&apos;s Desk for {student.centres?.name}
        </p>

      </div>
    </div>
  );
}
