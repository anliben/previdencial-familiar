import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { EsteiraBpmComponent } from './features/esteira-bpm/esteira-bpm.component';
import { EntradaDocumentacaoComponent } from './features/entrada-documentacao/entrada-documentacao.component';
import { MotorOrcamentoComponent } from './features/motor-orcamento/motor-orcamento.component';
import { HubContratacaoComponent } from './features/hub-contratacao/hub-contratacao.component';
import { BarramentoErpComponent } from './features/barramento-erp/barramento-erp.component';
import { ConciliacaoFiscalComponent } from './features/conciliacao-fiscal/conciliacao-fiscal.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'esteira-bpm', component: EsteiraBpmComponent },
  { path: 'esteira-bpm/:id', component: EsteiraBpmComponent },
  { path: 'entrada-documentacao', component: EntradaDocumentacaoComponent },
  { path: 'motor-orcamento', component: MotorOrcamentoComponent },
  { path: 'hub-contratacao', component: HubContratacaoComponent },
  { path: 'barramento-erp', component: BarramentoErpComponent },
  { path: 'conciliacao-fiscal', component: ConciliacaoFiscalComponent },
  { path: '**', redirectTo: 'dashboard' },
];
