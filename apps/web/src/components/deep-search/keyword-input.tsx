import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface KeywordInputProps {
  keywords: string[];
  onAddKeyword: (keyword: string) => void;
  onRemoveKeyword: (keyword: string) => void;
}

export function KeywordInput({
  keywords,
  onAddKeyword,
  onRemoveKeyword,
}: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddKeyword = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !keywords.includes(trimmedValue)) {
      onAddKeyword(trimmedValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-foreground">
        Palavras-chave
      </label>
      <div className="flex gap-2">
        <Input
          placeholder="Digite uma palavra-chave..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddKeyword}
          disabled={!inputValue.trim()}
        >
          <Plus className="size-4" />
          <span className="sr-only">Adicionar palavra-chave</span>
        </Button>
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <Badge key={keyword} className="gap-1 pr-1">
              {keyword}
              <button
                type="button"
                onClick={() => onRemoveKeyword(keyword)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="size-3" />
                <span className="sr-only">Remover {keyword}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
