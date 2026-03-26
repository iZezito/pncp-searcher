import { ResultCard } from "@/components/deep-search/result-card";
import { SearchForm } from "@/components/deep-search/search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/services/api";
import type { FoundItem } from "@/types/deep-search";
import { Wifi, WifiOff, Square, Trash2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { io, Socket } from "socket.io-client";

type SearchStatus = "idle" | "searching" | "stopped" | "completed";

export default function DeepSearch() {
  const { idPlanilha } = useParams<{ idPlanilha?: string }>();
  const [itens, setItens] = useState<FoundItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:3000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Conectado ao socket:", socket.id);
      setConnected(true);

      // Join the planilha-specific room
      if (idPlanilha) {
        socket.emit("join-room", idPlanilha);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Desconectado do socket");
      setConnected(false);
    });

    // Listen for search results in the planilha room
    socket.on("search-result", (data: FoundItem) => {
      console.log("📥 Recebido:", data);
      setItens((prev) => [...prev, data]);
    });

    socket.on("search-started", (data: { jobId: string }) => {
      console.log("🚀 Busca iniciada:", data);
      setSearchStatus("searching");
    });

    socket.on("search-completed", (data: { totalEncontrados: number }) => {
      console.log("✅ Busca concluída:", data);
      setSearchStatus("completed");
    });

    socket.on("search-stopped", (data: { jobId: string }) => {
      console.log("🛑 Busca parada:", data);
      setSearchStatus("stopped");
    });

    return () => {
      if (idPlanilha) {
        socket.emit("leave-room", idPlanilha);
      }
      socket.disconnect();
    };
  }, [idPlanilha]);

  // Restore job state on mount/reload
  useEffect(() => {
    if (!idPlanilha) return;

    api
      .get(`/deep-search/jobs/${idPlanilha}/status`)
      .then((res) => {
        const { status, jobId: existingJobId } = res.data;
        if (existingJobId) {
          setJobId(existingJobId);
        }
        if (status === "active") {
          setSearchStatus("searching");
        } else if (status === "completed") {
          setSearchStatus("completed");
        } else if (status === "failed") {
          setSearchStatus("stopped");
        }
      })
      .catch((err) => {
        console.warn("Não foi possível recuperar status do job:", err);
      });
  }, [idPlanilha]);

  const handleSearch = async (busca: string, palavrasChave: string[]) => {
    setItens([]);
    setSearchStatus("searching");
    const response = await api.post("/deep-search", {
      busca,
      palavrasChave,
      planilhaId: idPlanilha,
    });
    setJobId(response.data.jobId);
  };

  const handleStop = useCallback(async () => {
    if (!jobId) return;
    try {
      await api.delete(`/deep-search/jobs/${jobId}`);
      setSearchStatus("stopped");
    } catch (err) {
      console.error("Erro ao parar busca:", err);
    }
  }, [jobId]);

  const handleClearPartial = useCallback(() => {
    setItens((prev) => prev.slice(10));
  }, []);

  const statusLabel: Record<SearchStatus, string> = {
    idle: "Aguardando busca",
    searching: "Buscando...",
    stopped: "Busca parada",
    completed: "Busca concluída",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">App de Busca</h1>
            <div className="flex items-center gap-2">
              <Badge
                variant={searchStatus === "searching" ? "default" : "secondary"}
                className="gap-1.5"
              >
                {searchStatus === "searching" && (
                  <Loader2 className="size-3 animate-spin" />
                )}
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
            <SearchForm onSearch={handleSearch} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Resultados
              </h2>
              <div className="flex items-center gap-2">
                {searchStatus === "searching" && jobId && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleStop}
                    className="gap-1.5"
                  >
                    <Square className="size-3" />
                    Parar Busca
                  </Button>
                )}
                {itens.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearPartial}
                    className="gap-1.5"
                  >
                    <Trash2 className="size-3" />
                    Limpar 10
                  </Button>
                )}
                {itens.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {itens.length}{" "}
                    {itens.length === 1 ? "resultado" : "resultados"}
                  </span>
                )}
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-xl border bg-card/50 p-4">
              {itens.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    {searchStatus === "searching"
                      ? "Buscando resultados..."
                      : searchStatus === "stopped"
                        ? "Busca foi parada pelo usuário."
                        : searchStatus === "completed"
                          ? "Busca concluída. Nenhum resultado encontrado."
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
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </section>
        </main>
      </div>
    </div>
  );
}
