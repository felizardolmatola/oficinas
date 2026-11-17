import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { STATUSES } from '../core/models';
import { today } from '../core/seed';
import { IconComponent } from '../shared/icon.component';
import { MtPipe } from '../shared/mt.pipe';
import { StatusBadgeComponent } from '../shared/status-badge.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, DatePipe, MtPipe, StatusBadgeComponent, IconComponent],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="h1">Painel</h1>
        <p class="text-sm text-brand-muted">{{ auth.user()?.workshop }} · visão geral da oficina</p>
      </div>
      <a routerLink="/ordens/nova" class="btn-dark"><app-icon name="plus" /> Nova ordem</a>
    </header>

    <section class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Indicadores">
      @for (k of kpis(); track k.label) {
        <a [routerLink]="k.link" class="card block p-5 hover:border-brand" [class.bg-brand]="k.dark" [class.border-brand]="k.dark" [class.text-white]="k.dark">
          <p class="text-[13px]" [class.text-brand-soft]="k.dark" [class.text-brand-muted]="!k.dark">{{ k.label }}</p>
          <p class="mt-2 text-2xl font-bold" [class.text-red-700]="k.alert">{{ k.value }}</p>
        </a>
      }
    </section>

    <div class="mt-6 grid gap-6 xl:grid-cols-3">
      <section class="xl:col-span-2">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-bold">Ordens recentes</h2>
          <a routerLink="/ordens" class="link-btn">Ver todas</a>
        </div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Nº</th><th>Cliente</th><th>Veículo</th><th>Estado</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              @for (o of recent(); track o.id) {
                <tr>
                  <td><a [routerLink]="['/ordens', o.id]" class="font-semibold text-brand underline">#{{ o.id }}</a></td>
                  <td>{{ data.customerName(o.customerId) }}</td>
                  <td class="text-brand-muted">{{ data.vehicleLabel(o.vehicleId) }}</td>
                  <td><app-status [status]="o.status" /></td>
                  <td class="text-right font-semibold">{{ data.total(o) | mt }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="py-10 text-center text-brand-muted">Ainda não há ordens de serviço.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <div class="flex flex-col gap-6">
        <section class="card p-5">
          <h2 class="font-bold">Fluxo de trabalho</h2>
          <ul class="mt-4 flex flex-col gap-3">
            @for (p of pipeline(); track p.status) {
              <li>
                <div class="flex justify-between text-sm"><span>{{ p.status }}</span><span class="font-bold">{{ p.count }}</span></div>
                <div class="mt-1 h-2 rounded-full bg-slate-100"><div class="h-2 rounded-full bg-brand" [style.width.%]="p.pct"></div></div>
              </li>
            }
          </ul>
        </section>

        <section class="card p-5">
          <h2 class="flex items-center gap-2 font-bold"><app-icon name="alert" /> Atenção</h2>
          @if (overdue().length === 0 && low().length === 0) {
            <p class="mt-3 text-sm text-brand-muted">Sem atrasos nem peças em falta.</p>
          }
          @if (overdue().length) {
            <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">Entregas em atraso</p>
            <ul class="mt-2 flex flex-col gap-2 text-sm">
              @for (o of overdue(); track o.id) {
                <li class="flex justify-between gap-3">
                  <a [routerLink]="['/ordens', o.id]" class="font-semibold underline">#{{ o.id }} · {{ data.customerName(o.customerId) }}</a>
                  <span class="text-red-700">{{ o.dueDate | date: 'dd/MM' }}</span>
                </li>
              }
            </ul>
          }
          @if (low().length) {
            <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">Stock a repor</p>
            <ul class="mt-2 flex flex-col gap-2 text-sm">
              @for (p of low(); track p.id) {
                <li class="flex justify-between gap-3"><span>{{ p.name }}</span><span class="font-semibold text-red-700">{{ p.qty }} / {{ p.min }}</span></li>
              }
            </ul>
            <a routerLink="/stock" class="link-btn mt-3 inline-block">Abrir stock</a>
          }
        </section>
      </div>
    </div>
  `,
})
export class DashboardPage {
  auth = inject(AuthService);
  data = inject(DataService);
  private mt = new MtPipe();

  recent = computed(() => this.data.orders().slice(0, 6));
  overdue = computed(() =>
    this.data.orders().filter((o) => (o.status === 'Aguardando' || o.status === 'Em curso') && o.dueDate < today()),
  );
  low = computed(() => this.data.parts().filter((p) => p.qty <= p.min));

  pipeline = computed(() => {
    const s = this.data.stats().byStatus;
    const max = Math.max(1, ...STATUSES.map((x) => s[x]));
    return STATUSES.map((status) => ({ status, count: s[status], pct: (s[status] / max) * 100 }));
  });

  kpis = computed(() => {
    const s = this.data.stats();
    return [
      { label: 'Ordens abertas', value: String(s.open), link: '/ordens', dark: false, alert: false },
      { label: 'Prontas a entregar', value: String(s.ready), link: '/ordens', dark: false, alert: false },
      { label: 'Entregas em atraso', value: String(s.overdue), link: '/ordens', dark: false, alert: s.overdue > 0 },
      { label: 'Faturado no mês', value: this.mt.transform(s.billedMonth), link: '/faturacao', dark: true, alert: false },
      { label: 'Recebido', value: this.mt.transform(s.received), link: '/faturacao', dark: false, alert: false },
      { label: 'Por receber', value: this.mt.transform(s.receivable), link: '/faturacao', dark: false, alert: false },
      { label: 'Peças a repor', value: String(s.lowStock), link: '/stock', dark: false, alert: s.lowStock > 0 },
      { label: 'Clientes', value: String(this.data.customers().length), link: '/clientes', dark: false, alert: false },
    ];
  });
}
