import DashboardLayout from '../../components/DashboardLayout.js';
import { DashboardShellProvider } from '../../components/DashboardShellProvider.js';

export default function DashboardRouteLayout({ children }) {
  return (
    <DashboardShellProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardShellProvider>
  );
}
