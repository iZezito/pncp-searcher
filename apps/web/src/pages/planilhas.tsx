import { useNavigate } from "react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Pencil,
  Download,
  Plus,
  FileSpreadsheet,
  Trash2,
  Loader2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLayout } from "@/components/page-layout";
import { CreatePlanilhaDialog } from "@/components/planilhas/create-planilha-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

const renameSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

type RenameValues = z.infer<typeof renameSchema>;

export default function Planilhas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Planilha | null>(null);
  const [renameTarget, setRenameTarget] = useState<Planilha | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/planilhas/${id}`);
    },
    onSuccess: () => {
      toast.success("Planilha excluída com sucesso!");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["planilhas"] });
    },
    onError: () => {
      toast.error("Erro ao excluir planilha");
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return api.put(`/planilhas/${id}`, { name });
    },
    onSuccess: () => {
      toast.success("Planilha renomeada com sucesso!");
      setRenameTarget(null);
      queryClient.invalidateQueries({ queryKey: ["planilhas"] });
    },
    onError: () => {
      toast.error("Erro ao renomear planilha");
    },
  });

  const renameForm = useForm<RenameValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: "" },
  });

  const handleOpenRename = (planilha: Planilha) => {
    renameForm.reset({ name: planilha.name });
    setRenameTarget(planilha);
  };

  const handleRenameSubmit = (values: RenameValues) => {
    if (!renameTarget) return;
    renameMutation.mutate({ id: renameTarget.id, name: values.name });
  };

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
                              onClick={() => handleOpenRename(planilha)}
                            >
                              <Type className="size-4 mr-1" />
                              Renomear
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(planilha)}
                            >
                              <Download className="size-4 mr-1" />
                              Baixar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteTarget(planilha)}
                            >
                              <Trash2 className="size-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

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
                          onClick={() => handleOpenRename(planilha)}
                        >
                          <Type className="size-4 mr-1" />
                          Renomear
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
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => setDeleteTarget(planilha)}
                        >
                          <Trash2 className="size-4 mr-1" />
                          Excluir
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir planilha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a planilha{" "}
              <strong>"{deleteTarget?.name}"</strong>? Todos os itens serão
              removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Renomear Planilha</DialogTitle>
            <DialogDescription>
              Altere o nome da planilha.
            </DialogDescription>
          </DialogHeader>
          <Form {...renameForm}>
            <form
              onSubmit={renameForm.handleSubmit(handleRenameSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={renameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da planilha..."
                        disabled={renameMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRenameTarget(null)}
                  disabled={renameMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={renameMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {renameMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
