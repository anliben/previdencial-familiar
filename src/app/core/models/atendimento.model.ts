export type CanalAtendimento = 'sinaf_24h' | 'previdencial' | 'assistencial_familia';

export type FluxoTipo = 'FLUXO_1' | 'FLUXO_2' | 'FLUXO_3' | 'FLUXO_4';

export type StatusGeralAtendimento =
  | 'triagem'
  | 'autorizado_sies'
  | 'recusado_sies'
  | 'ouvidoria'
  | 'orcamento'
  | 'contratado'
  | 'faturado'
  | 'conciliado'
  | 'pago';

export type StatusSIES = 'pendente' | 'aprovado' | 'recusado' | 'inconsistente';

export type PagadorEntidade = 'Previdencial' | 'Sinaf 24h' | 'Assistencial' | 'Família';

export interface DocumentoAnexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: string;
  status: 'validado' | 'pendente' | 'rejeitado';
  url?: string;
  dataEnvio: string;
}

export interface Atendimento {
  id: string;
  protocolo: string;
  canal: CanalAtendimento;
  fluxoTipo: FluxoTipo;
  titularNome: string;
  titularCpf: string;
  falecidoNome: string;
  falecidoCpf: string;
  parentesco: string;
  numeroApolice: string;
  dataObito: string;
  localObito: string;
  cemiterioDestino: string;
  statusGeral: StatusGeralAtendimento;
  siesStatus: StatusSIES;
  siesCodigoAutorizacao?: string;
  siesMotivoRecusa?: string;
  documentos: DocumentoAnexo[];
  tetoCobertura: number;
  valorTotalOrcamento: number;
  valorCoberto: number;
  valorExcedente: number;
  pagadorDefinido: PagadorEntidade;
  etapaAtualIndex: number;
  dataCriacao: string;
  updatedAt: string;
}
