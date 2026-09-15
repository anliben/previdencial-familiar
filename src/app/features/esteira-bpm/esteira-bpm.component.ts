import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PoModule, PoNotificationService, PoTableColumn } from '@po-ui/ng-components';
import { MockDatabaseService } from '../../core/services/mock-database.service';
import { Atendimento, PagadorEntidade } from '../../core/models/atendimento.model';
import { ItemOrcamento } from '../../core/models/orcamento.model';
import { OrdemContratacaoPOS } from '../../core/models/pos.model';
import { PedidoERP } from '../../core/models/erp-order.model';
import { Conciliacao3Way } from '../../core/models/conciliacao.model';
import { FlowStepperComponent } from '../../shared/components/flow-stepper/flow-stepper.component';
import { SystemBadgeComponent } from '../../shared/components/system-badge/system-badge.component';

@Component({
  selector: 'app-esteira-bpm',
  standalone: true,
  imports: [CommonModule, FormsModule, PoModule, FlowStepperComponent, SystemBadgeComponent],
  template: `
    <po-page-default p-title="Esteira BPM - Orquestrador Operacional e Financeiro">
      <!-- Seletor de Cenário / Atendimento -->
      <div class="stepper-header-card">
        <div class="case-tabs">
          <button
            *ngFor="let atd of db.atendimentos()"
            class="case-tab-btn"
            [class.active]="selectedId() === atd.id"
            (click)="selecionarAtendimento(atd.id)"
          >
            <span class="tab-flow-tag">{{ atd.fluxoTipo }}</span>
            <span class="tab-name">{{ atd.falecidoNome }}</span>
            <span class="tab-protocol">{{ atd.protocolo }}</span>
          </button>
        </div>

        <!-- Banner com Detalhes do Caso Ativo -->
        <div class="active-case-banner" *ngIf="currentAtendimento() as atd">
          <div class="banner-top-row">
            <div class="banner-title-group">
              <h2 class="atd-title">{{ atd.falecidoNome }} (Falecido)</h2>
              <span class="atd-sub">Titular: <strong>{{ atd.titularNome }}</strong> ({{ atd.parentesco }}) | Protocolo: {{ atd.protocolo }} | Apólice: {{ atd.numeroApolice }}</span>
            </div>
            <div class="banner-badges">
              <app-system-badge [system]="getSystemActive(atd.etapaAtualIndex)"></app-system-badge>
              <span class="canal-chip">{{ formatCanal(atd.canal) }}</span>
              <span class="status-chip" [ngClass]="'status-' + atd.siesStatus">SIES: {{ atd.siesStatus | uppercase }}</span>
            </div>
          </div>

          <div class="banner-metrics">
            <div class="metric-item">
              <span class="m-label">Teto Apólice</span>
              <span class="m-val">{{ atd.tetoCobertura | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
            </div>
            <div class="metric-item">
              <span class="m-label">Total Orçamento</span>
              <span class="m-val">{{ atd.valorTotalOrcamento | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
            </div>
            <div class="metric-item">
              <span class="m-label">Excedente (Família)</span>
              <span class="m-val" [class.text-danger]="atd.valorExcedente > 0">{{ atd.valorExcedente | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
            </div>
            <div class="metric-item">
              <span class="m-label">Entidade Pagadora</span>
              <span class="m-val text-primary">{{ atd.pagadorDefinido }}</span>
            </div>
            <div class="metric-item" *ngIf="atd.siesCodigoAutorizacao">
              <span class="m-label">Cód. Autorização SIES</span>
              <span class="m-val text-success">{{ atd.siesCodigoAutorizacao }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stepper Visual de 6 Etapas -->
      <app-flow-stepper
        [currentIndex]="currentAtendimento()?.etapaAtualIndex ?? 0"
        (stepClick)="irParaEtapa($event)"
      ></app-flow-stepper>

      <!-- Conteúdo Dinâmico por Etapa -->
      <div class="step-content-container" *ngIf="currentAtendimento() as atd">

        <!-- ETAPA 0: Triagem & Documentação / SIES -->
        <div class="step-card" *ngIf="currentStepIndex() === 0">
          <div class="step-title-bar">
            <div>
              <h3 class="step-title">Etapa 1: Triagem, Coleta Documental e Validação no SIES</h3>
              <p class="step-subtitle">A Sinaf Assistência acolhe o contato, armazena os documentos no SYDLE e valida a cobertura com o SIES.</p>
            </div>
            <app-system-badge system="SIES & SINAF"></app-system-badge>
          </div>

          <!-- Repositório de Documentos SYDLE -->
          <div class="docs-section">
            <h4 class="sub-heading">Repositório de Anexos (SYDLE Central de Documentos)</h4>
            <div class="docs-grid">
              <div *ngFor="let doc of atd.documentos" class="doc-card">
                <div class="doc-icon">📄</div>
                <div class="doc-info">
                  <span class="doc-name">{{ doc.nome }}</span>
                  <span class="doc-meta">{{ doc.tipo }} • {{ doc.tamanho }} • {{ doc.dataEnvio }}</span>
                </div>
                <span class="doc-status" [class.validado]="doc.status === 'validado'">{{ doc.status | uppercase }}</span>
              </div>
            </div>
          </div>

          <!-- Painel de Validação e Decisão SIES -->
          <div class="sies-action-box">
            <h4 class="sub-heading">Decisão Regulatória SIES (Seguradora / Previdencial)</h4>
            <p class="sies-desc">O SIES avalia carência, adimplência e cobertura contratada para emitir o Código de Autorização formal ou registrar negativa.</p>

            <div class="sies-btn-group">
              <po-button
                p-label="Aprovar Cobertura (Gerar Código SIES)"
                p-kind="primary"
                p-icon="po-icon-ok"
                [p-disabled]="atd.siesStatus === 'aprovado'"
                (p-click)="aprovarSIES()"
              ></po-button>
              <po-button
                p-label="Recusar Cobertura"
                p-kind="danger"
                p-icon="po-icon-close"
                (p-click)="recusarSIES()"
              ></po-button>
              <po-button
                p-label="Dados Inconsistentes (Encaminhar Ouvidoria)"
                p-kind="secondary"
                p-icon="po-icon-warning"
                (p-click)="ouvidoriaSIES()"
              ></po-button>
            </div>

            <div *ngIf="atd.siesCodigoAutorizacao" class="auth-box success-box">
              <strong>Atendimento Autorizado com Sucesso no SIES!</strong>
              <span>Código de Autorização emitido: <strong>{{ atd.siesCodigoAutorizacao }}</strong>. Sincronizado automaticamente com o SYDLE.</span>
            </div>

            <div *ngIf="atd.siesStatus === 'recusado'" class="auth-box danger-box">
              <strong>Atendimento Recusado no SIES:</strong>
              <span>{{ atd.siesMotivoRecusa || 'Carência contratual não atingida conforme regras da apólice.' }}</span>
            </div>

            <div class="step-footer-actions">
              <po-button
                p-label="Avançar para Motor de Orçamento & Teto"
                p-icon="po-icon-arrow-right"
                p-kind="primary"
                [p-disabled]="atd.siesStatus !== 'aprovado'"
                (p-click)="avancarEtapa()"
              ></po-button>
            </div>
          </div>
        </div>

        <!-- ETAPA 1: Motor de Regras & Orçamento -->
        <div class="step-card" *ngIf="currentStepIndex() === 1">
          <div class="step-title-bar">
            <div>
              <h3 class="step-title">Etapa 2: Motor de Regras, Pré-Orçamento & Validação de Teto</h3>
              <p class="step-subtitle">O SYDLE monta o orçamento com base nas tabelas de itens, identifica itens adicionais e valida contra o teto da apólice.</p>
            </div>
            <app-system-badge system="SYDLE / SIES"></app-system-badge>
          </div>

          <!-- Tabela de Itens do Orçamento -->
          <div class="orcamento-table-box">
            <h4 class="sub-heading">Itens do Orçamento Funerário (Código Identificador Único)</h4>
            <po-table
              [p-columns]="colunasItens"
              [p-items]="itensOrcamento()"
              [p-striped]="true"
            ></po-table>
          </div>

          <!-- Motor de Cálculo Teto vs Excedente -->
          <div class="calculo-teto-grid">
            <div class="calc-card">
              <span class="calc-label">Total dos Itens</span>
              <span class="calc-val">{{ atd.valorTotalOrcamento | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
              <span class="calc-sub">Soma de todos os serviços</span>
            </div>
            <div class="calc-card">
              <span class="calc-label">Teto Coberto (SIES)</span>
              <span class="calc-val text-success">{{ atd.tetoCobertura | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
              <span class="calc-sub">Limite contratual da apólice</span>
            </div>
            <div class="calc-card" [class.highlight-excedente]="atd.valorExcedente > 0">
              <span class="calc-label">Valor Excedente a Cobrar</span>
              <span class="calc-val" [class.text-danger]="atd.valorExcedente > 0">{{ atd.valorExcedente | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
              <span class="calc-sub">{{ atd.valorExcedente > 0 ? 'Cobrança do cliente/família' : '100% Coberto sem excedente' }}</span>
            </div>
          </div>

          <!-- Definição da Rota do Pagador -->
          <div class="pagador-box">
            <h4 class="sub-heading">Definição da Entidade Pagadora (Regra de Negócio)</h4>
            <div class="pagador-options">
              <label class="pagador-radio" [class.selected]="atd.pagadorDefinido === 'Previdencial'">
                <input type="radio" name="pagador" [value]="'Previdencial'" [ngModel]="atd.pagadorDefinido" (ngModelChange)="setPagador('Previdencial')" />
                <div>
                  <strong>Opção A: Previdencial</strong>
                  <span>Pagador direto via seguradora</span>
                </div>
              </label>

              <label class="pagador-radio" [class.selected]="atd.pagadorDefinido === 'Sinaf 24h'">
                <input type="radio" name="pagador" [value]="'Sinaf 24h'" [ngModel]="atd.pagadorDefinido" (ngModelChange)="setPagador('Sinaf 24h')" />
                <div>
                  <strong>Opção B: Sinaf 24h</strong>
                  <span>Pedido desmembrado faturado na Sinaf</span>
                </div>
              </label>

              <label class="pagador-radio" [class.selected]="atd.pagadorDefinido === 'Assistencial'">
                <input type="radio" name="pagador" [value]="'Assistencial'" [ngModel]="atd.pagadorDefinido" (ngModelChange)="setPagador('Assistencial')" />
                <div>
                  <strong>Opção C: Assistencial</strong>
                  <span>Plano de assistência familiar</span>
                </div>
              </label>

              <label class="pagador-radio" [class.selected]="atd.pagadorDefinido === 'Família'">
                <input type="radio" name="pagador" [value]="'Família'" [ngModel]="atd.pagadorDefinido" (ngModelChange)="setPagador('Família')" />
                <div>
                  <strong>Opção D: Própria Família</strong>
                  <span>Itens adicionais pagos pelo familiar</span>
                </div>
              </label>
            </div>
          </div>

          <div class="step-footer-actions">
            <po-button
              p-label="Aprovar Orçamento e Avançar para Contratação"
              p-icon="po-icon-arrow-right"
              p-kind="primary"
              (p-click)="avancarEtapa()"
            ></po-button>
          </div>
        </div>

        <!-- ETAPA 2: Hub de Contratação & POS -->
        <div class="step-card" *ngIf="currentStepIndex() === 2">
          <div class="step-title-bar">
            <div>
              <h3 class="step-title">Etapa 3: Hub de Contratação, Emissão de POS e Parceiros</h3>
              <p class="step-subtitle">O SYDLE gera a Ordem de Contratação (POS) e notifica o prestador parceiro (Bom Pastor e fornecedores terceirizados).</p>
            </div>
            <app-system-badge system="SYDLE / BOM PASTOR"></app-system-badge>
          </div>

          <!-- Ordens de Contratação Geradas -->
          <div class="pos-list-section">
            <h4 class="sub-heading">Ordens de Contratação (POS) Emitidas</h4>
            <div class="pos-grid">
              <div *ngFor="let pos of getPOSList()" class="pos-card">
                <div class="pos-card-header">
                  <span class="pos-num">{{ pos.numeroPOS }}</span>
                  <span class="pos-status">{{ pos.status | uppercase }}</span>
                </div>
                <h4 class="pos-fornecedor">{{ pos.fornecedorNome }}</h4>
                <span class="pos-cnpj">CNPJ: {{ pos.fornecedorCnpj }} • {{ pos.fornecedorTipo }}</span>
                <div class="pos-items">
                  <div *ngFor="let it of pos.itens" class="pos-item-row">
                    <span>{{ it.descricao }}</span>
                    <strong>{{ it.valorTotal | currency: 'BRL' : 'symbol' : '1.2-2' }}</strong>
                  </div>
                </div>
                <div class="pos-card-footer">
                  <div class="pos-total">
                    <span>Total POS:</span>
                    <strong>{{ pos.valorTotal | currency: 'BRL' : 'symbol' : '1.2-2' }}</strong>
                  </div>
                  <div class="pos-email-notif" *ngIf="pos.emailDisparado">
                    <span class="email-check">✉ E-mail de autorização disparado para {{ pos.destinatarioEmail }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ação Rápida de Emissão de POS Adicional -->
          <div class="emitir-pos-box">
            <h4 class="sub-heading">Simular Disparo de Nova POS ao Fornecedor</h4>
            <div class="emitir-controls">
              <po-button
                p-label="Disparar POS Adicional para Tanatopraxia / Flores"
                p-icon="po-icon-mail"
                p-kind="secondary"
                (p-click)="emitirNovaPOS()"
              ></po-button>
            </div>
          </div>

          <div class="step-footer-actions">
            <po-button
              p-label="Integrar com Barramento TOTVS ERP"
              p-icon="po-icon-arrow-right"
              p-kind="primary"
              (p-click)="integrarERP()"
            ></po-button>
          </div>
        </div>

        <!-- ETAPA 3: Barramento TOTVS ERP -->
        <div class="step-card" *ngIf="currentStepIndex() === 3">
          <div class="step-title-bar">
            <div>
              <h3 class="step-title">Etapa 4: Barramento de Integração TOTVS ERP (Faturamento & Compras)</h3>
              <p class="step-subtitle">Criação automatizada de Pedido de Venda (PV) e Pedido de Compra (PC) espelho, geração de RPS e transmissão de Nota Fiscal.</p>
            </div>
            <app-system-badge system="TOTVS ERP (RM/Protheus)"></app-system-badge>
          </div>

          <!-- Lista de Pedidos ERP Espelhados -->
          <div class="erp-orders-section">
            <h4 class="sub-heading">Ordens Integradas no Barramento ERP</h4>
            <div class="erp-grid">
              <div *ngFor="let pedido of getPedidosERP()" class="erp-card">
                <div class="erp-header">
                  <span class="erp-type" [class.pv]="pedido.tipo === 'PV'" [class.pc]="pedido.tipo === 'PC_ESPELHO'">
                    {{ pedido.tipo === 'PV' ? 'PEDIDO DE VENDA (PV)' : 'PEDIDO DE COMPRA ESPELHO (PC)' }}
                  </span>
                  <span class="erp-status">{{ pedido.status | uppercase }}</span>
                </div>
                <h4 class="erp-num">{{ pedido.numeroPedido }}</h4>
                <div class="erp-details">
                  <div>Emitente: <strong>{{ pedido.entidadeEmitente }}</strong></div>
                  <div>Cliente/Contraparte: <strong>{{ pedido.clienteOuContraparte }}</strong></div>
                  <div>Resumo: {{ pedido.itensResumo }}</div>
                  <div class="erp-val">Valor: <strong>{{ pedido.valorTotal | currency: 'BRL' : 'symbol' : '1.2-2' }}</strong></div>
                </div>

                <!-- Dados Fiscais (RPS / NFSe) -->
                <div class="fiscal-details-box" *ngIf="pedido.rpsNumero">
                  <div class="fiscal-row">
                    <span>Recibo Provisório (RPS):</span>
                    <strong>{{ pedido.rpsNumero }} ({{ pedido.rpsData }})</strong>
                  </div>
                  <div class="fiscal-row" *ngIf="pedido.nfseNumero">
                    <span>Nota Fiscal de Serviços (NFSe):</span>
                    <strong class="text-success">{{ pedido.nfseNumero }}</strong>
                  </div>
                  <div class="chave-acesso" *ngIf="pedido.nfseChaveAcesso">
                    Chave DF-e: {{ pedido.nfseChaveAcesso }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="step-footer-actions">
            <po-button
              p-label="Avançar para Conciliação Fiscal 3-Way"
              p-icon="po-icon-arrow-right"
              p-kind="primary"
              (p-click)="avancarEtapa()"
            ></po-button>
          </div>
        </div>

        <!-- ETAPA 4: Conciliação Fiscal 3-Way -->
        <div class="step-card" *ngIf="currentStepIndex() === 4">
          <div class="step-title-bar">
            <div>
              <h3 class="step-title">Etapa 5: Módulo de Conferência Fiscal (Matching 3-Way)</h3>
              <p class="step-subtitle">Conciliação automática de 3 pontas: Pedido de Compra (ERP) x Nota Fiscal (TOTVS Transmite) x Guia de Execução (SYDLE).</p>
            </div>
            <app-system-badge system="TOTVS TRANSMITE & SYDLE"></app-system-badge>
          </div>

          <!-- Bloco do Matching 3-Way -->
          <div class="matching-container" *ngIf="getConciliacao() as conc">
            <div class="matching-status-header">
              <span class="matching-badge" [ngClass]="conc.statusMatching">
                STATUS: {{ formatStatusMatching(conc.statusMatching) }}
              </span>
              <span class="matching-info">Fornecedor: {{ conc.fornecedorNome }} (CNPJ: {{ conc.fornecedorCnpj }})</span>
            </div>

            <div class="threeway-grid">
              <!-- PONTA 1: Pedido de Compra -->
              <div class="way-card">
                <div class="way-header">
                  <span class="way-tag">Ponta 1</span>
                  <h4>Pedido de Compra (ERP)</h4>
                </div>
                <div class="way-data">
                  <div class="way-field"><span class="flabel">Número PC:</span> <strong>{{ conc.numeroPC }}</strong></div>
                  <div class="way-field"><span class="flabel">Valor Autorizado:</span> <strong class="way-val">{{ conc.valorPC | currency: 'BRL' : 'symbol' : '1.2-2' }}</strong></div>
                  <div class="way-field"><span class="flabel">Origem:</span> <span>TOTVS ERP / SYDLE</span></div>
                </div>
                <div class="way-match-icon">✓ Integrado</div>
              </div>

              <!-- PONTA 2: NFSe Fornecedor (Transmite) -->
              <div class="way-card" [class.way-divergent]="conc.valorNFSe !== conc.valorPC">
                <div class="way-header">
                  <span class="way-tag">Ponta 2</span>
                  <h4>NFSe Fornecedor (Transmite)</h4>
                </div>
                <div class="way-data">
                  <div class="way-field"><span class="flabel">Número NFSe:</span> <strong>{{ conc.numeroNFSe }}</strong></div>
                  <div class="way-field"><span class="flabel">Valor Faturado:</span> <strong class="way-val">{{ conc.valorNFSe | currency: 'BRL' : 'symbol' : '1.2-2' }}</strong></div>
                  <div class="way-field"><span class="flabel">Chave DF-e:</span> <span class="chave-mini">{{ conc.chaveTransmite }}</span></div>
                </div>
                <div class="way-match-icon" [class.alert]="conc.valorNFSe !== conc.valorPC">
                  {{ conc.valorNFSe === conc.valorPC ? '✓ Capturado Transmite' : '⚠ Divergência de Valor' }}
                </div>
              </div>

              <!-- PONTA 3: Guia de Execução -->
              <div class="way-card" [class.way-pending]="conc.valorGuia === 0">
                <div class="way-header">
                  <span class="way-tag">Ponta 3</span>
                  <h4>Guia / Comprovante (SYDLE)</h4>
                </div>
                <div class="way-data">
                  <div class="way-field"><span class="flabel">Guia Nº:</span> <strong>{{ conc.guiaExecucaoNumero || 'Pendente de upload' }}</strong></div>
                  <div class="way-field"><span class="flabel">Valor Comprovado:</span> <strong class="way-val">{{ conc.valorGuia | currency: 'BRL' : 'symbol' : '1.2-2' }}</strong></div>
                  <div class="way-field"><span class="flabel">Status:</span> <span>{{ conc.valorGuia > 0 ? 'Conferido no SYDLE' : 'Aguardando Guia' }}</span></div>
                </div>
                <div class="way-match-icon" [class.alert]="conc.valorGuia === 0">
                  {{ conc.valorGuia > 0 ? '✓ Validado' : '⌛ Pendente de Guia' }}
                </div>
              </div>
            </div>

            <!-- Detalhes de Divergência & Tratamento de Exceção -->
            <div class="divergencia-box" *ngIf="conc.divergenciaDetalhes">
              <div class="divergencia-content">
                <strong>Parecer da Conciliação Fiscal:</strong>
                <span>{{ conc.divergenciaDetalhes }}</span>
              </div>
              <div class="divergencia-actions" *ngIf="conc.statusMatching === 'divergente_valor' || conc.statusMatching === 'pendente_guia'">
                <po-button
                  p-label="Resolver Exceção Fiscal Manualmente"
                  p-icon="po-icon-edit"
                  p-kind="secondary"
                  (p-click)="abrirModalAjuste(conc)"
                ></po-button>
              </div>
            </div>

            <div class="step-footer-actions">
              <po-button
                p-label="Aprovar Conciliação e Liberar para Contas a Pagar"
                p-icon="po-icon-ok"
                p-kind="primary"
                [p-disabled]="conc.statusMatching === 'divergente_valor' || conc.statusMatching === 'pendente_guia'"
                (p-click)="liberarContasPagar(conc.id)"
              ></po-button>
            </div>
          </div>
        </div>

        <!-- ETAPA 5: Pagamento & Liquidação -->
        <div class="step-card" *ngIf="currentStepIndex() === 5">
          <div class="step-title-bar">
            <div>
              <h3 class="step-title">Etapa 6: Contas a Pagar & Liquidação Financeira no ERP</h3>
              <p class="step-subtitle">O SIES valida o faturamento final, o TOTVS ERP gera o título no Contas a Pagar e realiza a liquidação bancária.</p>
            </div>
            <app-system-badge system="TOTVS CONTAS A PAGAR"></app-system-badge>
          </div>

          <div class="pagamento-card" *ngIf="getConciliacao() as conc">
            <div class="pagamento-header">
              <div class="pagamento-title-group">
                <h4>Título Contas a Pagar: {{ conc.tituloContasPagarNumero || 'TIT-CP-98104' }}</h4>
                <span>Fornecedor: <strong>{{ conc.fornecedorNome }}</strong> | NFSe: {{ conc.numeroNFSe }}</span>
              </div>
              <span class="pagamento-status" [class.liquidado]="conc.statusPagamento === 'liquidado'">
                {{ conc.statusPagamento === 'liquidado' ? 'LIQUIDADO' : 'AGUARDANDO PAGAMENTO' }}
              </span>
            </div>

            <div class="pagamento-val-box">
              <span class="pval-label">Valor Total a Liquidar</span>
              <span class="pval-number">{{ conc.valorNFSe | currency: 'BRL' : 'symbol' : '1.2-2' }}</span>
              <span class="pval-sub" *ngIf="conc.dataLiquidacao">Liquidado com sucesso em {{ conc.dataLiquidacao }}</span>
            </div>

            <div class="pagamento-actions">
              <po-button
                p-label="Realizar Liquidação Bancária no ERP"
                p-icon="po-icon-finance"
                p-kind="primary"
                [p-disabled]="conc.statusPagamento === 'liquidado'"
                (p-click)="liquidarPagamento(conc.id)"
              ></po-button>
            </div>

            <div *ngIf="conc.statusPagamento === 'liquidado'" class="final-success-banner">
              <h3>✓ Fluxo Completo Executado e Conciliado com Sucesso!</h3>
              <p>Todas as integrações entre Sinaf, SYDLE, SIES, Bom Pastor e TOTVS ERP foram validadas de ponta a ponta.</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Modal de Ajuste de Divergência -->
      <po-modal
        #modalAjuste
        p-title="Tratamento Manual de Exceção Fiscal (SYDLE / Transmite)"
        [p-primary-action]="acaoSalvarAjuste"
        [p-secondary-action]="acaoFecharModal"
      >
        <div class="modal-form">
          <p>Informe o valor retificado da NFSe ou autorize a diferença negociada para conciliar a ponta fiscal:</p>
          <div class="form-field">
            <label>Valor Corrigido (R$):</label>
            <input type="number" [(ngModel)]="valorAjusteModal" class="input-text" />
          </div>
          <div class="form-field">
            <label>Justificativa do Analista Fiscal:</label>
            <textarea [(ngModel)]="justificativaAjusteModal" rows="3" class="input-text"></textarea>
          </div>
        </div>
      </po-modal>
    </po-page-default>
  `,
  styles: [`
    .stepper-header-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .case-tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
      overflow-x: auto;
    }
    .case-tab-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: 12px 18px;
      background: transparent;
      border: none;
      border-right: 1px solid #e5e7eb;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      min-width: 190px;
      text-align: left;
      transition: all 0.2s ease;
    }
    .case-tab-btn:hover {
      background: #f3f4f6;
    }
    .case-tab-btn.active {
      background: #ffffff;
      border-bottom-color: #2563eb;
    }
    .tab-flow-tag {
      font-size: 10px;
      font-weight: 800;
      color: #2563eb;
    }
    .tab-name {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
    }
    .tab-protocol {
      font-size: 11px;
      color: #6b7280;
    }

    .active-case-banner {
      padding: 16px 20px;
    }
    .banner-top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 12px;
      flex-wrap: wrap;
    }
    .atd-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .atd-sub {
      font-size: 12px;
      color: #6b7280;
    }
    .banner-badges {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .canal-chip {
      font-size: 11px;
      font-weight: 700;
      background: #f3f4f6;
      color: #374151;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .banner-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      background: #f9fafb;
      padding: 12px 16px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .m-label {
      font-size: 11px;
      color: #6b7280;
      font-weight: 600;
      text-transform: uppercase;
    }
    .m-val {
      font-size: 16px;
      font-weight: 800;
      color: #111827;
    }
    .text-primary { color: #2563eb; }
    .text-success { color: #059669; }
    .text-danger { color: #dc2626; }

    .step-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .step-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 14px;
    }
    .step-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .step-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }

    .sub-heading {
      font-size: 14px;
      font-weight: 700;
      color: #374151;
      margin: 0 0 12px 0;
    }
    .docs-section {
      margin-bottom: 24px;
    }
    .docs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
    }
    .doc-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px 14px;
    }
    .doc-icon {
      font-size: 24px;
    }
    .doc-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
    .doc-name {
      font-size: 12px;
      font-weight: 700;
      color: #1f2937;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .doc-meta {
      font-size: 11px;
      color: #6b7280;
    }
    .doc-status {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f3f4f6;
      color: #6b7280;
    }
    .doc-status.validado {
      background: #dcfce7;
      color: #15803d;
    }

    .sies-action-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 18px;
    }
    .sies-desc {
      font-size: 12px;
      color: #64748b;
      margin: 0 0 16px 0;
    }
    .sies-btn-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .auth-box {
      padding: 12px 16px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .success-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    .danger-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .step-footer-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      margin-top: 20px;
    }

    /* Etapa 1 Styles */
    .orcamento-table-box {
      margin-bottom: 24px;
    }
    .calculo-teto-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .calc-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .calc-card.highlight-excedente {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .calc-label {
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
    }
    .calc-val {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
    }
    .calc-sub {
      font-size: 11px;
      color: #6b7280;
    }

    .pagador-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .pagador-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .pagador-radio {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .pagador-radio.selected {
      border-color: #2563eb;
      background: #eff6ff;
    }
    .pagador-radio div {
      display: flex;
      flex-direction: column;
    }
    .pagador-radio strong {
      font-size: 13px;
      color: #111827;
    }
    .pagador-radio span {
      font-size: 11px;
      color: #6b7280;
    }

    /* Etapa 2: POS */
    .pos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .pos-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pos-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pos-num {
      font-size: 13px;
      font-weight: 800;
      color: #2563eb;
    }
    .pos-status {
      font-size: 10px;
      font-weight: 700;
      background: #ecfdf5;
      color: #047857;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .pos-fornecedor {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .pos-cnpj {
      font-size: 11px;
      color: #6b7280;
    }
    .pos-items {
      border-top: 1px solid #f3f4f6;
      border-bottom: 1px solid #f3f4f6;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .pos-item-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .pos-card-footer {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 4px;
    }
    .pos-total {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }
    .email-check {
      font-size: 11px;
      color: #059669;
      font-weight: 600;
    }
    .emitir-pos-box {
      background: #f9fafb;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    /* Etapa 3: ERP */
    .erp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .erp-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }
    .erp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .erp-type {
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .erp-type.pv { background: #dbeafe; color: #1d4ed8; }
    .erp-type.pc { background: #fef3c7; color: #b45309; }
    .erp-status {
      font-size: 10px;
      font-weight: 700;
      background: #f3f4f6;
      color: #4b5563;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .erp-num {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 8px 0;
    }
    .erp-details {
      font-size: 12px;
      color: #4b5563;
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 12px;
    }
    .erp-val {
      font-size: 14px;
      margin-top: 4px;
    }
    .fiscal-details-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .fiscal-row {
      display: flex;
      justify-content: space-between;
    }
    .chave-acesso {
      font-size: 10px;
      color: #64748b;
      word-break: break-all;
      margin-top: 4px;
    }

    /* Etapa 4: 3-Way Matching */
    .matching-status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .matching-badge {
      font-size: 12px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .matching-badge.conciliado, .matching-badge.ajustado_manual { background: #dcfce7; color: #15803d; }
    .matching-badge.divergente_valor, .matching-badge.divergente_item { background: #fee2e2; color: #991b1b; }
    .matching-badge.pendente_guia { background: #fef9c3; color: #854d0e; }

    .threeway-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .way-card {
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .way-card.way-divergent {
      border-color: #ef4444;
      background: #fff5f5;
    }
    .way-card.way-pending {
      border-color: #f59e0b;
      background: #fffdf5;
    }
    .way-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .way-tag {
      font-size: 10px;
      font-weight: 800;
      background: #e5e7eb;
      color: #374151;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .way-header h4 {
      font-size: 13px;
      font-weight: 700;
      margin: 0;
    }
    .way-data {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      margin-bottom: 12px;
    }
    .way-val {
      font-size: 16px;
      color: #111827;
    }
    .chave-mini {
      font-size: 10px;
      color: #64748b;
      word-break: break-all;
    }
    .way-match-icon {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 4px 8px;
      border-radius: 4px;
      text-align: center;
    }
    .way-match-icon.alert {
      color: #dc2626;
      background: #fef2f2;
    }

    .divergencia-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .divergencia-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      color: #991b1b;
      flex: 1;
    }

    /* Etapa 5: Pagamento */
    .pagamento-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .pagamento-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .pagamento-header h4 {
      font-size: 16px;
      font-weight: 800;
      margin: 0 0 4px 0;
    }
    .pagamento-status {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: #fef3c7;
      color: #92400e;
    }
    .pagamento-status.liquidado {
      background: #dcfce7;
      color: #15803d;
    }
    .pagamento-val-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .pval-label {
      font-size: 12px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
    }
    .pval-number {
      font-size: 32px;
      font-weight: 800;
      color: #059669;
    }
    .pval-sub {
      font-size: 12px;
      color: #6b7280;
    }
    .final-success-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      color: #166534;
    }
    .final-success-banner h3 {
      margin: 0 0 6px 0;
    }
    .final-success-banner p {
      margin: 0;
      font-size: 13px;
    }

    /* Modal */
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-field label {
      font-size: 12px;
      font-weight: 700;
      color: #374151;
    }
    .input-text {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    }
  `],
})
export class EsteiraBpmComponent implements OnInit {
  readonly db = inject(MockDatabaseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(PoNotificationService);

  readonly selectedId = signal<string>('ATD-101');
  readonly currentStepIndex = signal<number>(0);

  valorAjusteModal: number = 0;
  justificativaAjusteModal: string = '';
  conciliacaoAjusteId: string = '';

  readonly currentAtendimento = computed(() => {
    return this.db.getAtendimentoById(this.selectedId());
  });

  readonly itensOrcamento = computed(() => {
    return this.db.getItensOrcamento(this.selectedId());
  });

  readonly colunasItens: PoTableColumn[] = [
    { property: 'codigo', label: 'Código', width: '120px' },
    { property: 'descricao', label: 'Descrição do Item' },
    { property: 'categoria', label: 'Categoria', width: '130px' },
    { property: 'quantidade', label: 'Qtd', width: '70px' },
    { property: 'valorUnitario', label: 'Unitário', type: 'currency', format: 'BRL', width: '110px' },
    { property: 'valorTotal', label: 'Total', type: 'currency', format: 'BRL', width: '120px' },
    {
      property: 'cobertoContrato',
      label: 'Coberto?',
      type: 'boolean',
      width: '100px',
      boolean: { trueLabel: 'Sim', falseLabel: 'Não' },
    },
    { property: 'fornecedorSugerido', label: 'Prestador Sugerido', width: '180px' },
  ];

  acaoSalvarAjuste = {
    label: 'Salvar e Conciliar',
    action: () => this.confirmarAjusteManual(),
  };

  acaoFecharModal = {
    label: 'Cancelar',
    action: () => {},
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && this.db.getAtendimentoById(id)) {
        this.selecionarAtendimento(id);
      } else if (this.db.atendimentos().length > 0) {
        this.selecionarAtendimento(this.db.atendimentos()[0].id);
      }
    });
  }

  selecionarAtendimento(id: string): void {
    this.selectedId.set(id);
    const atd = this.db.getAtendimentoById(id);
    if (atd) {
      this.currentStepIndex.set(atd.etapaAtualIndex);
    }
  }

  irParaEtapa(stepIndex: number): void {
    this.currentStepIndex.set(stepIndex);
  }

  avancarEtapa(): void {
    const atd = this.currentAtendimento();
    if (!atd) return;
    this.db.avancarEtapa(atd.id);
    const updated = this.db.getAtendimentoById(atd.id);
    if (updated) {
      this.currentStepIndex.set(updated.etapaAtualIndex);
    }
    this.notification.success('Etapa avançada com sucesso no orquestrador!');
  }

  aprovarSIES(): void {
    const atd = this.currentAtendimento();
    if (!atd) return;
    this.db.updateSIESStatus(atd.id, 'aprovado');
    this.notification.success('Atendimento autorizado pelo SIES!');
  }

  recusarSIES(): void {
    const atd = this.currentAtendimento();
    if (!atd) return;
    this.db.updateSIESStatus(atd.id, 'recusado', undefined, 'Recusa de garantia: Apólice suspensa por falta de pagamento.');
    this.notification.warning('Atendimento recusado no regulador SIES.');
  }

  ouvidoriaSIES(): void {
    const atd = this.currentAtendimento();
    if (!atd) return;
    this.db.updateSIESStatus(atd.id, 'inconsistente', undefined, 'Encaminhado para ouvidoria para validação documental.');
    this.notification.information('Caso remetido à Ouvidoria Sinaf.');
  }

  setPagador(pagador: PagadorEntidade): void {
    const atd = this.currentAtendimento();
    if (!atd) return;
    this.db.setPagador(atd.id, pagador);
    this.notification.information(`Entidade pagadora atualizada: ${pagador}`);
  }

  emitirNovaPOS(): void {
    const atd = this.currentAtendimento();
    if (!atd) return;
    this.db.emitirPOS(atd.id, 'Funerária Bom Pastor - BP', 'Funerária Parceira', 1200.0, [
      { codigo: 'SRV-ADD-01', descricao: 'Serviço Cemiterial Complementar Bom Pastor', quantidade: 1, valorTotal: 1200.0 },
    ]);
    this.notification.success('Nova Ordem de Contratação (POS) emitida e enviada por e-mail!');
  }

  integrarERP(): void {
    const atd = this.currentAtendimento();
    if (!atd) return;
    this.db.gerarOrdensERP(atd.id);
    this.currentStepIndex.set(3);
    this.notification.success('Pedidos PV e PC espelho integrados no barramento TOTVS ERP!');
  }

  getPOSList(): OrdemContratacaoPOS[] {
    const atd = this.currentAtendimento();
    return atd ? this.db.getPOSByAtendimento(atd.id) : [];
  }

  getPedidosERP(): PedidoERP[] {
    const atd = this.currentAtendimento();
    return atd ? this.db.getPedidosERPByAtendimento(atd.id) : [];
  }

  getConciliacao(): Conciliacao3Way | undefined {
    const atd = this.currentAtendimento();
    return atd ? this.db.getConciliacaoByAtendimento(atd.id) : undefined;
  }

  abrirModalAjuste(conc: Conciliacao3Way): void {
    this.conciliacaoAjusteId = conc.id;
    this.valorAjusteModal = conc.valorNFSe;
    this.justificativaAjusteModal = 'Divergência validada com prestador e autorizada pela gerência operacional.';
    const modal = document.querySelector('po-modal') as any;
    if (modal && modal.open) {
      modal.open();
    }
  }

  confirmarAjusteManual(): void {
    if (this.conciliacaoAjusteId) {
      this.db.resolverDivergencia3Way(this.conciliacaoAjusteId, this.valorAjusteModal, this.justificativaAjusteModal);
      this.notification.success('Exceção fiscal ajustada manualmente! Status atualizado para Ajustado.');
    }
  }

  liberarContasPagar(conciliacaoId: string): void {
    this.db.enviarParaContasPagar(conciliacaoId);
    this.avancarEtapa();
  }

  liquidarPagamento(conciliacaoId: string): void {
    this.db.liquidarPagamento(conciliacaoId);
    this.notification.success('Título liquidado no TOTVS Contas a Pagar com sucesso!');
  }

  getSystemActive(stepIndex: number): string {
    switch (stepIndex) {
      case 0: return 'SIES & SINAF';
      case 1: return 'SYDLE & SIES';
      case 2: return 'SYDLE & BOM PASTOR';
      case 3: return 'TOTVS ERP';
      case 4: return 'TOTVS TRANSMITE';
      case 5: return 'CONTAS A PAGAR';
      default: return 'ORQUESTRADOR';
    }
  }

  formatCanal(canal: string): string {
    if (canal === 'sinaf_24h') return 'Sinaf 24h';
    if (canal === 'previdencial') return 'Previdencial';
    return 'Assistencial / Família';
  }

  formatStatusMatching(status: string): string {
    switch (status) {
      case 'conciliado': return 'CONCILIADO 100%';
      case 'ajustado_manual': return 'AJUSTADO MANUAL';
      case 'divergente_valor': return 'DIVERGÊNCIA DE VALOR';
      case 'divergente_item': return 'DIVERGÊNCIA DE ITEM';
      case 'pendente_guia': return 'PENDENTE DE GUIA';
      default: return status.toUpperCase();
    }
  }
}
