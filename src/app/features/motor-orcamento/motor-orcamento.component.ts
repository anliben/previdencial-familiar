import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PoModule, PoTableColumn, PoNotificationService } from '@po-ui/ng-components';
import { MockDatabaseService } from '../../core/services/mock-database.service';
import { CATALOGO_SERVICOS_PADRAO } from '../../core/mocks/initial-data.mock';
import { ItemOrcamento } from '../../core/models/orcamento.model';
import { SystemBadgeComponent } from '../../shared/components/system-badge/system-badge.component';

@Component({
  selector: 'app-motor-orcamento',
  standalone: true,
  imports: [CommonModule, FormsModule, PoModule, SystemBadgeComponent],
  template: `
    <po-page-default p-title="Módulo 2: Motor de Regras, Orçamento & Validação de Teto">
      <div class="top-bar">
        <div>
          <h3>Cálculo de Teto vs Excedente e Rota do Pagador</h3>
          <p>Validação da cobertura contratual pelo SIES, precificação com base em itens únicos e desdobramento do excedente.</p>
        </div>
        <div class="badge-group">
          <app-system-badge system="SYDLE ORÇAMENTO"></app-system-badge>
          <app-system-badge system="SIES TETO"></app-system-badge>
        </div>
      </div>

      <!-- Seletor de Caso para Orçamento -->
      <div class="case-select-box">
        <label>Selecione o Atendimento para Análise de Orçamento:</label>
        <div class="case-pill-list">
          <button
            *ngFor="let atd of db.atendimentos()"
            class="case-pill"
            [class.active]="selectedId() === atd.id"
            (click)="selectedId.set(atd.id)"
          >
            {{ atd.protocolo }} - {{ atd.falecidoNome }} ({{ atd.fluxoTipo }})
          </button>
        </div>
      </div>

      <div class="main-orcamento-grid" *ngIf="selectedAtendimento() as atd">
        <!-- Tabela de Itens Ativos -->
        <div class="card-box">
          <div class="card-header">
            <h4>Itens do Orçamento Funerário</h4>
            <span class="subtext">Identificador Único por Serviço</span>
          </div>
          <po-table
            [p-columns]="colunasItens"
            [p-items]="itensDoAtendimento()"
            [p-striped]="true"
          ></po-table>
        </div>

        <!-- Painel Lateral de Totais & Regra SIES -->
        <div class="summary-panel">
          <div class="summary-card">
            <h4>Validação Regulatória SIES</h4>
            <div class="metric-row">
              <span>Valor Total dos Itens:</span>
              <strong>{{ atd.valorTotalOrcamento | currency: 'BRL' : 'symbol' : '1.2-2' }}</strong>
            </div>
            <div class="metric-row">
              <span>Teto da Apólice:</span>
              <strong class="text-success">{{ atd.tetoCobertura | currency: 'BRL' : 'symbol' : '1.2-2' }}</strong>
            </div>
            <div class="divider"></div>
            <div class="metric-row highlight" [class.danger]="atd.valorExcedente > 0">
              <span>Excedente a Cobrar:</span>
              <strong [class.text-danger]="atd.valorExcedente > 0">{{ atd.valorExcedente | currency: 'BRL' : 'symbol' : '1.2-2' }}</strong>
            </div>
            <div class="rule-status">
              <span *ngIf="atd.valorTotalOrcamento <= atd.tetoCobertura" class="rule-ok">
                ✓ Orçamento ≤ Teto: Aprovação direta SIES emitida.
              </span>
              <span *ngIf="atd.valorTotalOrcamento > atd.tetoCobertura" class="rule-warn">
                ⚠ Orçamento > Teto: SIES sinaliza excedente de {{ atd.valorExcedente | currency: 'BRL' : 'symbol' : '1.2-2' }} a ser pago pelo cliente/família.
              </span>
            </div>
          </div>

          <div class="pagador-card">
            <h4>Classificação da Entidade Pagadora</h4>
            <div class="pagador-btn-group">
              <button
                class="pagador-select-btn"
                [class.selected]="atd.pagadorDefinido === 'Previdencial'"
                (click)="setPagador('Previdencial')"
              >
                Previdencial
              </button>
              <button
                class="pagador-select-btn"
                [class.selected]="atd.pagadorDefinido === 'Sinaf 24h'"
                (click)="setPagador('Sinaf 24h')"
              >
                Sinaf 24h
              </button>
              <button
                class="pagador-select-btn"
                [class.selected]="atd.pagadorDefinido === 'Assistencial'"
                (click)="setPagador('Assistencial')"
              >
                Assistencial
              </button>
              <button
                class="pagador-select-btn"
                [class.selected]="atd.pagadorDefinido === 'Família'"
                (click)="setPagador('Família')"
              >
                Família
              </button>
            </div>
          </div>

          <po-button
            p-label="Abrir na Esteira BPM"
            p-icon="po-icon-arrow-right"
            p-kind="primary"
            (p-click)="irParaEsteira(atd.id)"
          ></po-button>
        </div>
      </div>
    </po-page-default>
  `,
  styles: [`
    .top-bar {
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
    .top-bar h3 {
      font-size: 16px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .top-bar p {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .badge-group {
      display: flex;
      gap: 8px;
    }
    .case-select-box {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .case-select-box label {
      font-size: 12px;
      font-weight: 700;
      color: #374151;
      display: block;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .case-pill-list {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .case-pill {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 700;
      color: #4b5563;
      cursor: pointer;
      transition: all 0.2s;
    }
    .case-pill:hover {
      background: #e5e7eb;
    }
    .case-pill.active {
      background: #eff6ff;
      border-color: #2563eb;
      color: #1d4ed8;
    }
    .main-orcamento-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }
    @media (max-width: 900px) {
      .main-orcamento-grid {
        grid-template-columns: 1fr;
      }
    }
    .card-box {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
    .card-header {
      margin-bottom: 16px;
    }
    .card-header h4 {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      margin: 0;
    }
    .subtext {
      font-size: 11px;
      color: #6b7280;
    }
    .summary-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .summary-card, .pagador-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 18px;
    }
    .summary-card h4, .pagador-card h4 {
      font-size: 14px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 14px 0;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 10px 0;
    }
    .metric-row.highlight {
      font-size: 15px;
    }
    .text-success { color: #059669; }
    .text-danger { color: #dc2626; }
    .rule-status {
      margin-top: 14px;
      padding: 10px;
      border-radius: 6px;
      font-size: 12px;
    }
    .rule-ok {
      background: #ecfdf5;
      color: #065f46;
      display: block;
      padding: 8px;
      border-radius: 4px;
    }
    .rule-warn {
      background: #fffbeb;
      color: #92400e;
      display: block;
      padding: 8px;
      border-radius: 4px;
    }
    .pagador-btn-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .pagador-select-btn {
      padding: 8px;
      font-size: 12px;
      font-weight: 700;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      color: #374151;
      transition: all 0.2s;
    }
    .pagador-select-btn.selected {
      background: #2563eb;
      color: #ffffff;
      border-color: #1d4ed8;
    }
  `],
})
export class MotorOrcamentoComponent {
  readonly db = inject(MockDatabaseService);
  private readonly router = inject(Router);
  private readonly notification = inject(PoNotificationService);

