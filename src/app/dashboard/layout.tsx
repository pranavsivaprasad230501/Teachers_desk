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
    <div className="h-full relative antialiased bg-gray-50">
      <div className="hidden h-full lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-50">
        <Sidebar role={appContext.role} />
      </div>
      <main className="lg:pl-72 h-full flex flex-col">
        <Header
          centreName={appContext.centre?.name}
          userLabel={user.phone ?? user.email ?? 'Owner'}
          subscriptionLabel={appContext.subscription?.status ?? 'Setup required'}
          roleLabel={appContext.role}
          branchLabel={appContext.branch?.name ?? null}
        />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
