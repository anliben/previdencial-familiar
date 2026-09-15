import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PoModule, PoTableColumn, PoTableAction } from '@po-ui/ng-components';
import { MockDatabaseService } from '../../core/services/mock-database.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { SystemBadgeComponent } from '../../shared/components/system-badge/system-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PoModule, SystemBadgeComponent],
  template: `
    <po-page-default p-title="Visão Geral da Orquestração Funerária & Financeira">
      <!-- Barra Superior de Ações Executivas -->
      <div class="header-action-row">
        <div class="system-summary">
          <app-system-badge system="SIES"></app-system-badge>
          <app-system-badge system="SYDLE"></app-system-badge>
          <app-system-badge system="TOTVS FUNERÁRIA"></app-system-badge>
          <app-system-badge system="TOTVS ERP"></app-system-badge>
          <app-system-badge system="TOTVS TRANSMITE"></app-system-badge>
          <app-system-badge system="BOM PASTOR"></app-system-badge>
        </div>
        <div class="header-buttons">
          <po-button
            p-label="Restaurar Dados Demo"
            p-icon="po-icon-refresh"
            p-kind="tertiary"
            (p-click)="onResetDemo()"
          ></po-button>
          <po-button
            p-label="Iniciar Novo Atendimento"
            p-icon="po-icon-plus"
            p-kind="primary"
            (p-click)="irParaEsteira()"
          ></po-button>
        </div>
      </div>

      <!-- KPI Widgets -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Atendimentos Ativos</span>
          <span class="kpi-value">{{ db.stats().totalAtendimentos }}</span>
          <span class="kpi-subtext text-success">{{ db.stats().autorizadosSies }} autorizados no SIES</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Total Orçado</span>
          <span class="kpi-value">{{ db.stats().totalValorOrcado | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
          <span class="kpi-subtext">Valor global dos serviços</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Excedente Faturado</span>
          <span class="kpi-value text-accent">{{ db.stats().totalValorExcedente | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
          <span class="kpi-subtext">Coparticipação cliente/família</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Conciliação 3-Way</span>
          <span class="kpi-value text-success">{{ db.stats().conciliados100 }} / {{ db.conciliacoes().length }}</span>
          <span class="kpi-subtext">Transmite x Pedido x Guia</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">Divergências Fiscais</span>
          <span class="kpi-value text-danger">{{ db.stats().divergentes }}</span>
          <span class="kpi-subtext">Exigem tratamento analista</span>
        </div>
      </div>

      <!-- 4 Fluxos Mapeados - Atalhos de Apresentação -->
      <div class="flow-shortcuts-section">
        <h3 class="section-title">Cenários Mapeados para Demonstração (4 Fluxos Integrados)</h3>
        <div class="flows-grid">
          <div class="flow-card" (click)="abrirFluxo('ATD-101')">
            <div class="flow-badge-row">
              <span class="flow-num">FLUXO 1</span>
              <span class="badge-status">Ponta a Ponta</span>
            </div>
            <h4 class="flow-title">Previdencial com Sinaf 24h</h4>
            <p class="flow-desc">Triagem, consulta SIES, cálculo de teto vs excedente (R$ 1.200 excedente), POS para terceiros, faturamento TOTVS e conciliação.</p>
            <div class="flow-actors">
              <span class="actor-tag">Sinaf 24h</span>
              <span class="actor-tag">SIES</span>
              <span class="actor-tag">SYDLE</span>
              <span class="actor-tag">TOTVS ERP</span>
            </div>
          </div>

          <div class="flow-card" (click)="abrirFluxo('ATD-102')">
            <div class="flow-badge-row">
              <span class="flow-num">FLUXO 2</span>
              <span class="badge-status">Canal Parceiro</span>
            </div>
            <h4 class="flow-title">Sinaf 24h com Bom Pastor (BP)</h4>
            <p class="flow-desc">TOTVS Funerária alimenta orçamento, SYDLE define pagador (Previdencial vs Sinaf) e comanda pedido espelho com fornecedor BP.</p>
            <div class="flow-actors">
              <span class="actor-tag">TOTVS Funerária</span>
              <span class="actor-tag">Bom Pastor</span>
              <span class="actor-tag">SYDLE</span>
            </div>
          </div>

          <div class="flow-card" (click)="abrirFluxo('ATD-103')">
            <div class="flow-badge-row">
              <span class="flow-num">FLUXO 3</span>
              <span class="badge-status">Assistencial</span>
            </div>
            <h4 class="flow-title">Assistencial / Família com Sinaf 24h</h4>
            <p class="flow-desc">Elegibilidade assistencial, caso de ouvidoria, consulta tabela de preços TOTVS ERP, POS terceirizada e quitação no Contas a Pagar.</p>
            <div class="flow-actors">
              <span class="actor-tag">Assistencial</span>
              <span class="actor-tag">Ouvidoria</span>
              <span class="actor-tag">TOTVS ERP</span>
            </div>
          </div>

          <div class="flow-card" (click)="abrirFluxo('ATD-104')">
            <div class="flow-badge-row">
              <span class="flow-num">FLUXO 4</span>
              <span class="badge-status">Adicionais Família</span>
            </div>
            <h4 class="flow-title">Sinaf 24h com Bom Pastor (Família)</h4>
            <p class="flow-desc">Autorização com itens de contrato, desdobramento fiscal com NF contra BP e excedente faturado diretamente à Família com RPS/NF.</p>
            <div class="flow-actors">
              <span class="actor-tag">Bom Pastor</span>
              <span class="actor-tag">Família</span>
              <span class="actor-tag">TOTVS Transmite</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela Geral de Atendimentos -->
      <div class="table-container">
        <h3 class="section-title">Atendimentos em Andamento no Barramento</h3>
        <po-table
          [p-columns]="colunas"
          [p-items]="db.atendimentos()"
          [p-actions]="acoesTabela"
          [p-striped]="true"
        >
          <ng-template p-table-cell-template let-row="row" let-column="column">
            <span *ngIf="column.property === 'canal'">
              <span class="canal-badge" [ngClass]="row.canal">{{ formatCanal(row.canal) }}</span>
            </span>
          </ng-template>
        </po-table>
      </div>
    </po-page-default>
  `,
  styles: [`
    .header-action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }
    .system-summary {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .header-buttons {
      display: flex;
      gap: 10px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #ffffff;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .kpi-label {
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
    }
    .kpi-value {
      font-size: 24px;
      font-weight: 800;
      color: #111827;
    }
    .kpi-subtext {
      font-size: 11px;
      color: #6b7280;
    }
    .text-success { color: #059669; }
    .text-danger { color: #dc2626; }
    .text-accent { color: #d97706; }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
    }
    .flow-shortcuts-section {
      margin-bottom: 24px;
    }
    .flows-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .flow-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .flow-card:hover {
      transform: translateY(-2px);
      border-color: #2563eb;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
    }
    .flow-badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .flow-num {
      font-size: 11px;
      font-weight: 800;
      color: #2563eb;
      background: #eff6ff;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .badge-status {
      font-size: 11px;
      color: #4b5563;
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .flow-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 6px 0;
    }
    .flow-desc {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.4;
      margin: 0 0 12px 0;
    }
    .flow-actors {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .actor-tag {
      font-size: 10px;
      font-weight: 600;
      background: #f9fafb;
      color: #4b5563;
      padding: 2px 6px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    .table-container {
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .canal-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .canal-badge.previdencial { background: #e0f2fe; color: #0369a1; }
    .canal-badge.sinaf_24h { background: #ecfdf5; color: #047857; }
    .canal-badge.assistencial_familia { background: #fef3c7; color: #b45309; }
  `],
})
export class DashboardComponent {
  readonly db = inject(MockDatabaseService);
  private readonly router = inject(Router);

