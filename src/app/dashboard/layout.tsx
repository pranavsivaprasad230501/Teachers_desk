import { requireUser } from '@/lib/auth';
import { getAppContextForUser } from '@/lib/data';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SetupRequired } from '@/components/dashboard/setup-required';
import { isMissingSchemaError } from '@/lib/supabase-errors';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  let appContext;

  try {
    appContext = await getAppContextForUser({
      userId: user.id,
      phone: user.phone ?? null,
    });
  } catch (error) {
    if (isMissingSchemaError(error)) {
      const message = error instanceof Error ? error.message : "Database setup is incomplete.";
      return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <SetupRequired message={message} />
        </div>
      );
    }

    throw error;
  }

  return (
    <div className="relative h-full antialiased bg-[linear-gradient(180deg,#f8fbff_0%,#fdfefe_46%,#fff8f1_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-14 h-48 w-48 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute right-[-4rem] top-40 h-56 w-56 rounded-full bg-orange-200/25 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-44 w-44 rounded-full bg-teal-200/20 blur-3xl" />
      </div>
      <div className="hidden h-full lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-50">
        <Sidebar role={appContext.role} />
      </div>
      <main className="relative lg:pl-72 h-full flex flex-col">
        <Header
          centreName={appContext.centre?.name}
          userLabel={user.phone ?? user.email ?? 'Owner'}
          subscriptionLabel={appContext.subscription?.status ?? 'Setup required'}
          roleLabel={appContext.role}
          branchLabel={appContext.branch?.name ?? null}
        />
        <div className="relative flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
