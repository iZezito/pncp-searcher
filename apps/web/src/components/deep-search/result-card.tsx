import { useState } from "react";
import {
  ExternalLink,
  FileText,
  Link2,
  Ruler,
  Bookmark,
  Pin,
  Loader2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { FoundItem } from "@/types/deep-search";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { LinkToPlanilhaModal } from "./link-to-planilha-modal";
import api from "@/services/api";
import { toast } from "sonner";

interface ResultCardProps {
  result: FoundItem;
  planilhaId?: string;
  pinnedItemId?: string | null;
}

export function ResultCard({
  result,
  planilhaId,
  pinnedItemId,
}: ResultCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const vincularFixadoMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/itens/${pinnedItemId}/vincular`, {
        valor: result.valor,
        fonte: result.fonte,
        link: result.link,
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ["itens-planilha", planilhaId],
        (old: any[] | undefined) =>
          old?.map((item) =>
            item.id === pinnedItemId
              ? {
                  ...item,
                  valor: result.valor,
                  fonte: result.fonte,
                  link: result.link,
                }
              : item,
          ),
      );
      toast.success("Vinculado ao item fixado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao vincular ao item fixado");
    },
  });

  const salvarMutation = useMutation({
    mutationFn: async () => {
      return api.post("/itens-busca", {
        descricao: result.descricao,
        valor: result.valor,
        unidadeMedida: result.unidadeMedida,
        link: result.link,
        fonte: result.fonte,
        paginaInterna: result.paginaInterna,
        paginaExterna: result.paginaExterna,
        itemId: pinnedItemId ?? undefined,
      });
    },
    onSuccess: () => {
      toast.success("Resultado salvo com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar resultado");
    },
  });

  return (
    <>
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
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline">{result.unidadeMedida}</Badge>
              <Badge>{result.valor}</Badge>
            </div>
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

            <div className="flex items-center gap-2">
              <Ruler className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Unidade:</span>
              <span className="font-medium">{result.unidadeMedida}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-1">
            {pinnedItemId && (
              <Button
                variant="default"
                size="sm"
                className="w-fit gap-1.5"
                onClick={() => vincularFixadoMutation.mutate()}
                disabled={vincularFixadoMutation.isPending}
              >
                {vincularFixadoMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Pin className="size-4" />
                )}
                Vincular ao fixado
              </Button>
            )}

            {planilhaId && (
              <Button
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                onClick={() => setModalOpen(true)}
              >
                <Link2 className="size-4" />
                Vincular à planilha
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-fit gap-1.5"
              onClick={() => salvarMutation.mutate()}
              disabled={salvarMutation.isPending}
            >
              {salvarMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Bookmark className="size-4" />
              )}
              Salvar resultado
            </Button>
          </div>
        </CardContent>
      </Card>

      {planilhaId && (
        <LinkToPlanilhaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          planilhaId={planilhaId}
          result={result}
        />
      )}
    </>
  );
}
