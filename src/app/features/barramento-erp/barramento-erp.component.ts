import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PoModule, PoTableColumn, PoTableAction, PoNotificationService } from '@po-ui/ng-components';
import { MockDatabaseService } from '../../core/services/mock-database.service';
import { PedidoERP } from '../../core/models/erp-order.model';
import { SystemBadgeComponent } from '../../shared/components/system-badge/system-badge.component';

@Component({
  selector: 'app-barramento-erp',
  standalone: true,
  imports: [CommonModule, PoModule, SystemBadgeComponent],
  template: `
    <po-page-default p-title="Módulo 4: Barramento de Integração ERP (TOTVS RM / Protheus)">
      <div class="header-box">
        <div>
          <h3>Faturamento Automatizado & Pedidos Espelhos</h3>
          <p>Sincronização bidirecional de Pedidos de Venda (PV), Pedidos de Compra (PC) espelho, geração de RPS e transmissão de NFSe.</p>
        </div>
        <div class="badges">
          <app-system-badge system="TOTVS ERP RM/PROTHEUS"></app-system-badge>
          <app-system-badge system="FATURAMENTO FISCAL"></app-system-badge>
        </div>
      </div>

      <div class="erp-table-card">
        <po-table
          [p-columns]="colunasERP"
          [p-items]="db.pedidosERP()"
          [p-actions]="acoesERP"
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
    .erp-table-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
  `],
})
export class BarramentoErpComponent {
  readonly db = inject(MockDatabaseService);
  private readonly router = inject(Router);
  private readonly notification = inject(PoNotificationService);

  readonly colunasERP: PoTableColumn[] = [
    {
      property: 'tipo',
      label: 'Tipo Ordem',
      type: 'label',
      width: '130px',
      labels: [
        { value: 'PV', color: 'color-01', label: 'Venda (PV)' },
        { value: 'PC_ESPELHO', color: 'color-08', label: 'Compra Espelho' },
      ],
    },
    { property: 'numeroPedido', label: 'Nº Pedido ERP', width: '160px' },
    { property: 'entidadeEmitente', label: 'Emitente', width: '150px' },
    { property: 'clienteOuContraparte', label: 'Cliente / Contraparte', width: '200px' },
    { property: 'valorTotal', label: 'Valor Total', type: 'currency', format: 'BRL', width: '130px' },
    {
      property: 'status',
      label: 'Status',
      type: 'label',
      width: '120px',
      labels: [
        { value: 'faturado', color: 'color-10', label: 'Faturado' },
        { value: 'transmitido', color: 'color-01', label: 'Transmitido' },
        { value: 'gerado', color: 'color-08', label: 'Gerado' },
      ],
    },
    { property: 'rpsNumero', label: 'RPS', width: '130px' },
    { property: 'nfseNumero', label: 'NFSe', width: '130px' },
  ];

  readonly acoesERP: PoTableAction[] = [
    {
      label: 'Consultar Chave DF-e',
      icon: 'po-icon-eye',
      disabled: (row: PedidoERP) => !row.nfseChaveAcesso,
      action: (row: PedidoERP) => {
        this.notification.information(`Chave DF-e: ${row.nfseChaveAcesso}`);
      },
    },
    {
      label: 'Abrir no BPM',
      icon: 'po-icon-arrow-right',
      action: (row: PedidoERP) => {
        this.router.navigate(['/esteira-bpm', row.atendimentoId]);
      },
    },
  ];
}
