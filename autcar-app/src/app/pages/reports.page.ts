import { Component, computed, inject } from '@angular/core';
import { DataService } from '../core/data.service';
import { today } from '../core/seed';
import { MtPipe } from '../shared/mt.pipe';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [MtPipe],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="h1">Relatórios</h1>
        <p class="text-sm text-brand-muted">Resumo financeiro e de desempenho da oficina.</p>
      </div>
      <button type="button" class="btn-outline" (click)="exportCsv()">Exportar faturas (CSV)</button>
    </header>

    <section class="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Resumo">
      <div class="card p-5"><p class="text-[13px] text-brand-muted">Faturado (total)</p><p class="mt-2 text-2xl font-bold">{{ totals().billed | mt }}</p></div>
      <div class="card p-5"><p class="text-[13px] text-brand-muted">Margem estimada em peças</p><p class="mt-2 text-2xl font-bold">{{ totals().partsMargin | mt }}</p></div>
      <div class="card p-5"><p class="text-[13px] text-brand-muted">Valor em stock (custo)</p><p class="mt-2 text-2xl font-bold">{{ totals().stockValue | mt }}</p></div>
    </section>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <section class="card p-5">
        <h2 class="font-bold">Faturação por mês</h2>
        <table class="mt-3 w-full text-sm">
          <thead class="sr-only"><tr><th>Mês</th><th>Barra</th><th>Valor</th></tr></thead>
          <tbody>
            @for (m of months(); track m.key) {
              <tr>
                <td class="whitespace-nowrap py-1.5 pr-3 text-brand-muted">{{ m.label }}</td>
                <td class="w-full py-1.5 pr-3"><div class="h-2.5 rounded-full bg-slate-100"><div class="h-2.5 rounded-full bg-brand" [style.width.%]="m.pct"></div></div></td>
                <td class="whitespace-nowrap py-1.5 text-right font-semibold">{{ m.billed | mt }}</td>
              </tr>
            }
          </tbody>
        </table>
        <p class="mt-3 text-xs text-brand-muted">Últimos 6 meses, por data de emissão da fatura.</p>
      </section>

      <section class="table-wrap">
        <div class="px-5 pb-1 pt-5"><h2 class="font-bold">Melhores clientes</h2></div>
        <table class="tbl !min-w-0">
          <thead><tr><th>Cliente</th><th class="text-right">Ordens</th><th class="text-right">Faturado</th></tr></thead>
          <tbody>
            @for (r of topCustomers(); track r.name) {
              <tr><td class="font-semibold">{{ r.name }}</td><td class="text-right">{{ r.orders }}</td><td class="text-right">{{ r.billed | mt }}</td></tr>
            } @empty {
              <tr><td colspan="3" class="py-8 text-center text-brand-muted">Sem faturação registada.</td></tr>
            }
          </tbody>
        </table>
      </section>

      <section class="table-wrap lg:col-span-2">
        <div class="px-5 pb-1 pt-5"><h2 class="font-bold">Desempenho da equipa</h2></div>
        <table class="tbl">
          <thead><tr><th>Colaborador</th><th>Função</th><th class="text-right">Ordens</th><th class="text-right">Abertas</th><th class="text-right">Entregues</th><th class="text-right">Faturado</th></tr></thead>
          <tbody>
            @for (r of team(); track r.name) {
              <tr><td class="font-semibold">{{ r.name }}</td><td>{{ r.role }}</td><td class="text-right">{{ r.orders }}</td><td class="text-right">{{ r.open }}</td><td class="text-right">{{ r.delivered }}</td><td class="text-right font-semibold">{{ r.billed | mt }}</td></tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
})
export class ReportsPage {
  private data = inject(DataService);

  totals = computed(() => {
    const parts = this.data.parts();
    const margin = this.data
      .orders()
      .flatMap((o) => o.items)
      .filter((i) => i.partId)
      .reduce((s, i) => s + i.qty * (i.unitPrice - (parts.find((p) => p.id === i.partId)?.cost ?? i.unitPrice)), 0);
    return {
      billed: this.data.invoices().reduce((s, i) => s + i.total, 0),
      partsMargin: margin,
      stockValue: parts.reduce((s, p) => s + p.qty * p.cost, 0),
    };
  });

  months = computed(() => {
    const now = new Date(today() + 'T00:00:00');
    const list = Array.from({ length: 6 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const billed = this.data.invoices().filter((i) => i.issuedAt.startsWith(key)).reduce((s, i) => s + i.total, 0);
      return { key, label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, billed, pct: 0 };
    });
    const max = Math.max(1, ...list.map((m) => m.billed));
    return list.map((m) => ({ ...m, pct: (m.billed / max) * 100 }));
  });

  private billedByOrder = computed(() => new Map(this.data.invoices().map((i) => [i.orderId, i.total])));

  topCustomers = computed(() => {
    const billed = this.billedByOrder();
    return this.data
      .customers()
      .map((c) => {
        const mine = this.data.orders().filter((o) => o.customerId === c.id);
        return { name: c.name, orders: mine.length, billed: mine.reduce((s, o) => s + (billed.get(o.id) ?? 0), 0) };
      })
      .filter((r) => r.billed > 0)
      .sort((a, b) => b.billed - a.billed)
      .slice(0, 5);
  });

  team = computed(() => {
    const billed = this.billedByOrder();
    return this.data.staff().map((s) => {
      const mine = this.data.orders().filter((o) => o.mechanicId === s.id);
      return {
        name: s.name,
        role: s.role,
        orders: mine.length,
        open: mine.filter((o) => o.status === 'Aguardando' || o.status === 'Em curso').length,
        delivered: mine.filter((o) => o.status === 'Entregue').length,
        billed: mine.reduce((t, o) => t + (billed.get(o.id) ?? 0), 0),
      };
    });
  });

  exportCsv(): void {
    const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [['Fatura', 'Ordem', 'Cliente', 'Emitida', 'Total (MT)', 'Estado', 'Paga em']];
    for (const i of this.data.invoices()) {
      const o = this.data.order(i.orderId);
      rows.push([i.id, i.orderId, o ? this.data.customerName(o.customerId) : '', i.issuedAt, String(i.total), i.paid ? 'Paga' : 'Por pagar', i.paidAt ?? '']);
    }
    const csv = '﻿' + rows.map((r) => r.map(q).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `faturas-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
