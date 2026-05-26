import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinLeagueForm } from "./form";

export default function EntrarGrupoPage() {
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Entrar em um grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <JoinLeagueForm />
        </CardContent>
      </Card>
    </div>
  );
}
