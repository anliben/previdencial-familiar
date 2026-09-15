import { Injectable, signal, computed } from '@angular/core';
import { Atendimento, StatusSIES, PagadorEntidade } from '../models/atendimento.model';
import { ItemOrcamento } from '../models/orcamento.model';
import { OrdemContratacaoPOS } from '../models/pos.model';
import { PedidoERP } from '../models/erp-order.model';
import { Conciliacao3Way, StatusMatching3Way } from '../models/conciliacao.model';
import {
  INITIAL_ATENDIMENTOS,
  INITIAL_ITENS_ORCAMENTO,
  INITIAL_POS,
  INITIAL_PEDIDOS_ERP,
  INITIAL_CONCILIACOES,
} from '../mocks/initial-data.mock';

const STORAGE_KEYS = {
  ATENDIMENTOS: 'mock_atendimentos_v1',
  ITENS_ORCAMENTO: 'mock_itens_orcamento_v1',
  POS: 'mock_pos_v1',
  PEDIDOS_ERP: 'mock_pedidos_erp_v1',
  CONCILIACOES: 'mock_conciliacoes_v1',
};

export type SystemActor =
  | 'TODOS'
  | 'SINAF'
  | 'SYDLE'
  | 'SIES'
  | 'TOTVS_FUNERARIA'
  | 'TOTVS_ERP'
  | 'TOTVS_TRANSMITE'
  | 'BOM_PASTOR';

@Injectable({
  providedIn: 'root',
})
export class MockDatabaseService {
  private readonly _atendimentos = signal<Atendimento[]>(this.loadFromStorage(STORAGE_KEYS.ATENDIMENTOS, INITIAL_ATENDIMENTOS));
  private readonly _itensOrcamento = signal<Record<string, ItemOrcamento[]>>(this.loadFromStorage(STORAGE_KEYS.ITENS_ORCAMENTO, INITIAL_ITENS_ORCAMENTO));
  private readonly _posList = signal<OrdemContratacaoPOS[]>(this.loadFromStorage(STORAGE_KEYS.POS, INITIAL_POS));
  private readonly _pedidosERP = signal<PedidoERP[]>(this.loadFromStorage(STORAGE_KEYS.PEDIDOS_ERP, INITIAL_PEDIDOS_ERP));
  private readonly _conciliacoes = signal<Conciliacao3Way[]>(this.loadFromStorage(STORAGE_KEYS.CONCILIACOES, INITIAL_CONCILIACOES));
  private readonly _activeActor = signal<SystemActor>('TODOS');

  readonly atendimentos = this._atendimentos.asReadonly();
  readonly posList = this._posList.asReadonly();
  readonly pedidosERP = this._pedidosERP.asReadonly();
  readonly conciliacoes = this._conciliacoes.asReadonly();
  readonly activeActor = this._activeActor.asReadonly();

  readonly stats = computed(() => {
    const list = this._atendimentos();
    const concs = this._conciliacoes();
    return {
      totalAtendimentos: list.length,
      autorizadosSies: list.filter((a) => a.siesStatus === 'aprovado').length,
      recusadosOuOuvidoria: list.filter((a) => a.siesStatus === 'recusado' || a.statusGeral === 'ouvidoria').length,
      totalValorOrcado: list.reduce((acc, a) => acc + a.valorTotalOrcamento, 0),
      totalValorExcedente: list.reduce((acc, a) => acc + a.valorExcedente, 0),
      conciliados100: concs.filter((c) => c.statusMatching === 'conciliado' || c.statusMatching === 'ajustado_manual').length,
      divergentes: concs.filter((c) => c.statusMatching === 'divergente_valor' || c.statusMatching === 'divergente_item' || c.statusMatching === 'pendente_guia').length,
      totalContasPagar: concs.filter((c) => c.enviadoContasPagar).reduce((acc, c) => acc + c.valorNFSe, 0),
    };
  });

  setActorFilter(actor: SystemActor): void {
    this._activeActor.set(actor);
  }

  getAtendimentoById(id: string): Atendimento | undefined {
    return this._atendimentos().find((a) => a.id === id);
  }

  getItensOrcamento(atendimentoId: string): ItemOrcamento[] {
    const all = this._itensOrcamento();
    return all[atendimentoId] ? [...all[atendimentoId]] : [];
  }

  getPOSByAtendimento(atendimentoId: string): OrdemContratacaoPOS[] {
    return this._posList().filter((p) => p.atendimentoId === atendimentoId);
  }

  getPedidosERPByAtendimento(atendimentoId: string): PedidoERP[] {
    return this._pedidosERP().filter((p) => p.atendimentoId === atendimentoId);
  }

  getConciliacaoByAtendimento(atendimentoId: string): Conciliacao3Way | undefined {
    return this._conciliacoes().find((c) => c.atendimentoId === atendimentoId);
  }

