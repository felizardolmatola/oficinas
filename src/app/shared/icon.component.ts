import { Component, computed, input } from '@angular/core';

const PATHS: Record<string, string> = {
  dashboard: 'M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z',
  orders: 'M9 4h6v3H9z M7 5H5v16h14V5h-2 M9 12h6 M9 16h4',
  customers: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  vehicles: 'M5 17H3v-5l2-5h14l2 5v5h-2 M7 17h10 M3 12h18 M7.5 17a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z M19.5 17a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
  stock: 'M21 8l-9-5-9 5 9 5 9-5z M3 8v8l9 5 9-5V8 M12 13v8',
  invoices: 'M6 2h12v20l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6',
  team: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  settings: 'M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M14 4v4 M8 10v4 M16 16v4',
  logout: 'M9 21H5V3h4 M16 17l5-5-5-5 M21 12H9',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  plus: 'M12 5v14 M5 12h14',
  x: 'M6 6l12 12 M18 6L6 18',
  print: 'M6 9V3h12v6 M6 18H4v-7h16v7h-2 M6 14h12v7H6z',
  back: 'M15 18l-6-6 6-6',
  reports: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  alert: 'M12 3l10 18H2z M12 10v5 M12 18h.01',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path [attr.d]="d()" />
    </svg>
  `,
})
export class IconComponent {
  name = input.required<string>();
  size = input(18);
  d = computed(() => PATHS[this.name()] ?? '');
}
