export interface ApiResponse {
  items: ProcurementItem[];
  total: number;
}

export interface ProcurementItem {
  id: string;
  index: string;
  doc_type: string;
  title: string;
  description: string;
  item_url: string;
  document_type: string;
  createdAt: string;
  numero: string | null;
  ano: string;
  numero_sequencial: string;
  numero_sequencial_compra_ata: string | null;
  numero_controle_pncp: string;

  orgao_id: string;
  orgao_cnpj: string;
  orgao_nome: string;
  orgao_subrogado_id: string | null;
  orgao_subrogado_nome: string | null;

  unidade_id: string;
  unidade_codigo: string;
  unidade_nome: string;

  esfera_id: string;
  esfera_nome: string;
  poder_id: string;
  poder_nome: string;
  municipio_id: string;
  municipio_nome: string;
  uf: string;

  modalidade_licitacao_id: string;
  modalidade_licitacao_nome: string;
  situacao_id: string;
  situacao_nome: string;

  data_publicacao_pncp: string;
  data_atualizacao_pncp: string;
  data_assinatura: string | null;
  data_inicio_vigencia: string;
  data_fim_vigencia: string;

  cancelado: boolean;
  valor_global: number | null;
  tem_resultado: boolean;

  tipo_id: string;
  tipo_nome: string;
  tipo_contrato_id: string | null;
  tipo_contrato_nome: string | null;

  fonte_orcamentaria: string | null;
  fonte_orcamentaria_id: string | null;
  fonte_orcamentaria_nome: string | null;

  exigencia_conteudo_nacional: boolean;
  tipo_margem_preferencia: string;
  tipo_margem_preferencia_id: string;
  tipo_margem_preferencia_nome: string;
}

export interface CompraItem {
  numeroItem: number;
  descricao: string;
  materialOuServico: string;
  materialOuServicoNome: string;
  valorUnitarioEstimado: number;
  valorTotal: number;
  quantidade: number;
  unidadeMedida: string;
  orcamentoSigiloso: boolean;
  itemCategoriaId: number;
  itemCategoriaNome: string;
  patrimonio: string | null;
  codigoRegistroImobiliario: string | null;
  criterioJulgamentoId: number;
  criterioJulgamentoNome: string;
  situacaoCompraItem: number;
  situacaoCompraItemNome: string;
  tipoBeneficio: number;
  tipoBeneficioNome: string;
  incentivoProdutivoBasico: boolean;
  dataInclusao: string;
  dataAtualizacao: string;
  temResultado: boolean;
  imagem: number;
  aplicabilidadeMargemPreferenciaNormal: boolean;
  aplicabilidadeMargemPreferenciaAdicional: boolean;
  percentualMargemPreferenciaNormal: number | null;
  percentualMargemPreferenciaAdicional: number | null;
  ncmNbsCodigo: string | null;
  ncmNbsDescricao: string | null;
  catalogo: string | null;
  categoriaItemCatalogo: string | null;
  catalogoCodigoItem: string | null;
  informacaoComplementar: string | null;
  tipoMargemPreferencia: string | null;
  exigenciaConteudoNacional: boolean;
}

export type CompraItemList = CompraItem[];

export type DeepSearchJobData = {
  busca: string;
  palavrasChave: string[];
  userId: string;
  buscaId: string;
  planilhaId: string;
};

export type PageResult = {
  page: number;
  data: CompraItem[];
};

export type FoundItem = {
  link: string;
  valor: number;
  descricao: string;
  paginaExterna: number;
  paginaInterna: number;
  unidadeMedida: string;
  fonte: string;
};
