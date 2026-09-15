export interface PedidoERP {
  id: string;
  atendimentoId: string;
  tipo: 'PV' | 'PC_ESPELHO';
  numeroPedido: string;
  entidadeEmitente: 'Sinaf 24h' | 'Previdencial' | 'Bom Pastor - BP' | 'Assistencial';
  clienteOuContraparte: string;
  valorTotal: number;
  dataCriacao: string;
  status: 'gerado' | 'transmitido' | 'faturado';
  rpsNumero?: string;
  rpsData?: string;
  nfseNumero?: string;
  nfseChaveAcesso?: string;
  nfseDataEmissao?: string;
  itensResumo: string;
}
