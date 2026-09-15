import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { PoModule, PoMenuItem, PoToolbarAction, PoToolbarProfile } from '@po-ui/ng-components';
import { MockDatabaseService } from './core/services/mock-database.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PoModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly db = inject(MockDatabaseService);
  private readonly router = inject(Router);

  readonly menus: PoMenuItem[] = [
    { label: 'Visão Geral (Dashboard)', link: '/dashboard', icon: 'po-icon-chart-columns', shortLabel: 'Dashboard' },
    { label: 'Esteira BPM (4 Fluxos)', link: '/esteira-bpm', icon: 'po-icon-layers', shortLabel: 'Esteira BPM' },
    { label: '1. Entrada & SIES', link: '/entrada-documentacao', icon: 'po-icon-user-add', shortLabel: 'Entrada' },
    { label: '2. Orçamento & Teto', link: '/motor-orcamento', icon: 'po-icon-calculator', shortLabel: 'Orçamento' },
    { label: '3. Hub de Contratação', link: '/hub-contratacao', icon: 'po-icon-handshake', shortLabel: 'Contratação' },
    { label: '4. Barramento TOTVS ERP', link: '/barramento-erp', icon: 'po-icon-server', shortLabel: 'Barramento' },
    { label: '5. Conciliação 3-Way', link: '/conciliacao-fiscal', icon: 'po-icon-finance-secure', shortLabel: 'Conciliação' },
  ];

  readonly profile: PoToolbarProfile = {
    title: 'Operador / Analista SIES',
    subtitle: 'operacoes@sinaf.com.br',
  };

  readonly actions: PoToolbarAction[] = [
    {
      label: 'Restaurar Dados Demo',
      icon: 'po-icon-refresh',
      action: () => {
        this.db.resetToDefaultData();
        this.router.navigate(['/dashboard']);
      },
    },
  ];
}
