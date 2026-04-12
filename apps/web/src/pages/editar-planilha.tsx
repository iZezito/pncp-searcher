import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/page-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";
import type { ItemPlanilha } from "@/types/planilha";
import { toast } from "sonner";

const editItemSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  quantidade: z.coerce.number<number>().min(0, "Deve ser >= 0"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  valor: z.coerce.number<number>().min(0, "Deve ser >= 0"),
  fonte: z.string(),
  link: z.string(),
});

type EditItemValues = z.infer<typeof editItemSchema>;

function EditItemForm({
  item,
  onSave,
  onCancel,
  isPending,
  layout,
}: {
  item: ItemPlanilha;
  onSave: (data: EditItemValues) => void;
  onCancel: () => void;
  isPending: boolean;
  layout: "table" | "card";
}) {
  const form = useForm<EditItemValues>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valor: item.valor,
      fonte: item.fonte ?? "",
      link: item.link ?? "",
    },
  });

  if (layout === "table") {
    return (
      <Form {...form}>
        <TableCell>
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} className="min-w-24" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" {...field} className="w-20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name="unidade"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} className="w-24" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    className="w-24"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name="fonte"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} className="min-w-32" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell>
          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    className="min-w-40"
                    placeholder="https://..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              type="button"
              onClick={form.handleSubmit(onSave)}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={onCancel}
              disabled={isPending}
            >
              <X className="size-4" />
            </Button>
          </div>
        </TableCell>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSave)}
        className="flex flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fonte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fonte</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-1 size-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function getEmptyItem(planilhaId: string, numero: number): ItemPlanilha {
  return {
    id: "new",
    planilhaId,
    numero,
    descricao: "",
    quantidade: 0,
    unidade: "",
    valor: 0,
    fonte: "",
    link: "",
    createdAt: "",
  };
}

export default function EditarPlanilha() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);

  const { data: itens = [], isLoading } = useQuery<ItemPlanilha[]>({
    queryKey: ["itens-planilha", id],
    queryFn: async () => {
      const response = await api.get<ItemPlanilha[]>(`/itens/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const nextNumero =
    itens.length > 0 ? Math.max(...itens.map((i) => i.numero)) + 1 : 1;
  const shouldShowEmptyState = itens.length === 0 && !addingItem;

  const createMutation = useMutation({
    mutationFn: async (data: EditItemValues) => {
      return api.post(`/itens/${id}/item`, {
        ...data,
        numero: nextNumero,
      });
    },
    onSuccess: () => {
      toast.success("Item adicionado!");
      setAddingItem(false);
      queryClient.invalidateQueries({ queryKey: ["itens-planilha", id] });
    },
    onError: () => {
      toast.error("Erro ao adicionar item");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: EditItemValues;
    }) => {
      return api.put(`/itens/${itemId}`, data);
    },
    onSuccess: () => {
      toast.success("Item atualizado!");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["itens-planilha", id] });
    },
    onError: () => {
      toast.error("Erro ao atualizar item");
    },
  });

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Planilhas", href: "/planilhas" },
        { label: "Editar" },
      ]}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/planilhas")}
          >
            <ArrowLeft className="mr-1 size-4" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Editar Planilha
          </h1>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null);
            setAddingItem(true);
          }}
          disabled={addingItem}
        >
          <Plus className="mr-1 size-4" />
          Adicionar Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens da Planilha</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : shouldShowEmptyState ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum item encontrado.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Item</TableHead>
                      <TableHead className="w-[24%]">Descrição</TableHead>
                      <TableHead className="w-20">Qtd</TableHead>
                      <TableHead className="w-24">Unidade</TableHead>
                      <TableHead className="w-24">Valor</TableHead>
                      <TableHead className="w-[18%]">Fonte</TableHead>
                      <TableHead className="w-[18%]">Link</TableHead>
                      <TableHead className="w-28 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.numero}</TableCell>
                        {editingId === item.id ? (
                          <EditItemForm
                            item={item}
                            layout="table"
                            isPending={updateMutation.isPending}
                            onSave={(data) =>
                              updateMutation.mutate({
                                itemId: item.id,
                                data,
                              })
                            }
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <>
                            <TableCell>
                              <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                                {item.descricao}
                              </span>
                            </TableCell>
                            <TableCell>{item.quantidade}</TableCell>
                            <TableCell>{item.unidade}</TableCell>
                            <TableCell>{item.valor}</TableCell>
                            <TableCell>
                              <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                                {item.fonte || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {item.link ? (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block overflow-hidden text-ellipsis whitespace-nowrap text-primary hover:underline"
                                >
                                  {item.link}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(item.id)}
                              >
                                Editar
                              </Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}

                    {addingItem && id && (
                      <TableRow>
                        <TableCell>{nextNumero}</TableCell>
                        <EditItemForm
                          item={getEmptyItem(id, nextNumero)}
                          layout="table"
                          isPending={createMutation.isPending}
                          onSave={(data) => createMutation.mutate(data)}
                          onCancel={() => setAddingItem(false)}
                        />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 lg:hidden">
                {itens.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">
                          Item {item.numero}
                        </span>
                        {editingId !== item.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(item.id)}
                          >
                            Editar
                          </Button>
                        )}
                      </div>

                      {editingId === item.id ? (
                        <EditItemForm
                          item={item}
                          layout="card"
                          isPending={updateMutation.isPending}
                          onSave={(data) =>
                            updateMutation.mutate({
                              itemId: item.id,
                              data,
                            })
                          }
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div className="space-y-1 text-sm">
                          <p>{item.descricao}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
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
                                {item.valor}
                              </strong>
                            </span>
                          </div>
                          {item.fonte && (
                            <p className="truncate text-xs text-muted-foreground">
                              Fonte: {item.fonte}
                            </p>
                          )}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block break-all text-xs text-primary hover:underline"
                            >
                              {item.link}
                            </a>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {addingItem && id && (
                  <Card className="overflow-hidden border-dashed">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">
                          Novo Item #{nextNumero}
                        </span>
                      </div>
                      <EditItemForm
                        item={getEmptyItem(id, nextNumero)}
                        layout="card"
                        isPending={createMutation.isPending}
                        onSave={(data) => createMutation.mutate(data)}
                        onCancel={() => setAddingItem(false)}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
