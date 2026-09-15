import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PoModule, PoTableColumn, PoTableAction, PoNotificationService } from '@po-ui/ng-components';
import { MockDatabaseService } from '../../core/services/mock-database.service';
import { Conciliacao3Way } from '../../core/models/conciliacao.model';
import { SystemBadgeComponent } from '../../shared/components/system-badge/system-badge.component';

@Component({
  selector: 'app-conciliacao-fiscal',
  standalone: true,
  imports: [CommonModule, FormsModule, PoModule, SystemBadgeComponent],
  template: `
    <po-page-default p-title="Módulo 5: Conciliação Fiscal 3-Way (TOTVS Transmite x ERP)">
      <div class="header-box">
        <div>
          <h3>Mesa de Conferência & Matching 3-Way</h3>
          <p>Conferência automática entre o Pedido de Compra (ERP), a NFSe capturada pelo TOTVS Transmite e o Comprovante/Guia de Execução anexado no SYDLE.</p>
        </div>
        <div class="badges">
          <app-system-badge system="TOTVS TRANSMITE"></app-system-badge>
          <app-system-badge system="SYDLE CONCILIAÇÃO"></app-system-badge>
          <app-system-badge system="CONTAS A PAGAR"></app-system-badge>
        </div>
      </div>

      <!-- Métricas do Módulo 5 -->
      <div class="conciliacao-metrics-grid">
        <div class="cmetric-card">
          <span class="clabel">Total de Notas Transmite</span>
          <span class="cval">{{ db.conciliacoes().length }}</span>
        </div>
        <div class="cmetric-card">
          <span class="clabel">Conciliadas 100%</span>
          <span class="cval text-success">{{ db.stats().conciliados100 }}</span>
        </div>
        <div class="cmetric-card">
          <span class="clabel">Divergências Pendentes</span>
          <span class="cval text-danger">{{ db.stats().divergentes }}</span>
        </div>
        <div class="cmetric-card">
          <span class="clabel">Integrado Contas a Pagar</span>
          <span class="cval">{{ db.stats().totalContasPagar | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
        </div>
      </div>

      <!-- Tabela 3-Way Matching -->
      <div class="table-container">
        <div class="table-header-filter">
          <h4>Notas Fiscais Capturadas & Posição de Conciliação</h4>
          <div class="filter-pills">
            <button class="fpill" [class.active]="filtroStatus() === 'TODOS'" (click)="filtroStatus.set('TODOS')">Todas</button>
            <button class="fpill" [class.active]="filtroStatus() === 'conciliado'" (click)="filtroStatus.set('conciliado')">Conciliadas</button>
            <button class="fpill" [class.active]="filtroStatus() === 'divergente'" (click)="filtroStatus.set('divergente')">Divergentes / Pendentes</button>
          </div>
        </div>

        <po-table
          [p-columns]="colunasConciliacao"
          [p-items]="listaFiltrada()"
          [p-actions]="acoesConciliacao"
          [p-striped]="true"
        ></po-table>
      </div>

      <!-- Modal de Ajuste de Divergência -->
      <po-modal
        #modalAjuste
        p-title="Resolver Exceção de Conciliação Fiscal"
        [p-primary-action]="acaoSalvarAjuste"
        [p-secondary-action]="acaoCancelarAjuste"
      >
        <div class="modal-body">
          <p>Informe o valor autorizado para o Pedido e registre a justificativa operacional para liberação no Contas a Pagar:</p>
          <div class="mfield">
            <label>Valor Retificado / Aprovado (R$):</label>
            <input type="number" [(ngModel)]="valorModal" class="minput" />
          </div>
          <div class="mfield">
            <label>Justificativa:</label>
            <textarea [(ngModel)]="justificativaModal" rows="3" class="minput"></textarea>
          </div>
        </div>
      </po-modal>
    </po-page-default>
  `,
  styles: [`
    .header-box {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 18px 24px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-box h3 {
      font-size: 16px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .header-box p {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .badges {
      display: flex;
      gap: 8px;
    }
    .conciliacao-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .cmetric-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .clabel {
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
    }
    .cval {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
    }
    .text-success { color: #059669; }
    .text-danger { color: #dc2626; }

    .table-container {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
    .table-header-filter {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .table-header-filter h4 {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      margin: 0;
    }
    .filter-pills {
      display: flex;
      gap: 6px;
    }
    .fpill {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      color: #4b5563;
      transition: all 0.2s;
    }
    .fpill.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #1d4ed8;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .mfield {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mfield label {
      font-size: 12px;
      font-weight: 700;
    }
    .minput {
      padding: 8px 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
    }
  `],
})
export class ConciliacaoFiscalComponent {
  readonly db = inject(MockDatabaseService);
  private readonly router = inject(Router);
  private readonly notification = inject(PoNotificationService);

