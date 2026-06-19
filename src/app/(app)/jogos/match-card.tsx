"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { savePrediction } from "./actions";
import { cn } from "@/lib/utils";
import { brDateFormat } from "@/lib/date";
import type { Match, Team, Prediction } from "@/lib/db/schema";

interface Props {
  match: Match;
  home: Team | null;
  away: Team | null;
  prediction: Prediction | null;
}

const DEADLINE_OFFSET_SECONDS = 15 * 60;

const KNOCKOUT_STAGES = new Set(["r32", "r16", "qf", "sf", "3rd", "final"]);

function stageLabel(match: Match) {
  if (match.stage === "group") {
    return `Grupo ${match.groupCode ?? ""} \u2022 Rodada ${match.round ?? ""}`.trim();
  }
  const map: Record<string, string> = {
    r32: "Rodada de 32",
    r16: "Oitavas de final",
    qf: "Quartas de final",
    sf: "Semifinal",
    "3rd": "Disputa de 3\u00ba lugar",
    final: "Final",
  };
  return map[match.stage] ?? match.stage.toUpperCase();
}

export function MatchCard({ match, home, away, prediction }: Props) {
  const isKnockout = KNOCKOUT_STAGES.has(match.stage);
  const hasTeams = home != null && away != null;

  const [homeScore, setHomeScore] = useState<string>(prediction ? String(prediction.homeScore) : "");
  const [awayScore, setAwayScore] = useState<string>(prediction ? String(prediction.awayScore) : "");
  const [advancingTeamId, setAdvancingTeamId] = useState<string>(
    prediction?.advancingTeamId != null ? String(prediction.advancingTeamId) : "",
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = Math.floor(Date.now() / 1000);
  const isLocked = now > match.scheduledAt - DEADLINE_OFFSET_SECONDS || match.status !== "scheduled";

  useEffect(() => {
    if (homeScore === "" || awayScore === "") return;
    if (isLocked) return;

    const h = Number(homeScore);
    const a = Number(awayScore);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 20 || a > 20) return;

    const advId = advancingTeamId ? Number(advancingTeamId) : null;
    if (
      prediction &&
      prediction.homeScore === h &&
      prediction.awayScore === a &&
      String(prediction.advancingTeamId ?? "") === (advancingTeamId || "")
    ) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus("saving");
      startTransition(async () => {
        const res = await savePrediction({
          matchId: match.id,
          homeScore: h,
          awayScore: a,
          advancingTeamId: isKnockout ? advId : null,
        });
        setStatus(res.ok ? "saved" : "error");
        if (res.ok) setTimeout(() => setStatus("idle"), 1500);
      });
    }, 800);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [homeScore, awayScore, advancingTeamId, isKnockout, isLocked, match.id, prediction]);

  const dateFmt = brDateFormat({
    hour: "2-digit",
    minute: "2-digit",
  });

  const showResultBadge = match.status === "finished" && match.homeScore != null && match.awayScore != null;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-brand-card p-4 sm:p-5 transition-all",
        "border-brand-border hover:border-brand-border-strong",
        prediction && !isLocked && "border-brand-primary/30",
      )}
    >
      <div className="flex items-center justify-between mb-4 text-xs">
        <span className="text-brand-text-muted">{stageLabel(match)}</span>
        <span className="font-mono font-medium text-brand-text">
          {dateFmt.format(new Date(match.scheduledAt * 1000))}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {home?.flagUrl ? (
            <Image
              src={home.flagUrl}
              alt=""
              width={28}
              height={20}
              className="rounded-sm shrink-0 shadow-sm"
            />
          ) : (
            <span className="h-5 w-7 rounded-sm bg-brand-surface-2 shrink-0" />
          )}
          <span className="font-medium truncate text-sm sm:text-base">
            {home?.namePt ?? "\u2014"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {showResultBadge ? (
            <>
              <span className={cn(
                "w-11 sm:w-12 h-11 flex items-center justify-center text-center font-display font-bold text-base rounded-xl bg-brand-surface-2",
                match.winnerTeamId === match.homeTeamId && "bg-brand-primary/15 text-brand-primary",
              )}>{match.homeScore}</span>
              <span className="text-brand-text-muted text-sm">x</span>
              <span className={cn(
                "w-11 sm:w-12 h-11 flex items-center justify-center text-center font-display font-bold text-base rounded-xl bg-brand-surface-2",
                match.winnerTeamId === match.awayTeamId && "bg-brand-primary/15 text-brand-primary",
              )}>{match.awayScore}</span>
            </>
          ) : (
            <>
              <ScoreInput
                value={homeScore}
                onChange={setHomeScore}
                disabled={isLocked}
                label={`Placar ${home?.namePt ?? "casa"}`}
              />
              <span className="text-brand-text-muted text-sm">x</span>
              <ScoreInput
                value={awayScore}
                onChange={setAwayScore}
                disabled={isLocked}
                label={`Placar ${away?.namePt ?? "fora"}`}
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 justify-end min-w-0">
          <span className="font-medium truncate text-right text-sm sm:text-base">
            {away?.namePt ?? "\u2014"}
          </span>
          {away?.flagUrl ? (
            <Image
              src={away.flagUrl}
              alt=""
              width={28}
              height={20}
              className="rounded-sm shrink-0 shadow-sm"
            />
          ) : (
            <span className="h-5 w-7 rounded-sm bg-brand-surface-2 shrink-0" />
          )}
        </div>
      </div>

      {isKnockout && hasTeams && !showResultBadge && (
        <div className="mt-3">
          <label className="text-xs text-brand-text-muted block mb-1.5">
            Quem passa? {isLocked ? "(trancado)" : ""}
          </label>
          <select
            value={advancingTeamId}
            onChange={(e) => setAdvancingTeamId(e.target.value)}
            disabled={isLocked}
            className={cn(
              "w-full h-10 rounded-xl border border-brand-border bg-brand-surface-2 px-3 text-sm font-medium",
              "focus:bg-brand-card focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              !advancingTeamId && "text-brand-text-muted",
            )}
          >
            <option value="">Selecione...</option>
            <option value={String(home!.id)}>{home!.namePt}</option>
            <option value={String(away!.id)}>{away!.namePt}</option>
          </select>
        </div>
      )}

      {isKnockout && hasTeams && showResultBadge && match.winnerTeamId && (
        <div className="mt-2.5 text-xs text-brand-primary font-medium text-center">
          Classificou: {match.winnerTeamId === home?.id ? home.namePt : away?.namePt}
        </div>
      )}

      <div className="mt-4 pt-3.5 border-t border-brand-border flex items-center justify-between text-xs gap-3">
        <span className="flex items-center gap-1.5 text-brand-text-muted truncate">
          {match.venue && (
            <>
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{match.venue}</span>
            </>
          )}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          {!isLocked && status === "saving" && <span className="text-brand-text-muted">Salvando\u2026</span>}
          {!isLocked && status === "saved" && <span className="text-brand-primary">\u2713 Salvo</span>}
          {!isLocked && status === "error" && <span className="text-brand-danger">Erro ao salvar</span>}
          {isLocked && (
            <span className="flex items-center gap-1 text-brand-text-muted">
              <Lock className="h-3 w-3" />
              Trancado
            </span>
          )}
          <Link
            href={`/jogos/${match.id}`}
            className="flex items-center gap-1 text-brand-primary hover:underline font-medium"
          >
            Detalhes & coment\u00e1rios
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={20}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-11 sm:w-12 h-11 text-center font-display font-bold text-base px-0",
        "rounded-xl border-brand-border bg-brand-surface-2",
        "focus:bg-brand-card focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
        "disabled:opacity-100 disabled:bg-brand-surface-2/50",
      )}
      placeholder="-"
      aria-label={label}
    />
  );
}