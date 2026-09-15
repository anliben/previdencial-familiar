import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-system-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="system-badge-pill" [ngClass]="getBadgeClass()">
      <span class="dot"></span>
      {{ getLabel() }}
    </span>
  `,
  styles: [`
    .system-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .badge-sies { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-sydle { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-sinaf { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-bp { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
    .badge-totvs { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .badge-transmite { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
    .badge-default { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
  `],
})
export class SystemBadgeComponent {
  @Input() system: string = '';

  getBadgeClass(): string {
    const s = this.system.toUpperCase();
    if (s.includes('SIES')) return 'badge-sies';
    if (s.includes('SYDLE')) return 'badge-sydle';
    if (s.includes('SINAF')) return 'badge-sinaf';
    if (s.includes('PASTOR') || s.includes('BP')) return 'badge-bp';
    if (s.includes('TRANSMITE')) return 'badge-transmite';
    if (s.includes('TOTVS') || s.includes('ERP')) return 'badge-totvs';
    return 'badge-default';
  }

  getLabel(): string {
    return this.system || 'SISTEMA';
  }
}
