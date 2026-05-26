import { ImageResponse } from "next/og";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { loadBranding } from "@/lib/email/branding";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1).then((r) => r[0]);
  if (!user || user.deletedAt) {
    return new Response("Not found", { status: 404 });
  }

  const snap = await db.select().from(schema.rankingsSnapshot).where(eq(schema.rankingsSnapshot.userId, userId)).limit(1).then((r) => r[0]);
  const branding = await loadBranding();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #009C3B 0%, #002776 100%)",
          color: "white",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, opacity: 0.85 }}>
          Bolão · {branding.companyName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1 }}>
            {user.name ?? user.email.split("@")[0]}
          </div>
          <div style={{ display: "flex", gap: 60, marginTop: 32 }}>
            <Stat label="Posição" value={snap?.position ? `${snap.position}º` : "—"} />
            <Stat label="Pontos" value={String(snap?.totalPoints ?? 0)} />
            <Stat label="Cravadas" value={String(snap?.exactCount ?? 0)} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, opacity: 0.7 }}>
          <span>Copa do Mundo 2026</span>
          <span>⚽</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 22, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 80, fontWeight: 900, lineHeight: 1 }}>{value}</span>
    </div>
  );
}
