export interface ItemPOS {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorTotal: number;
}

export interface OrdemContratacaoPOS {
  id: string;
  numeroPOS: string;
  atendimentoId: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  fornecedorTipo: 'Funerária Parceira' | 'Floricultura' | 'Cemitério' | 'Tanatopraxia' | 'Translado';
  itens: ItemPOS[];
  valorTotal: number;
  dataEmissao: string;
  status: 'emitida' | 'confirmada' | 'em_execucao' | 'concluida';
  emailDisparado: boolean;
  destinatarioEmail: string;
}
