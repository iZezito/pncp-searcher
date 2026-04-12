import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { ItemPlanilha } from "@/types/planilha";
import type { FoundItem } from "@/types/deep-search";
import { toast } from "sonner";

interface LinkToPlanilhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planilhaId: string;
  result: FoundItem;
}

export function LinkToPlanilhaModal({
  open,
  onOpenChange,
  planilhaId,
  result,
}: LinkToPlanilhaModalProps) {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: itens = [], isLoading } = useQuery<ItemPlanilha[]>({
    queryKey: ["itens-planilha-vincular", planilhaId],
    queryFn: async () => {
      const res = await api.get<ItemPlanilha[]>(`/itens/${planilhaId}`);
      return res.data;
    },
    enabled: open && !!planilhaId,
  });

  const vincularMutation = useMutation({
    mutationFn: async () => {
      return api.put(`/itens/${selectedItemId}/vincular`, {
        valor: result.valor,
        fonte: result.fonte,
        link: result.link,
      });
    },
    onSuccess: () => {
      queryClient.setQueryData<ItemPlanilha[]>(
        ["itens-planilha", planilhaId],
        (old) =>
          old?.map((item) =>
            item.id === selectedItemId
              ? {
                  ...item,
                  valor: result.valor,
                  fonte: result.fonte,
                  link: result.link,
                }
              : item,
          ),
      );
      toast.success("Resultado vinculado com sucesso!");
      setSelectedItemId("");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao vincular resultado");
    },
  });

  const selectedItem = itens.find((item) => item.id === selectedItemId);

  const handleVincular = () => {
    if (!selectedItemId) {
      toast.error("Selecione um item");
      return;
    }
    vincularMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-5" />
            Vincular a Planilha
          </DialogTitle>
          <DialogDescription>
            Selecione o item da planilha para vincular este resultado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="mb-1 text-sm font-medium">Resultado selecionado:</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {result.descricao}
            </p>
            <p className="mt-1 text-sm font-semibold">
              Valor: R$ {result.valor.toFixed(2)}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Item da planilha</label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando itens...
              </div>
            ) : (
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full min-w-0 shrink justify-between overflow-hidden"
                  >
                    <span className="min-w-0 truncate text-left">
                      {selectedItem
                        ? `Item ${selectedItem.numero}`
                        : "Selecione um item..."}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0"
                  style={{ width: "var(--radix-popover-trigger-width)" }}
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Buscar item..." />
                    <CommandList>
                      <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                      <CommandGroup>
                        {itens.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.numero} - ${item.descricao}`}
                            onSelect={() => {
                              setSelectedItemId(item.id);
                              setComboboxOpen(false);
                            }}
                            className="overflow-hidden"
                          >
                            <Check
                              className={cn(
                                "mr-2 size-4 shrink-0",
                                selectedItemId === item.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="truncate">
                              {item.numero} - {item.descricao}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={vincularMutation.isPending}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleVincular}
            disabled={vincularMutation.isPending || !selectedItemId}
            className="w-full sm:w-auto"
          >
            {vincularMutation.isPending ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                Vinculando...
              </>
            ) : (
              "Vincular"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
