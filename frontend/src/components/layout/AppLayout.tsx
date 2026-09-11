import { Outlet } from 'react-router';
import { Navbar } from './Navbar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