  readonly selectedId = signal<string>('ATD-101');

  readonly selectedAtendimento = computed(() => {
    return this.db.getAtendimentoById(this.selectedId());
  });

  readonly itensDoAtendimento = computed(() => {
    return this.db.getItensOrcamento(this.selectedId());
  });

  readonly colunasItens: PoTableColumn[] = [
    { property: 'codigo', label: 'Código', width: '120px' },
    { property: 'descricao', label: 'Item' },
    { property: 'categoria', label: 'Categoria', width: '120px' },
    { property: 'quantidade', label: 'Qtd', width: '70px' },
    { property: 'valorTotal', label: 'Valor', type: 'currency', format: 'BRL', width: '120px' },
    {
      property: 'cobertoContrato',
      label: 'Coberto?',
      type: 'boolean',
      width: '100px',
      boolean: { trueLabel: 'Sim', falseLabel: 'Não' },
    },
    { property: 'fornecedorSugerido', label: 'Parceiro / Fornecedor', width: '180px' },
  ];

  setPagador(pagador: any): void {
    const atd = this.selectedAtendimento();
    if (!atd) return;
    this.db.setPagador(atd.id, pagador);
    this.notification.information(`Pagador definido como: ${pagador}`);
  }

  irParaEsteira(id: string): void {
    this.router.navigate(['/esteira-bpm', id]);
  }
}
