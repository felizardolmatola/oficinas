import { Component, computed, input } from '@angular/core';
import { Status } from '../core/models';

const PILL: Record<Status, string> = {
  'Em curso': 'border-brand bg-brand text-white',
  Aguardando: 'border-ink bg-white text-ink',
  Pronto: 'border-ink bg-ink text-white',
  Entregue: 'border-[#C5CCD8] bg-slate-50 text-brand-muted',
};

@Component({
  selector: 'app-status',
  standalone: true,
  template: `<span class="inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold" [class]="pill()">{{ status() }}</span>`,
})
export class StatusBadgeComponent {
  status = input.required<Status>();
  pill = computed(() => PILL[this.status()]);
}
