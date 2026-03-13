import { AuthShell } from '@/components/auth-shell';
import { Dashboard } from '@/components/dashboard';

export default function DashboardPage() {
  return (
    <AuthShell>
      <Dashboard />
    </AuthShell>
  );
}