  readonly filtroStatus = signal<'TODOS' | 'conciliado' | 'divergente'>('TODOS');
  conciliacaoSelecionadaId: string = '';
  valorModal: number = 0;
  justificativaModal: string = '';

  readonly listaFiltrada = computed(() => {
    const list = this.db.conciliacoes();
    const filtro = this.filtroStatus();
    if (filtro === 'conciliado') {
      return list.filter((c) => c.statusMatching === 'conciliado' || c.statusMatching === 'ajustado_manual');
    }
    if (filtro === 'divergente') {
      return list.filter((c) => c.statusMatching === 'divergente_valor' || c.statusMatching === 'divergente_item' || c.statusMatching === 'pendente_guia');
    }
    return list;
  });

  readonly colunasConciliacao: PoTableColumn[] = [
    { property: 'protocoloAtendimento', label: 'Protocolo', width: '140px' },
    { property: 'fornecedorNome', label: 'Fornecedor', width: '200px' },
    { property: 'numeroPC', label: '1. Pedido (PC)', width: '150px' },
    { property: 'valorPC', label: 'Vlr Pedido', type: 'currency', format: 'BRL', width: '120px' },
    { property: 'numeroNFSe', label: '2. NF Transmite', width: '140px' },
    { property: 'valorNFSe', label: 'Vlr NFSe', type: 'currency', format: 'BRL', width: '120px' },
    { property: 'valorGuia', label: '3. Vlr Guia', type: 'currency', format: 'BRL', width: '120px' },
    {
      property: 'statusMatching',
      label: 'Status 3-Way',
      type: 'label',
      width: '150px',
      labels: [
        { value: 'conciliado', color: 'color-10', label: 'Conciliado 100%' },
        { value: 'ajustado_manual', color: 'color-10', label: 'Ajustado Manual' },
        { value: 'divergente_valor', color: 'color-07', label: 'Divergência Vlr' },
        { value: 'pendente_guia', color: 'color-08', label: 'Pendente Guia' },
      ],
    },
    {
      property: 'enviadoContasPagar',
      label: 'Contas a Pagar',
      type: 'boolean',
      width: '130px',
      boolean: { trueLabel: 'Integrado', falseLabel: 'Pendente' },
    },
    {
      property: 'statusPagamento',
      label: 'Pagamento',
      type: 'label',
      width: '120px',
      labels: [
        { value: 'liquidado', color: 'color-10', label: 'Liquidado' },
        { value: 'pendente', color: 'color-08', label: 'Pendente' },
      ],
    },
  ];

  readonly acoesConciliacao: PoTableAction[] = [
    {
      label: 'Resolver Divergência',
      icon: 'po-icon-edit',
      action: (row: Conciliacao3Way) => this.abrirModalAjuste(row),
    },
    {
      label: 'Liberar Contas a Pagar',
      icon: 'po-icon-finance',
      disabled: (row: Conciliacao3Way) => row.enviadoContasPagar || row.statusMatching === 'divergente_valor' || row.statusMatching === 'pendente_guia',
      action: (row: Conciliacao3Way) => {
        this.db.enviarParaContasPagar(row.id);
        this.notification.success(`Conciliação ${row.protocoloAtendimento} enviada ao Contas a Pagar com sucesso!`);
      },
    },
    {
      label: 'Liquidar Título',
      icon: 'po-icon-ok',
      disabled: (row: Conciliacao3Way) => !row.enviadoContasPagar || row.statusPagamento === 'liquidado',
      action: (row: Conciliacao3Way) => {
        this.db.liquidarPagamento(row.id);
        this.notification.success(`Título ${row.tituloContasPagarNumero} liquidado no ERP com sucesso!`);
      },
    },
    {
      label: 'Ver na Esteira BPM',
      icon: 'po-icon-arrow-right',
      action: (row: Conciliacao3Way) => this.router.navigate(['/esteira-bpm', row.atendimentoId]),
    },
  ];

  acaoSalvarAjuste = {
    label: 'Confirmar Conciliação',
    action: () => this.salvarAjuste(),
  };

  acaoCancelarAjuste = {
    label: 'Cancelar',
    action: () => {},
  };

  abrirModalAjuste(row: Conciliacao3Way): void {
    this.conciliacaoSelecionadaId = row.id;
    this.valorModal = row.valorNFSe;
    this.justificativaModal = 'Ajuste e validação fiscal manual para viabilizar integração com Contas a Pagar.';
    const modal = document.querySelector('po-modal') as any;
    if (modal && modal.open) {
      modal.open();
    }
  }

  salvarAjuste(): void {
    if (this.conciliacaoSelecionadaId) {
      this.db.resolverDivergencia3Way(this.conciliacaoSelecionadaId, this.valorModal, this.justificativaModal);
      this.notification.success('Exceção fiscal ajustada manualmente!');
    }
  }
}
