import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AuthShell } from '@/components/auth-shell';
import { Dashboard } from '@/components/dashboard';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <AuthShell name={session.user.name}>
      <Dashboard />
    </AuthShell>
  );
}
