import { ExternalLink, FileText, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { FoundItem } from "@/types/deep-search";
import { Badge } from "../ui/badge";

interface ResultCardProps {
  result: FoundItem;
}

export function ResultCard({ result }: ResultCardProps) {
  return (
    <Card className="w-full transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="size-4 text-primary shrink-0" />
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {result.link}
            </a>
          </CardTitle>
          <Badge className="shrink-0">{result.valor}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{result.descricao}</p>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Interna:</span>
            <span className="font-medium">{result.paginaInterna}</span>
          </div>

          <div className="flex items-center gap-2">
            <ExternalLink className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Externa:</span>
            <span className="font-medium">{result.paginaExterna}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
