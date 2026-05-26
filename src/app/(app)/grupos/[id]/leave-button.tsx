"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { leaveLeague } from "../actions";

export function LeaveButton({ leagueId }: { leagueId: string }) {
  const [isPending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Sair deste grupo?")) return;
        start(async () => {
          await leaveLeague(leagueId);
        });
      }}
    >
      {isPending ? "Saindo…" : "Sair do grupo"}
    </Button>
  );
}
