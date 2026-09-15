import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FlowStep {
  index: number;
  title: string;
  system: string;
  shortDesc: string;
}

@Component({
  selector: 'app-flow-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stepper-container">
      <div
        *ngFor="let step of steps; let i = index"
        class="step-item"
        [class.completed]="i < currentIndex"
        [class.active]="i === currentIndex"
        [class.future]="i > currentIndex"
        (click)="stepClick.emit(i)"
      >
        <div class="step-header">
          <div class="step-circle">
            <span *ngIf="i < currentIndex" class="step-check">✓</span>
            <span *ngIf="i >= currentIndex">{{ i + 1 }}</span>
          </div>
          <span class="step-system-tag">{{ step.system }}</span>
        </div>
        <div class="step-body">
          <span class="step-title">{{ step.title }}</span>
          <span class="step-desc">{{ step.shortDesc }}</span>
        </div>
        <div *ngIf="i < steps.length - 1" class="step-line" [class.line-completed]="i < currentIndex"></div>
      </div>
    </div>
  `,
  styles: [`
    .stepper-container {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      padding: 16px 20px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      margin-bottom: 20px;
      overflow-x: auto;
    }
    .step-item {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 140px;
      position: relative;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: background 0.2s ease;
    }
    .step-item:hover {
      background: #f9fafb;
    }
    .step-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .step-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      background: #e5e7eb;
      color: #6b7280;
      flex-shrink: 0;
    }
    .completed .step-circle {
      background: #10b981;
      color: #ffffff;
    }
    .active .step-circle {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }
    .step-system-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      background: #f3f4f6;
      color: #4b5563;
      text-transform: uppercase;
    }
    .active .step-system-tag {
      background: #dbeafe;
      color: #1d4ed8;
    }
    .completed .step-system-tag {
      background: #d1fae5;
      color: #065f46;
    }
    .step-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .step-title {
      font-size: 12px;
      font-weight: 700;
      color: #374151;
    }
    .active .step-title {
      color: #1d4ed8;
    }
    .step-desc {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.2;
    }
    .active .step-desc {
      color: #4b5563;
    }
    .step-line {
      position: absolute;
      top: 22px;
      right: -8px;
      width: 16px;
      height: 2px;
      background: #e5e7eb;
      z-index: 1;
    }
    .line-completed {
      background: #10b981;
    }
  `],
})
export class FlowStepperComponent {
  @Input() currentIndex: number = 0;
  @Output() stepClick = new EventEmitter<number>();

  steps: FlowStep[] = [
    { index: 0, title: '1. Triagem & Documentos', system: 'Sinaf / SIES', shortDesc: 'Elegibilidade e Código Auth' },
    { index: 1, title: '2. Orçamento & Teto', system: 'SYDLE / ERP', shortDesc: 'Cálculo Teto vs Excedente' },
    { index: 2, title: '3. Contratação (POS)', system: 'SYDLE / Parceiros', shortDesc: 'Emissão POS e E-mail BP' },
    { index: 3, title: '4. Barramento TOTVS', system: 'TOTVS ERP', shortDesc: 'PV, PC Espelho e NFSe' },
    { index: 4, title: '5. Conciliação 3-Way', system: 'Transmite / SYDLE', shortDesc: 'Matching PC x NF x Guia' },
    { index: 5, title: '6. Pagamento ERP', system: 'Contas a Pagar', shortDesc: 'Liquidação Financeira' },
  ];
}
