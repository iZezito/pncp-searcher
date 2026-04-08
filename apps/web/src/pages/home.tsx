import { Button } from "@/components/ui/button";
import { Search, FileSpreadsheet, Link2, Zap } from "lucide-react";
import { Link } from "react-router";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl px-6">
        <div className="text-center mb-12">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-foreground md:text-5xl lg:text-6xl">
            PNCP Deep Search
          </h1>
          <p className="text-lg text-muted-foreground lg:text-xl max-w-2xl mx-auto">
            Plataforma de busca inteligente no Portal Nacional de Contratações
            Públicas. Encontre, compare e vincule itens de licitação às suas
            planilhas de forma rápida e automatizada.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <Search className="size-6 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              Busca em tempo real
            </h3>
            <p className="text-sm text-muted-foreground">
              Pesquise itens no PNCP com palavras-chave e receba resultados via
              WebSocket conforme são encontrados.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <FileSpreadsheet className="size-6 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              Gestão de planilhas
            </h3>
            <p className="text-sm text-muted-foreground">
              Crie e gerencie planilhas com seus itens de referência para
              organizar as cotações que pretende pesquisar.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <Link2 className="size-6 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              Vinculação de resultados
            </h3>
            <p className="text-sm text-muted-foreground">
              Vincule os resultados encontrados diretamente aos itens da sua
              planilha, registrando valor e fonte automaticamente.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <Zap className="size-6 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              Controle de buscas
            </h3>
            <p className="text-sm text-muted-foreground">
              Pause, retome ou pare buscas a qualquer momento. Fixe itens na
              tela para acompanhar o progresso sem perder o contexto.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link to="/planilhas">Começar a usar</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
