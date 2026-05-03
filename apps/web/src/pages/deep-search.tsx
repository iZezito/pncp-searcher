import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import {
  Wifi,
  WifiOff,
  Pause,
  Play,
  Square,
  Trash2,
  Loader2,
  Eye,
  Check,
  Pin,
  PinOff,
} from "lucide-react";
import { toast } from "sonner";
import { ResultCard } from "@/components/deep-search/result-card";
import { SearchForm } from "@/components/deep-search/search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/services/api";
import type { FoundItem } from "@/types/deep-search";
import type { ItemPlanilha } from "@/types/planilha";
import { apiUrl } from "@/lib/utils";

type SearchStatus = "idle" | "searching" | "paused" | "stopped" | "completed";

export default function DeepSearch() {
  const { idPlanilha } = useParams<{ idPlanilha?: string }>();
  const [itens, setItens] = useState<FoundItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [itensModalOpen, setItensModalOpen] = useState(false);
  const [pinnedItemId, setPinnedItemId] = useState<string | null>(null);
  const scrollPositionRef = useRef(0);

  const { data: planilhaItens = [], isLoading: isLoadingItens } = useQuery<
    ItemPlanilha[]
  >({
    queryKey: ["itens-planilha", idPlanilha],
    queryFn: async () => {
      const res = await api.get<ItemPlanilha[]>(`/itens/${idPlanilha}`);
      return res.data;
    },
    enabled: !!idPlanilha,
  });

  useEffect(() => {
    const socket = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setConnected(true);

      if (idPlanilha) {
        socket.emit("join-room", idPlanilha);
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("search-result", (data: FoundItem) => {
      setItens((prev) => [...prev, data]);
    });

    socket.on("search-started", () => {
      setSearchStatus("searching");
    });

    socket.on("search-completed", () => {
      setSearchStatus("completed");
    });

    socket.on("search-paused", () => {
      setSearchStatus("paused");
    });

    socket.on("search-resumed", () => {
      setSearchStatus("searching");
    });

    socket.on("search-stopped", () => {
      setSearchStatus("stopped");
    });

    return () => {
      if (idPlanilha) {
        socket.emit("leave-room", idPlanilha);
      }
      socket.disconnect();
    };
  }, [idPlanilha]);

  useEffect(() => {
    if (!idPlanilha) return;

    api
      .get(`/deep-search/jobs/${idPlanilha}/status`)
      .then((res) => {
        const { status, jobId: existingJobId } = res.data;
        if (existingJobId) {
          setJobId(existingJobId);
        }
        if (status === "paused") {
          setSearchStatus("paused");
        } else if (status === "active") {
          setSearchStatus("searching");
        } else if (status === "completed") {
          setSearchStatus("completed");
        } else if (status === "failed") {
          setSearchStatus("stopped");
        }
      })
      .catch(() => {});
  }, [idPlanilha]);

  const handleSearch = async (busca: string, palavrasChave: string[]) => {
    if (searchStatus === "searching" || searchStatus === "paused") {
      return;
    }

    try {
      setItens([]);
      setJobId(null);
      setSearchStatus("searching");
      const response = await api.post("/deep-search", {
        busca,
        palavrasChave,
        planilhaId: idPlanilha,
      });
      setJobId(response.data.jobId);
    } catch {
      setSearchStatus("idle");
      toast.error("Erro ao iniciar busca");
    }
  };

  const handleStop = useCallback(async () => {
    if (!jobId) return;
    try {
      await api.delete(`/deep-search/jobs/${jobId}`);
      setSearchStatus("stopped");
    } catch {
      toast.error("Erro ao parar busca");
    }
  }, [jobId]);

  const handlePause = useCallback(async () => {
    if (!jobId) return;
    try {
      await api.post(`/deep-search/jobs/${jobId}/pause`);
      setSearchStatus("paused");
    } catch {
      toast.error("Erro ao pausar busca");
    }
  }, [jobId]);

  const handleResume = useCallback(async () => {
    if (!jobId) return;
    try {
      await api.post(`/deep-search/jobs/${jobId}/resume`);
      setSearchStatus("searching");
    } catch {
      toast.error("Erro ao retomar busca");
    }
  }, [jobId]);

  const handleClear = useCallback(() => {
    setItens([]);
  }, []);

  const isSearchLocked =
    searchStatus === "searching" || searchStatus === "paused";

  const statusLabel: Record<SearchStatus, string> = {
    idle: "Aguardando busca",
    paused: "Busca pausada",
    searching: "Buscando...",
    stopped: "Busca parada",
    completed: "Busca concluida",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">App de Busca</h1>
            <div className="flex items-center gap-2">
              {idPlanilha && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItensModalOpen(true)}
                  className="gap-1.5"
                >
                  <Eye className="size-4" />
                  Ver Itens
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {planilhaItens.length}
                  </Badge>
                </Button>
              )}
              <Badge
                variant={isSearchLocked ? "default" : "secondary"}
                className="gap-1.5"
              >
                {searchStatus === "searching" && (
                  <Loader2 className="size-3 animate-spin" />
                )}
                {searchStatus === "paused" && <Pause className="size-3" />}
                {statusLabel[searchStatus]}
              </Badge>
              <Badge
                variant={connected ? "default" : "destructive"}
                className="gap-1.5"
              >
                {connected ? (
                  <>
                    <Wifi className="size-3" />
                    Conectado
                  </>
                ) : (
                  <>
                    <WifiOff className="size-3" />
                    Desconectado
                  </>
                )}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            Preencha os campos e realize sua busca em tempo real.
          </p>
          {idPlanilha && (
            <Badge variant="outline" className="mt-2">
              Buscando para planilha: {idPlanilha}
            </Badge>
          )}
        </header>

        <main className="flex flex-col gap-8">
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <SearchForm
              onSearch={handleSearch}
              isSearchLocked={isSearchLocked}
            />
          </section>

          {(() => {
            const pinnedItem = planilhaItens.find((i) => i.id === pinnedItemId);
            if (!pinnedItem) return null;

            return (
              <section className="overflow-hidden rounded-xl border border-primary/30 bg-card shadow-sm">
                <div className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-xs font-semibold text-primary">
                  <Pin className="size-3" />
                  Item a ser buscado
                </div>
                <div className="flex items-center gap-3 px-4 pb-4 pt-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold">
                        {pinnedItem.numero}
                      </span>
                      <span className="truncate text-sm font-medium">
                        {pinnedItem.descricao}
                      </span>
                    </div>
                    <div className="ml-8 mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Qtd:{" "}
                        <strong className="text-foreground">
                          {pinnedItem.quantidade}
                        </strong>
                      </span>
                      <span>
                        Und:{" "}
                        <strong className="text-foreground">
                          {pinnedItem.unidade}
                        </strong>
                      </span>
                      <span>
                        Valor:{" "}
                        <strong className="text-foreground">
                          {pinnedItem.valor > 0
                            ? `R$ ${pinnedItem.valor.toFixed(2)}`
                            : "-"}
                        </strong>
                      </span>
                    </div>
                    {pinnedItem.fonte && (
                      <p className="ml-8 mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Check className="size-3 shrink-0 text-green-500" />
                        {pinnedItem.fonte}
                      </p>
                    )}
                    {pinnedItem.link && (
                      <a
                        href={pinnedItem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-8 mt-1 block break-all text-xs text-primary hover:underline"
                      >
                        {pinnedItem.link}
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPinnedItemId(null)}
                    className="shrink-0 rounded p-1 transition-colors hover:bg-muted"
                    title="Desafixar item"
                  >
                    <PinOff className="size-4 text-muted-foreground" />
                  </button>
                </div>
              </section>
            );
          })()}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Resultados
              </h2>
              <div className="flex items-center gap-2">
                {searchStatus === "searching" && jobId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePause}
                    className="gap-1.5"
                  >
                    <Pause className="size-3" />
                    Pausar
                  </Button>
                )}
                {searchStatus === "paused" && jobId && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleResume}
                    className="gap-1.5"
                  >
                    <Play className="size-3" />
                    Continuar
                  </Button>
                )}
                {(searchStatus === "searching" || searchStatus === "paused") &&
                  jobId && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleStop}
                      className="gap-1.5"
                    >
                      <Square className="size-3" />
                      Parar
                    </Button>
                  )}
                {itens.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="gap-1.5"
                  >
                    <Trash2 className="size-3" />
                    Limpar
                  </Button>
                )}
                {itens.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {itens.length} {itens.length === 1 ? "resultado" : "resultados"}
                  </span>
                )}
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-xl border bg-card/50 p-4">
              {itens.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    {searchStatus === "searching"
                      ? "Buscando resultados..."
                      : searchStatus === "paused"
                        ? "Busca pausada. Clique em Continuar para retomar."
                        : searchStatus === "stopped"
                          ? "Busca foi parada pelo usuario."
                          : searchStatus === "completed"
                            ? "Busca concluida. Nenhum resultado encontrado."
                            : "Nenhuma busca realizada ainda."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {itens.map((result, index) => (
                    <ResultCard
                      key={index}
                      result={result}
                      planilhaId={idPlanilha}
                      pinnedItemId={pinnedItemId}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </section>
        </main>
      </div>

      <Dialog open={itensModalOpen} onOpenChange={setItensModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-5" />
              Itens da Planilha
            </DialogTitle>
            <DialogDescription>
              {planilhaItens.length}{" "}
              {planilhaItens.length === 1 ? "item" : "itens"} na planilha
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div
              ref={(node) => {
                if (node) {
                  const viewport = node
                    .closest('[data-slot="scroll-area"]')
                    ?.querySelector(
                      '[data-slot="scroll-area-viewport"]',
                    ) as HTMLDivElement | null;

                  if (viewport) {
                    requestAnimationFrame(() => {
                      viewport.scrollTop = scrollPositionRef.current;
                    });
                    viewport.onscroll = () => {
                      scrollPositionRef.current = viewport.scrollTop;
                    };
                  }
                }
              }}
            >
              {isLoadingItens ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : planilhaItens.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground">
                    Nenhum item na planilha.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pr-3">
                  {planilhaItens.map((item) => (
                      <div
                        key={item.id}
                        className={`overflow-hidden rounded-md border p-3 text-sm ${
                          item.id === pinnedItemId ? "ring-2 ring-primary/50" : ""
                        } ${item.valor > 0 ? "bg-primary" : "bg-background"}`}
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-white/10 text-xs font-bold">
                            {item.numero}
                          </span>
                          <span className="flex-1 break-words font-medium">
                            {item.descricao}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPinnedItemId(
                                pinnedItemId === item.id ? null : item.id,
                              )
                            }
                            className="shrink-0 rounded p-1 transition-colors hover:bg-white/10"
                            title={
                              pinnedItemId === item.id
                                ? "Desafixar item"
                                : "Fixar item no topo"
                            }
                          >
                            {pinnedItemId === item.id ? (
                              <PinOff className="size-3.5 text-primary" />
                            ) : (
                              <Pin className="size-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <div className="ml-8 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            Qtd:{" "}
                            <strong className="text-foreground">
                              {item.quantidade}
                            </strong>
                          </span>
                          <span>
                            Und:{" "}
                            <strong className="text-foreground">
                              {item.unidade}
                            </strong>
                          </span>
                          <span>
                            Valor:{" "}
                            <strong className="text-foreground">
                              {item.valor > 0 ? `R$ ${item.valor.toFixed(2)}` : "-"}
                            </strong>
                          </span>
                        </div>
                        {item.fonte && (
                          <p className="ml-8 mt-1.5 flex items-start gap-1 break-words text-xs text-muted-foreground">
                            <Check className="size-3 shrink-0 text-green-500" />
                            {item.fonte}
                          </p>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-8 mt-1.5 block break-all text-xs text-primary hover:underline"
                          >
                            {item.link}
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
