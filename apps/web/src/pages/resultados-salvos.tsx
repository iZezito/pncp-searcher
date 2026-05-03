import { useQueryState, parseAsInteger } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  ExternalLink,
  FileText,
  Loader2,
  Ruler,
  Link2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";
import type { ItemBuscaPage } from "@/types/deep-search";

export default function ResultadosSalvos() {
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1),
  );
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(20),
  );

  const { data, isLoading } = useQuery<ItemBuscaPage>({
    queryKey: ["itens-busca", page, pageSize],
    queryFn: async () => {
      const res = await api.get<ItemBuscaPage>("/itens-busca", {
        params: { page, pageSize },
      });
      return res.data;
    },
  });

  const totalPages = data?.totalPages ?? 1;
  const itens = data?.data ?? [];
  const total = data?.total ?? 0;

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <PageLayout
      breadcrumbs={[{ label: "Resultados Salvos" }]}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Resultados Salvos
          </h1>
          <p className="text-muted-foreground text-sm">
            Resultados de busca salvos anteriormente.
          </p>
        </div>
        {total > 0 && (
          <Badge variant="secondary" className="text-sm">
            {total} {total === 1 ? "resultado" : "resultados"}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="size-5" />
            Itens Salvos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Bookmark className="size-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Nenhum resultado salvo ainda.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Salve resultados durante a busca para vê-los aqui.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">
                        Descrição
                      </TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Pág.</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="max-w-[300px]">
                          <p className="truncate font-medium">
                            {item.descricao}
                          </p>
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate block mt-0.5"
                            >
                              {item.link}
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          R$ {item.valor.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.unidadeMedida}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          <span className="truncate block text-sm text-muted-foreground">
                            {item.fonte}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {item.paginaExterna}/{item.paginaInterna}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {itens.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <p className="font-medium text-sm mb-2 line-clamp-2">
                        {item.descricao}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <span className="font-semibold text-foreground">
                            R$ {item.valor.toFixed(2)}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Ruler className="size-3" />
                          {item.unidadeMedida}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="size-3" />
                          Pág. {item.paginaExterna}/{item.paginaInterna}
                        </span>
                      </div>

                      {item.fonte && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {item.fonte}
                        </p>
                      )}

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline break-all flex items-center gap-1 mb-1"
                        >
                          <Link2 className="size-3 shrink-0" />
                          {item.link}
                        </a>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(item.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-6">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  {getPageNumbers().map((p, i) =>
                    p === "ellipsis" ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="flex size-8 items-center justify-center text-sm text-muted-foreground"
                      >
                        …
                      </span>
                    ) : (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "outline"}
                        size="icon"
                        className="size-8 text-sm"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ),
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
