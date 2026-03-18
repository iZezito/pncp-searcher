import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Loader2 } from "lucide-react";

import { Input } from "../ui/input";
import { KeywordInput } from "./keyword-input";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

const searchFormSchema = z
  .object({
    searchTerm: z.string(),
    keywords: z.array(z.string()),
  })
  .refine(
    (data) => data.searchTerm.trim().length > 0 || data.keywords.length > 0,
    {
      message: "Informe um termo de busca ou pelo menos uma palavra-chave.",
      path: ["searchTerm"],
    },
  );

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface SearchFormProps {
  onSearch: (searchTerm: string, keywords: string[]) => Promise<void>;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      searchTerm: "",
      keywords: [],
    },
    mode: "onChange",
  });

  const keywords = form.watch("keywords");

  const handleAddKeyword = (keyword: string) => {
    form.setValue("keywords", [...keywords, keyword], { shouldValidate: true });
  };

  const handleRemoveKeyword = (keyword: string) => {
    form.setValue(
      "keywords",
      keywords.filter((k) => k !== keyword),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (values: SearchFormValues) => {
    await onSearch(values.searchTerm, values.keywords);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="searchTerm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Busca</FormLabel>
              <FormControl>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite sua busca..."
                    className="pl-10"
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <KeywordInput
          keywords={keywords}
          onAddKeyword={handleAddKeyword}
          onRemoveKeyword={handleRemoveKeyword}
        />

        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
          className="w-full"
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="size-4" />
              Realizar Busca
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
