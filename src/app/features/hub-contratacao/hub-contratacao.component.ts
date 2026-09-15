import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PoModule, PoTableColumn, PoTableAction, PoNotificationService } from '@po-ui/ng-components';
import { MockDatabaseService } from '../../core/services/mock-database.service';
import { OrdemContratacaoPOS } from '../../core/models/pos.model';
import { SystemBadgeComponent } from '../../shared/components/system-badge/system-badge.component';

@Component({
  selector: 'app-hub-contratacao',
  standalone: true,
  imports: [CommonModule, PoModule, SystemBadgeComponent],
  template: `
    <po-page-default p-title="Módulo 3: Hub de Contratação & Ordens de Serviço (POS)">
      <div class="header-box">
        <div>
          <h3>Gestão de POS & Integração com Parceiros Funerários</h3>
          <p>Disparo automatizado de Ordens de Contratação (POS) para a Funerária Bom Pastor e prestadores terceirizados com notificação eletrônica.</p>
        </div>
        <div class="badges">
          <app-system-badge system="SYDLE POS"></app-system-badge>
          <app-system-badge system="BOM PASTOR"></app-system-badge>
          <app-system-badge system="FORNECEDORES"></app-system-badge>
        </div>
      </div>

      <div class="pos-table-card">
        <po-table
          [p-columns]="colunasPOS"
          [p-items]="db.posList()"
          [p-actions]="acoesPOS"
          [p-striped]="true"
        ></po-table>
      </div>
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
    .pos-table-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
  `],
})
export class HubContratacaoComponent {
  readonly db = inject(MockDatabaseService);
  private readonly router = inject(Router);
  private readonly notification = inject(PoNotificationService);

  readonly colunasPOS: PoTableColumn[] = [
    { property: 'numeroPOS', label: 'Nº da POS', width: '150px' },
    { property: 'fornecedorNome', label: 'Prestador / Parceiro', width: '220px' },
    { property: 'fornecedorCnpj', label: 'CNPJ', width: '160px' },
    { property: 'fornecedorTipo', label: 'Tipo de Serviço', width: '160px' },
    { property: 'valorTotal', label: 'Valor da Ordem', type: 'currency', format: 'BRL', width: '140px' },
    {
      property: 'status',
      label: 'Status POS',
      type: 'label',
      width: '130px',
      labels: [
        { value: 'confirmada', color: 'color-10', label: 'Confirmada' },
        { value: 'em_execucao', color: 'color-08', label: 'Em Execução' },
        { value: 'concluida', color: 'color-01', label: 'Concluída' },
        { value: 'emitida', color: 'color-07', label: 'Emitida' },
      ],
    },
    { property: 'dataEmissao', label: 'Data Emissão', width: '150px' },
    {
      property: 'emailDisparado',
      label: 'Notificação',
      type: 'boolean',
      width: '120px',
      boolean: { trueLabel: 'Disparado', falseLabel: 'Pendente' },
    },
  ];

  readonly acoesPOS: PoTableAction[] = [
    {
      label: 'Reenviar E-mail ao Parceiro',
      icon: 'po-icon-mail',
      action: (pos: OrdemContratacaoPOS) => {
        this.notification.success(`Ordem ${pos.numeroPOS} reenviada para ${pos.destinatarioEmail}!`);
      },
    },
    {
      label: 'Abrir no BPM',
      icon: 'po-icon-arrow-right',
      action: (pos: OrdemContratacaoPOS) => {
        this.router.navigate(['/esteira-bpm', pos.atendimentoId]);
      },
    },
  ];
}
