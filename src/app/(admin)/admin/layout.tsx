import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "superadmin") redirect("/jogos");
  if (session.user.passwordMustChange) redirect("/perfil/senha");

  return <AppShell requireRole="superadmin">{children}</AppShell>;
}
