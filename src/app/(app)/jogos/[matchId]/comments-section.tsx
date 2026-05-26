"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { postComment, deleteComment, hideComment } from "./actions";

interface Comment {
  id: number;
  body: string;
  createdAt: number;
  userId: string;
  userName: string;
}

interface Props {
  matchId: number;
  currentUserId: string;
  isSuperadmin: boolean;
  myComment: { id: number; body: string } | null;
  comments: Comment[];
}

export function CommentsSection({ matchId, currentUserId, isSuperadmin, myComment, comments }: Props) {
  const [body, setBody] = useState(myComment?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const fmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      {!myComment && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await postComment({ matchId, body });
              if (!res.ok) setError(res.error ?? "Erro");
              else setBody("");
            });
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Deixe seu comentário (1 por jogo)…"
            maxLength={280}
            rows={2}
            className="w-full rounded-xl border border-brand-border bg-brand-card p-3 text-sm resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-brand-text-muted">{body.length}/280</span>
            <Button type="submit" size="sm" disabled={isPending || body.trim().length < 2}>
              {isPending ? "Enviando…" : "Comentar"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-brand-text-muted text-center py-4">Seja o primeiro a comentar.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl bg-brand-surface p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-sm">{c.userName}</span>
                <span className="text-xs text-brand-text-muted">{fmt.format(new Date(c.createdAt * 1000))}</span>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">{c.body}</p>
              <div className="flex gap-3 mt-2">
                {c.userId === currentUserId && (
                  <button
                    className="text-xs text-brand-text-muted hover:text-red-500"
                    onClick={() => start(async () => { await deleteComment(c.id); })}
                  >
                    apagar
                  </button>
                )}
                {isSuperadmin && c.userId !== currentUserId && (
                  <button
                    className="text-xs text-brand-text-muted hover:text-red-500"
                    onClick={() => start(async () => { await hideComment(c.id); })}
                  >
                    ocultar (admin)
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
