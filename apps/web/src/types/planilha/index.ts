export type Planilha = {
  id: string;
  name: string;
  userId: string;
};

export type ItemPlanilha = {
  id: string;
  planilhaId: string;
  numero: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor: number;
  fonte: string;
  link: string;
  createdAt: string;
};

export type PlanilhaCursorPage = {
  data: Planilha[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};
