import { useNavigate } from "react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Pencil, Download, Plus, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLayout } from "@/components/page-layout";
import { CreatePlanilhaDialog } from "@/components/planilhas/create-planilha-dialog";
import api from "@/services/api";
import type { Planilha } from "@/types/planilha";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Planilhas() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: planilhas = [],
    isLoading,
    refetch,
  } = useQuery<Planilha[]>({
    queryKey: ["planilhas"],
    queryFn: async () => {
      const response = await api.get<Planilha[]>("/planilhas");
      return response.data;
    },
  });

  const handleDownload = async (planilha: Planilha) => {
    try {
      const response = await api.get(`/planilhas/${planilha.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${planilha.name}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download iniciado!");
    } catch {
      toast.error("Erro ao baixar planilha");
    }
  };

  return (
    <PageLayout breadcrumbs={[{ label: "Planilhas" }]}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planilhas</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie suas planilhas de orçamento.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="size-4 mr-2" />
          Nova Planilha
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5" />
            Suas Planilhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : planilhas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <FileSpreadsheet className="size-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma planilha encontrada.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
              >
                Criar primeira planilha
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planilhas.map((planilha) => (
                      <TableRow key={planilha.id}>
                        <TableCell className="font-medium">
                          {planilha.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/deep-search/${planilha.id}`)
                              }
                            >
                              <Search className="size-4 mr-1" />
                              Buscar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/planilhas/${planilha.id}/editar`)
                              }
                            >
                              <Pencil className="size-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(planilha)}
                            >
                              <Download className="size-4 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {planilhas.map((planilha) => (
                  <Card key={planilha.id}>
                    <CardContent className="p-4">
                      <p className="font-medium mb-3">{planilha.name}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            navigate(`/deep-search/${planilha.id}`)
                          }
                        >
                          <Search className="size-4 mr-1" />
                          Buscar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            navigate(`/planilhas/${planilha.id}/editar`)
                          }
                        >
                          <Pencil className="size-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(planilha)}
                        >
                          <Download className="size-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CreatePlanilhaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => refetch()}
      />
    </PageLayout>
  );
}
