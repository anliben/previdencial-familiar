import { TestBed } from '@angular/core/testing';
import { MockDatabaseService } from './mock-database.service';

describe('MockDatabaseService', () => {
  let service: MockDatabaseService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockDatabaseService);
  });

  it('should be created and have initial atendimentos', () => {
    expect(service).toBeTruthy();
    expect(service.atendimentos().length).toBe(4);
  });

  it('should calculate initial statistics properly', () => {
    const stats = service.stats();
    expect(stats.totalAtendimentos).toBe(4);
    expect(stats.totalValorOrcado).toBeGreaterThan(0);
    expect(stats.conciliados100).toBeGreaterThan(0);
  });

  it('should update SIES status and code when approved', () => {
    service.updateSIESStatus('ATD-101', 'aprovado', 'AUTH-TEST-123');
    const atd = service.getAtendimentoById('ATD-101');
    expect(atd?.siesStatus).toBe('aprovado');
    expect(atd?.siesCodigoAutorizacao).toBe('AUTH-TEST-123');
  });

  it('should update pagador correctly', () => {
    service.setPagador('ATD-101', 'Família');
    const atd = service.getAtendimentoById('ATD-101');
    expect(atd?.pagadorDefinido).toBe('Família');
  });

  it('should advance stage index correctly', () => {
    const atd = service.getAtendimentoById('ATD-101');
    const initialEtapa = atd?.etapaAtualIndex ?? 0;
    service.avancarEtapa('ATD-101');
    const updated = service.getAtendimentoById('ATD-101');
    expect(updated?.etapaAtualIndex).toBe(initialEtapa + 1);
  });

  it('should resolve 3-way matching divergence', () => {
    service.resolverDivergencia3Way('CNC-102-1', 1700.0, 'Negociado com BP');
    const conc = service.conciliacoes().find((c) => c.id === 'CNC-102-1');
    expect(conc?.statusMatching).toBe('ajustado_manual');
  });

  it('should send to contas a pagar and liquidate', () => {
    service.enviarParaContasPagar('CNC-101-1');
    let conc = service.conciliacoes().find((c) => c.id === 'CNC-101-1');
    expect(conc?.enviadoContasPagar).toBe(true);
    expect(conc?.tituloContasPagarNumero).toContain('TIT-CP-');

    service.liquidarPagamento('CNC-101-1');
    conc = service.conciliacoes().find((c) => c.id === 'CNC-101-1');
    expect(conc?.statusPagamento).toBe('liquidado');
  });
});
