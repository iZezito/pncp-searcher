import { ResultCard } from "@/components/deep-search/result-card";
import { SearchForm } from "@/components/deep-search/search-form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/services/api";
import type { FoundItem } from "@/types/deep-search";
import { Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { io } from "socket.io-client";

export default function DeepSearch() {
  const { idPlanilha } = useParams<{ idPlanilha?: string }>();
  const [itens, setItens] = useState<FoundItem[]>([]);

  useEffect(() => {
    const socket = io("http://localhost:3000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("✅ Conectado ao socket:", socket.id);
    });
    socket.on("teste", (data: FoundItem) => {
      console.log("📥 Recebido:", data);
      setItens((prev) => [...prev, data]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSearch = async (busca: string, palavrasChave: string[]) => {
    await api.post("/deep-search", { busca, palavrasChave, planilhaId: idPlanilha });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">App de Busca</h1>
            <Badge className="gap-1.5">
              <Wifi className="size-3" />
              Conectado
            </Badge>
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
              {itens.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {itens.length}{" "}
                  {itens.length === 1 ? "resultado" : "resultados"}
                </span>
              )}
            </div>

            <ScrollArea className="h-[400px] rounded-xl border bg-card/50 p-4">
              {itens.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    Buscando resultados...
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
