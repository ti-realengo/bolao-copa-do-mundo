"use client";

import { logout } from "@/app/actions/logout";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm">Sair</Button>
    </form>
  );
}
