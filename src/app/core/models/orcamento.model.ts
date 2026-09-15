export type CategoriaItem =
  | 'Urna'
  | 'Cemitério'
  | 'Translado'
  | 'Tanatopraxia'
  | 'Flores'
  | 'Taxas'
  | 'Cerimonial';

export interface ItemOrcamento {
  id: string;
  codigo: string;
  descricao: string;
  categoria: CategoriaItem;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  cobertoContrato: boolean;
  terceirizado: boolean;
  fornecedorSugerido?: string;
}

export interface OrcamentoAtendimento {
  atendimentoId: string;
  itens: ItemOrcamento[];
  valorTotal: number;
  tetoApolice: number;
  valorCoberto: number;
  valorExcedente: number;
  aprovadoSies: boolean;
  pagadorDefinido: 'Previdencial' | 'Sinaf 24h' | 'Assistencial' | 'Família';
  dataCalculo: string;
}
