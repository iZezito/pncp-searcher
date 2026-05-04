import { useNavigate } from "react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
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
  X,
  Sparkles,
  Command,
  ChevronLeft,
  ChevronRight,
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
import type { Planilha, PlanilhaCursorPage } from "@/types/planilha";
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
import { Badge } from "@/components/ui/badge";

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

  // ─── Search & Pagination State ───
  const [pageSize] = useQueryState(
    "pageSize",
    parseAsInteger.withDefault(20),
  );
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [cursor, setCursor] = useQueryState(
    "cursor",
    parseAsString.withDefault(""),
  );

  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(search);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sync input value when URL search param changes externally
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  // Debounced search
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setSearch(value || null);
        setCursor(null);
        setCursorStack([]);
      }, 400);
    },
    [setSearch, setCursor],
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClearSearch = () => {
    setInputValue("");
    setSearch(null);
    setCursor(null);
    setCursorStack([]);
    inputRef.current?.focus();
  };

  // ─── Data Fetching ───
  const {
    data: pageData,
    isLoading,
    refetch,
  } = useQuery<PlanilhaCursorPage>({
    queryKey: ["planilhas", cursor, pageSize, search],
    queryFn: async () => {
      const params: Record<string, string | number> = { pageSize };
      if (search) params.search = search;
      if (cursor) params.cursor = cursor;
      const response = await api.get<PlanilhaCursorPage>("/planilhas", { params });
      return response.data;
    },
  });

  const planilhas = pageData?.data ?? [];
  const total = pageData?.total ?? 0;
  const hasMore = pageData?.hasMore ?? false;
  const nextCursor = pageData?.nextCursor ?? null;
  const isFirstPage = cursorStack.length === 0;
  const currentPage = cursorStack.length + 1;
  const isSearching = isLoading && !!search;

  const handleNextPage = () => {
    if (!nextCursor) return;
    setCursorStack((prev) => [...prev, cursor || ""]);
    setCursor(nextCursor);
  };

  const handlePrevPage = () => {
    if (isFirstPage) return;
    const newStack = [...cursorStack];
    const prevCursor = newStack.pop()!;
    setCursorStack(newStack);
    setCursor(prevCursor || null);
  };

  // ─── Mutations ───
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {total > 0 && (
            <Badge variant="secondary" className="text-sm">
              {total} {total === 1 ? "planilha" : "planilhas"}
            </Badge>
          )}
          <Button onClick={() => setDialogOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="size-4 mr-2" />
            Nova Planilha
          </Button>
        </div>
      </div>

      {/* ─── Super Search Bar ─── */}
      <div className="relative group" id="super-search-bar-planilhas">
        {/* Glow effect behind the bar */}
        <div
          className={`
            absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 blur-xl
            transition-all duration-500 ease-out
            ${isFocused ? "opacity-100 scale-[1.02]" : "opacity-0 scale-100"}
          `}
        />

        <div
          className={`
            relative flex items-center gap-3 rounded-xl border bg-card/80 backdrop-blur-md px-4 py-3
            shadow-sm transition-all duration-300 ease-out
            ${isFocused
              ? "border-primary/50 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
              : "border-border hover:border-primary/30 hover:shadow-md"
            }
          `}
        >
          {/* Search icon with animation */}
          <div className="relative flex items-center justify-center size-5 shrink-0">
            {isSearching ? (
              <Loader2 className="size-5 text-primary animate-spin" />
            ) : (
              <Search
                className={`
                  size-5 transition-all duration-300
                  ${isFocused ? "text-primary scale-110" : "text-muted-foreground"}
                `}
              />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            id="search-planilhas-input"
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Buscar planilhas por nome..."
            className={`
              flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60
              transition-colors duration-200 md:text-sm
            `}
            autoComplete="off"
          />

          {/* Right side: clear button or keyboard shortcut */}
          <div className="flex items-center gap-2 shrink-0">
            {inputValue ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className={`
                  flex items-center justify-center size-7 rounded-lg
                  bg-muted/80 hover:bg-destructive/10 hover:text-destructive
                  text-muted-foreground transition-all duration-200
                  active:scale-90
                `}
                title="Limpar busca"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd
                className={`
                  hidden sm:inline-flex items-center gap-1 rounded-lg border
                  bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground
                  transition-all duration-300 select-none
                  ${isFocused ? "opacity-0 scale-90" : "opacity-100 scale-100"}
                `}
              >
                <Command className="size-3" />
                K
              </kbd>
            )}
          </div>
        </div>

        {/* Active search indicator */}
        {search && (
          <div className="flex items-center gap-2 mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-300">
            <Sparkles className="size-3 text-primary" />
            <span className="text-xs text-muted-foreground">
              Filtrando por: <strong className="text-foreground">&ldquo;{search}&rdquo;</strong>
            </span>
            {!isLoading && (
              <span className="text-xs text-muted-foreground">
                &mdash; {total} {total === 1 ? "planilha" : "planilhas"}
              </span>
            )}
          </div>
        )}
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
              {search ? (
                <>
                  <Search className="size-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    Nenhuma planilha encontrada para &ldquo;{search}&rdquo;.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSearch}
                    className="mt-1 gap-1.5"
                  >
                    <X className="size-3.5" />
                    Limpar busca
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
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

              {/* Cursor Pagination */}
              {(!isFirstPage || hasMore) && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isFirstPage}
                    onClick={handlePrevPage}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>

                  <span className="text-sm text-muted-foreground tabular-nums">
                    Página {currentPage}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasMore}
                    onClick={handleNextPage}
                    className="gap-1.5"
                  >
                    Próxima
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
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
