import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "../password-form";

export default async function ChangePasswordPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const hasPassword = Boolean(session.user.passwordHash);
  const mustChange = Boolean(session.user.passwordMustChange);

  return (
    <main className="max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{mustChange ? "Defina uma nova senha" : "Trocar senha"}</CardTitle>
          <CardDescription>
            {mustChange
              ? "Sua senha foi resetada. Defina uma nova antes de continuar."
              : "Atualize sua senha de acesso ao bolão."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm hasPassword={hasPassword} />
        </CardContent>
      </Card>
    </main>
  );
}
