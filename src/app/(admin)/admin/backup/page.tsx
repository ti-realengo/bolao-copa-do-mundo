import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackupButton } from "./backup-button";
import { listBackups } from "./actions";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  const result = await listBackups();
  const backups = result.ok ? result.backups : [];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Backup do Banco de Dados</h1>
      <p className="text-sm text-brand-text-muted">
        Exporta um dump SQLite completo do D1 para o bucket R2. O arquivo pode ser
        usado para restaurar o banco em caso de problema.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exportar backup</CardTitle>
        </CardHeader>
        <CardContent>
          <BackupButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backups existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {!result.ok ? (
            <p className="text-sm text-brand-text-muted">{result.error}</p>
          ) : backups.length === 0 ? (
            <p className="text-sm text-brand-text-muted">Nenhum backup encontrado.</p>
          ) : (
            <ul className="space-y-2">
              {backups.map((b) => (
                <li key={b.key} className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-card px-4 py-3 text-sm">
                  <span className="font-mono text-xs break-all">{b.key}</span>
                  <span className="text-brand-text-muted ml-4 shrink-0">
                    {(b.size / 1024).toFixed(1)} KB · {new Date(b.uploaded).toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}