  updateSIESStatus(id: string, status: StatusSIES, codigoAuth?: string, motivoRecusa?: string): void {
    this._atendimentos.update((list) =>
      list.map((item) => {
        if (item.id !== id) return item;
        const siesCodigo = codigoAuth ?? (status === 'aprovado' ? `AUTH-SIES-${Math.floor(10000 + Math.random() * 90000)}` : undefined);
        const statusGeral = status === 'aprovado' ? 'autorizado_sies' : status === 'recusado' ? 'recusado_sies' : 'ouvidoria';
        const etapa = status === 'aprovado' ? Math.max(item.etapaAtualIndex, 1) : item.etapaAtualIndex;
        return {
          ...item,
          siesStatus: status,
          siesCodigoAutorizacao: siesCodigo,
          siesMotivoRecusa: motivoRecusa,
          statusGeral: statusGeral,
          etapaAtualIndex: etapa,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
    this.persist(STORAGE_KEYS.ATENDIMENTOS, this._atendimentos());
  }

  recalcularOrcamento(atendimentoId: string, novosItens: ItemOrcamento[]): void {
    const total = novosItens.reduce((acc, i) => acc + i.valorTotal, 0);
    this._itensOrcamento.update((dict) => ({ ...dict, [atendimentoId]: novosItens }));
    this.persist(STORAGE_KEYS.ITENS_ORCAMENTO, this._itensOrcamento());

    this._atendimentos.update((list) =>
      list.map((item) => {
        if (item.id !== atendimentoId) return item;
        const excedente = Math.max(0, total - item.tetoCobertura);
        const coberto = Math.min(total, item.tetoCobertura);
        return {
          ...item,
          valorTotalOrcamento: total,
          valorCoberto: coberto,
          valorExcedente: excedente,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
    this.persist(STORAGE_KEYS.ATENDIMENTOS, this._atendimentos());
  }

  setPagador(atendimentoId: string, pagador: PagadorEntidade): void {
    this._atendimentos.update((list) =>
      list.map((item) => (item.id === atendimentoId ? { ...item, pagadorDefinido: pagador } : item))
    );
    this.persist(STORAGE_KEYS.ATENDIMENTOS, this._atendimentos());
  }

  avancarEtapa(atendimentoId: string): void {
    this._atendimentos.update((list) =>
      list.map((item) => {
        if (item.id !== atendimentoId) return item;
        const proxima = Math.min(item.etapaAtualIndex + 1, 5);
        return {
          ...item,
          etapaAtualIndex: proxima,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
    this.persist(STORAGE_KEYS.ATENDIMENTOS, this._atendimentos());
  }

  emitirPOS(atendimentoId: string, fornecedorNome: string, tipo: any, valor: number, itens: any[]): void {
    const novaPOS: OrdemContratacaoPOS = {
      id: `POS-${Date.now()}`,
      numeroPOS: `POS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      atendimentoId,
      fornecedorNome,
      fornecedorCnpj: '08.771.290/0001-44',
      fornecedorTipo: tipo,
      itens,
      valorTotal: valor,
      dataEmissao: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'confirmada',
      emailDisparado: true,
      destinatarioEmail: 'operacoes@parceiro.com.br',
    };
    this._posList.update((curr) => [novaPOS, ...curr]);
    this.persist(STORAGE_KEYS.POS, this._posList());

    this._atendimentos.update((list) =>
      list.map((item) => (item.id === atendimentoId ? { ...item, statusGeral: 'contratado', etapaAtualIndex: Math.max(item.etapaAtualIndex, 2) } : item))
    );
    this.persist(STORAGE_KEYS.ATENDIMENTOS, this._atendimentos());
  }

  gerarOrdensERP(atendimentoId: string): void {
    const atd = this.getAtendimentoById(atendimentoId);
    if (!atd) return;

    const pvId = `ERP-${Date.now()}-PV`;
    const pcId = `ERP-${Date.now()}-PC`;
    const numPV = `PV-TOTVS-${Math.floor(10000 + Math.random() * 90000)}`;
    const numPC = `PC-ESPELHO-${Math.floor(10000 + Math.random() * 90000)}`;

    const novoPV: PedidoERP = {
      id: pvId,
      atendimentoId,
      tipo: 'PV',
      numeroPedido: numPV,
      entidadeEmitente: atd.canal === 'sinaf_24h' ? 'Sinaf 24h' : 'Previdencial',
      clienteOuContraparte: atd.pagadorDefinido === 'Família' ? `${atd.titularNome} (Família)` : `${atd.pagadorDefinido} Cobertura`,
      valorTotal: atd.valorTotalOrcamento,
      dataCriacao: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'faturado',
      rpsNumero: `RPS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      rpsData: new Date().toISOString().slice(0, 10),
      nfseNumero: `NFSE-${Math.floor(10000 + Math.random() * 90000)}`,
      nfseChaveAcesso: `33260908771290000144550010000${Math.floor(10000 + Math.random() * 90000)}`,
      nfseDataEmissao: new Date().toISOString().replace('T', ' ').slice(0, 16),
      itensResumo: `Atendimento Funerário ${atd.falecidoNome} (${atd.protocolo})`,
    };

    const novoPC: PedidoERP = {
      id: pcId,
      atendimentoId,
      tipo: 'PC_ESPELHO',
      numeroPedido: numPC,
      entidadeEmitente: 'Previdencial',
      clienteOuContraparte: 'Funerária Bom Pastor - BP',
      valorTotal: Math.round(atd.valorTotalOrcamento * 0.4),
      dataCriacao: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'faturado',
      itensResumo: `Serviços Subcontratados Bom Pastor (${atd.protocolo})`,
    };

    this._pedidosERP.update((curr) => [novoPV, novoPC, ...curr]);
    this.persist(STORAGE_KEYS.PEDIDOS_ERP, this._pedidosERP());

    const novaConciliacao: Conciliacao3Way = {
      id: `CNC-${Date.now()}`,
      atendimentoId,
      protocoloAtendimento: atd.protocolo,
      falecidoNome: atd.falecidoNome,
      numeroPC: numPC,
      valorPC: novoPC.valorTotal,
      numeroNFSe: `NFSe-BP-${Math.floor(1000 + Math.random() * 9000)}`,
      valorNFSe: novoPC.valorTotal,
      fornecedorNome: 'Funerária Bom Pastor - BP',
      fornecedorCnpj: '08.771.290/0001-44',
      chaveTransmite: `DFE-33260908771290000144${Math.floor(100000 + Math.random() * 900000)}`,
      dataCapturaTransmite: new Date().toISOString().replace('T', ' ').slice(0, 16),
      guiaExecucaoNumero: `GUIA-BP-${Math.floor(1000 + Math.random() * 9000)}`,
      valorGuia: novoPC.valorTotal,
      statusMatching: 'conciliado',
      divergenciaDetalhes: 'Conciliação automática 3-way concluída com sucesso.',
      enviadoContasPagar: false,
      statusPagamento: 'pendente',
    };

    this._conciliacoes.update((curr) => [novaConciliacao, ...curr]);
    this.persist(STORAGE_KEYS.CONCILIACOES, this._conciliacoes());

    this._atendimentos.update((list) =>
      list.map((item) => (item.id === atendimentoId ? { ...item, statusGeral: 'faturado', etapaAtualIndex: Math.max(item.etapaAtualIndex, 3) } : item))
    );
    this.persist(STORAGE_KEYS.ATENDIMENTOS, this._atendimentos());
  }

  resolverDivergencia3Way(conciliacaoId: string, valorAjustado: number, motivo: string): void {
    this._conciliacoes.update((curr) =>
      curr.map((c) => {
        if (c.id !== conciliacaoId) return c;
        return {
          ...c,
          valorGuia: valorAjustado,
          valorPC: valorAjustado,
          statusMatching: 'ajustado_manual',
          divergenciaDetalhes: `Ajustado manualmente pelo analista: ${motivo}`,
          dataConciliacao: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
    this.persist(STORAGE_KEYS.CONCILIACOES, this._conciliacoes());
  }

  enviarParaContasPagar(conciliacaoId: string): void {
    const numTitulo = `TIT-CP-${Math.floor(10000 + Math.random() * 90000)}`;
    this._conciliacoes.update((curr) =>
      curr.map((c) => {
        if (c.id !== conciliacaoId) return c;
        return {
          ...c,
          enviadoContasPagar: true,
          tituloContasPagarNumero: numTitulo,
          dataConciliacao: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
    this.persist(STORAGE_KEYS.CONCILIACOES, this._conciliacoes());
  }

  liquidarPagamento(conciliacaoId: string): void {
    this._conciliacoes.update((curr) =>
      curr.map((c) => {
        if (c.id !== conciliacaoId) return c;
        return {
          ...c,
          statusPagamento: 'liquidado',
          dataLiquidacao: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
    this.persist(STORAGE_KEYS.CONCILIACOES, this._conciliacoes());
  }

  resetToDefaultData(): void {
    localStorage.removeItem(STORAGE_KEYS.ATENDIMENTOS);
    localStorage.removeItem(STORAGE_KEYS.ITENS_ORCAMENTO);
    localStorage.removeItem(STORAGE_KEYS.POS);
    localStorage.removeItem(STORAGE_KEYS.PEDIDOS_ERP);
    localStorage.removeItem(STORAGE_KEYS.CONCILIACOES);

    this._atendimentos.set(JSON.parse(JSON.stringify(INITIAL_ATENDIMENTOS)));
    this._itensOrcamento.set(JSON.parse(JSON.stringify(INITIAL_ITENS_ORCAMENTO)));
    this._posList.set(JSON.parse(JSON.stringify(INITIAL_POS)));
    this._pedidosERP.set(JSON.parse(JSON.stringify(INITIAL_PEDIDOS_ERP)));
    this._conciliacoes.set(JSON.parse(JSON.stringify(INITIAL_CONCILIACOES)));
    this._activeActor.set('TODOS');
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : JSON.parse(JSON.stringify(fallback));
    } catch {
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  private persist(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage', e);
    }
  }
}
