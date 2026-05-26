import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateLeagueForm } from "./form";

export default function NovoGrupoPage() {
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Novo grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateLeagueForm />
        </CardContent>
      </Card>
    </div>
  );
}
