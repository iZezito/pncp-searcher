import { useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Upload, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

const createPlanilhaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

type CreatePlanilhaValues = z.infer<typeof createPlanilhaSchema>;

interface CreatePlanilhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePlanilhaDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePlanilhaDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreatePlanilhaValues>({
    resolver: zodResolver(createPlanilhaSchema),
    defaultValues: {
      name: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreatePlanilhaValues) => {
      if (!file) throw new Error("Selecione um arquivo Excel");

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("planilha", file);

      return api.post("/planilhas", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Planilha criada com sucesso!");
      form.reset();
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onOpenChange(false);
      onSuccess();
    },
    onError: () => {
      toast.error("Erro ao criar planilha");
    },
  });

  const onSubmit = (values: CreatePlanilhaValues) => {
    if (!file) {
      toast.error("Selecione um arquivo Excel");
      return;
    }
    createMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Nova Planilha</DialogTitle>
          <DialogDescription>
            Crie uma nova planilha enviando um arquivo Excel.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome da planilha..."
                      disabled={createMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-3">
              <div className="flex items-start gap-2">
                <Info className="size-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Formato esperado da planilha
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    O cabeçalho (primeira linha) do arquivo Excel deve conter exatamente estas colunas:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {["ITEM", "UNIDADE", "QUANTIDADE", "DESCRIÇÃO", "VALOR", "FONTE"].map(
                      (col) => (
                        <span
                          key={col}
                          className="inline-flex items-center rounded-md bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-xs font-mono font-medium text-blue-800 dark:text-blue-300 ring-1 ring-inset ring-blue-300 dark:ring-blue-700"
                        >
                          {col}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Arquivo Excel</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={createMutation.isPending}
                >
                  <Upload className="size-4 mr-1" />
                  {file ? "Trocar" : "Selecionar"}
                </Button>
                {file && (
                  <span className="text-sm text-muted-foreground truncate max-w-50">
                    {file.name}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !file}
                className="w-full sm:w-auto"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1" />
                    Criando...
                  </>
                ) : (
                  "Criar Planilha"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
