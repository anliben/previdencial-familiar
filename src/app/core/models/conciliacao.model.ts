export type StatusMatching3Way =
  | 'conciliado'
  | 'divergente_valor'
  | 'divergente_item'
  | 'pendente_guia'
  | 'ajustado_manual';

export interface Conciliacao3Way {
  id: string;
  atendimentoId: string;
  protocoloAtendimento: string;
  falecidoNome: string;
  numeroPC: string;
  valorPC: number;
  numeroNFSe: string;
  valorNFSe: number;
  fornecedorNome: string;
  fornecedorCnpj: string;
  chaveTransmite: string;
  dataCapturaTransmite: string;
  guiaExecucaoNumero: string;
  valorGuia: number;
  statusMatching: StatusMatching3Way;
  divergenciaDetalhes?: string;
  enviadoContasPagar: boolean;
  dataConciliacao?: string;
  tituloContasPagarNumero?: string;
  statusPagamento: 'pendente' | 'liquidado';
  dataLiquidacao?: string;
}