  readonly colunas: PoTableColumn[] = [
    { property: 'protocolo', label: 'Protocolo', width: '130px' },
    { property: 'falecidoNome', label: 'Falecido', width: '180px' },
    { property: 'titularNome', label: 'Titular', width: '160px' },
    {
      property: 'fluxoTipo',
      label: 'Fluxo',
      type: 'label',
      width: '110px',
      labels: [
        { value: 'FLUXO_1', color: 'color-01', label: 'Fluxo 1 (Sinaf 24h)' },
        { value: 'FLUXO_2', color: 'color-02', label: 'Fluxo 2 (Bom Pastor)' },
        { value: 'FLUXO_3', color: 'color-03', label: 'Fluxo 3 (Assistencial)' },
        { value: 'FLUXO_4', color: 'color-04', label: 'Fluxo 4 (Família)' },
      ],
    },
    { property: 'tetoCobertura', label: 'Teto Apólice', type: 'currency', format: 'BRL', width: '120px' },
    { property: 'valorTotalOrcamento', label: 'Total Orçado', type: 'currency', format: 'BRL', width: '120px' },
    { property: 'valorExcedente', label: 'Excedente', type: 'currency', format: 'BRL', width: '110px' },
    {
      property: 'siesStatus',
      label: 'SIES',
      type: 'label',
      width: '110px',
      labels: [
        { value: 'aprovado', color: 'color-10', label: 'Aprovado' },
        { value: 'recusado', color: 'color-07', label: 'Recusado' },
        { value: 'pendente', color: 'color-08', label: 'Pendente' },
        { value: 'inconsistente', color: 'color-09', label: 'Ouvidoria' },
      ],
    },
    { property: 'pagadorDefinido', label: 'Pagador', width: '120px' },
  ];

  readonly acoesTabela: PoTableAction[] = [
    {
      label: 'Simular Esteira BPM',
      icon: 'po-icon-arrow-right',
      action: (row: Atendimento) => this.abrirFluxo(row.id),
    },
  ];

  formatCanal(canal: string): string {
    if (canal === 'sinaf_24h') return 'Sinaf 24h';
    if (canal === 'previdencial') return 'Previdencial';
    return 'Assistencial / Família';
  }

  abrirFluxo(atendimentoId: string): void {
    this.router.navigate(['/esteira-bpm', atendimentoId]);
  }

  irParaEsteira(): void {
    this.router.navigate(['/esteira-bpm']);
  }

  onResetDemo(): void {
    this.db.resetToDefaultData();
  }
}
