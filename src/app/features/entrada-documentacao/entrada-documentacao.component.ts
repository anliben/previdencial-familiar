import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PoModule, PoTableColumn, PoTableAction, PoNotificationService } from '@po-ui/ng-components';
import { MockDatabaseService } from '../../core/services/mock-database.service';
import { Atendimento } from '../../core/models/atendimento.model';
import { SystemBadgeComponent } from '../../shared/components/system-badge/system-badge.component';

@Component({
  selector: 'app-entrada-documentacao',
  standalone: true,
  imports: [CommonModule, PoModule, SystemBadgeComponent],
  template: `
    <po-page-default p-title="Módulo 1: Entrada, Coleta Documental & Validação SIES">
      <div class="header-info-box">
        <div>
          <h3>Canal de Entrada & Triagem</h3>
          <p>Recepção de novos atendimentos funerários (Sinaf 24h, Previdencial e Assistencial), conferência de anexos e autorização regulatória no SIES.</p>
        </div>
        <div class="system-tags">
          <app-system-badge system="SINAF ASSISTÊNCIA"></app-system-badge>
          <app-system-badge system="SYDLE ANEXOS"></app-system-badge>
          <app-system-badge system="SIES REGULADOR"></app-system-badge>
        </div>
      </div>

      <div class="table-card">
        <po-table
          [p-columns]="colunas"
          [p-items]="db.atendimentos()"
          [p-actions]="acoes"
          [p-striped]="true"
        ></po-table>
      </div>
    </po-page-default>
  `,
  styles: [`
    .header-info-box {
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
    .header-info-box h3 {
      font-size: 16px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .header-info-box p {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .system-tags {
      display: flex;
      gap: 8px;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
  `],
})
export class EntradaDocumentacaoComponent {
  readonly db = inject(MockDatabaseService);
  private readonly router = inject(Router);
  private readonly notification = inject(PoNotificationService);

  readonly colunas: PoTableColumn[] = [
    { property: 'protocolo', label: 'Protocolo', width: '140px' },
    { property: 'falecidoNome', label: 'Falecido', width: '200px' },
    { property: 'titularNome', label: 'Titular / Declarante', width: '180px' },
    { property: 'numeroApolice', label: 'Nº Apólice / Plano', width: '140px' },
    {
      property: 'siesStatus',
      label: 'Status SIES',
      type: 'label',
      width: '130px',
      labels: [
        { value: 'aprovado', color: 'color-10', label: 'Autorizado' },
        { value: 'recusado', color: 'color-07', label: 'Recusado' },
        { value: 'pendente', color: 'color-08', label: 'Em Análise' },
        { value: 'inconsistente', color: 'color-09', label: 'Ouvidoria' },
      ],
    },
    { property: 'siesCodigoAutorizacao', label: 'Código Autorização SIES', width: '180px' },
    { property: 'dataCriacao', label: 'Data Abertura', width: '150px' },
  ];

  readonly acoes: PoTableAction[] = [
    {
      label: 'Aprovar no SIES',
      icon: 'po-icon-ok',
      disabled: (row: Atendimento) => row.siesStatus === 'aprovado',
      action: (row: Atendimento) => {
        this.db.updateSIESStatus(row.id, 'aprovado');
        this.notification.success(`Atendimento ${row.protocolo} aprovado no SIES com novo código emitido!`);
      },
    },
    {
      label: 'Recusar Cobertura',
      icon: 'po-icon-close',
      action: (row: Atendimento) => {
        this.db.updateSIESStatus(row.id, 'recusado', undefined, 'Recusa de garantia: Cobertura inválida.');
        this.notification.warning(`Atendimento ${row.protocolo} recusado no SIES.`);
      },
    },
    {
      label: 'Visualizar na Esteira',
      icon: 'po-icon-arrow-right',
      action: (row: Atendimento) => this.router.navigate(['/esteira-bpm', row.id]),
    },
  ];
}
