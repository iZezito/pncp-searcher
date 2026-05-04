import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  FileText,
  Loader2,
  Ruler,
  Link2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Sparkles,
  Command,
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
import type { ItemBuscaCursorPage } from "@/types/deep-search";

export default function ResultadosSalvos() {
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

  // Cursor stack for back navigation
  const [cursorStack, setCursorStack] = useState<string[]>([]);

  const [inputValue, setInputValue] = useState(search);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync input value when URL search param changes externally
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  // Debounced search - updates URL after 400ms of inactivity
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

  const handleClear = () => {
    setInputValue("");
    setSearch(null);
    setCursor(null);
    setCursorStack([]);
    inputRef.current?.focus();
  };

  const { data, isLoading } = useQuery<ItemBuscaCursorPage>({
    queryKey: ["itens-busca", cursor, pageSize, search],
    queryFn: async () => {
      const params: Record<string, string | number> = { pageSize };
      if (search) params.search = search;
      if (cursor) params.cursor = cursor;
      const res = await api.get<ItemBuscaCursorPage>("/itens-busca", { params });
      return res.data;
    },
  });

  const itens = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;
  const nextCursor = data?.nextCursor ?? null;
  const isFirstPage = cursorStack.length === 0;

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isSearching = isLoading && !!search;
  const currentPage = cursorStack.length + 1;

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

      {/* ─── Super Search Bar ─── */}
      <div className="relative group" id="super-search-bar">
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
            id="search-input"
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Buscar por descrição, fonte ou unidade..."
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
                onClick={handleClear}
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
                &mdash; {total} {total === 1 ? "resultado" : "resultados"}
              </span>
            )}
          </div>
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
              {search ? (
                <>
                  <Search className="size-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    Nenhum resultado encontrado para &ldquo;{search}&rdquo;.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="mt-1 gap-1.5"
                  >
                    <X className="size-3.5" />
                    Limpar busca
                  </Button>
                </>
              ) : (
                <>
                  <Bookmark className="size-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    Nenhum resultado salvo ainda.
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    Salve resultados durante a busca para vê-los aqui.
                  </p>
                </>
              )}
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
    </PageLayout>
  );
}
