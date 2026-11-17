import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data.service';
import { MtPipe } from '../shared/mt.pipe';

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [RouterLink, DatePipe, MtPipe],
  template: `
    <header>
      <h1 class="h1">Faturação</h1>
      <p class="text-sm text-brand-muted">As faturas são emitidas quando uma ordem é marcada como Entregue.</p>
    </header>

    <section class="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Resumo">
      <div class="card bg-brand p-5 text-white"><p class="text-[13px] text-brand-soft">Faturado no mês</p><p class="mt-2 text-2xl font-bold">{{ data.stats().billedMonth | mt }}</p></div>
      <div class="card p-5"><p class="text-[13px] text-brand-muted">Recebido</p><p class="mt-2 text-2xl font-bold">{{ data.stats().received | mt }}</p></div>
      <div class="card p-5"><p class="text-[13px] text-brand-muted">Por receber</p><p class="mt-2 text-2xl font-bold">{{ data.stats().receivable | mt }}</p></div>
    </section>

    <div class="mt-5 flex gap-2">
      @for (f of filters; track f.key) {
        <button
          type="button"
          class="min-h-9 rounded-full border px-4 text-[13px]"
          [class.border-ink]="filter() === f.key"
          [class.bg-ink]="filter() === f.key"
          [class.text-white]="filter() === f.key"
          [class.border-[#C5CCD8]]="filter() !== f.key"
          [class.bg-white]="filter() !== f.key"
          (click)="filter.set(f.key)"
        >{{ f.label }}</button>
      }
    </div>

    <div class="table-wrap mt-4">
      <table class="tbl">
        <thead><tr><th>Fatura</th><th>Ordem</th><th>Cliente</th><th>Emitida</th><th class="text-right">Total</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          @for (i of rows(); track i.id) {
            <tr>
              <td><a [routerLink]="['/faturacao', i.id]" class="font-semibold text-brand underline">{{ i.id }}</a></td>
              <td><a [routerLink]="['/ordens', i.orderId]" class="underline">#{{ i.orderId }}</a></td>
              <td>{{ customer(i.orderId) }}</td>
              <td>{{ i.issuedAt | date: 'dd/MM/yyyy' }}</td>
              <td class="text-right font-semibold">{{ i.total | mt }}</td>
              <td>
                <span class="rounded-full border px-2.5 py-0.5 text-xs font-semibold" [class]="i.paid ? 'border-brand bg-brand text-white' : 'border-ink bg-white'">{{ i.paid ? 'Paga' : 'Por pagar' }}</span>
              </td>
              <td class="text-right">
                <button type="button" class="link-btn" (click)="data.setPaid(i.id, !i.paid)">{{ i.paid ? 'Marcar por pagar' : 'Marcar como paga' }}</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="py-10 text-center text-brand-muted">Sem faturas neste filtro.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class InvoicesPage {
  data = inject(DataService);
  filters = [
    { key: 'all', label: 'Todas' },
    { key: 'open', label: 'Por pagar' },
    { key: 'paid', label: 'Pagas' },
  ];
  filter = signal('all');

  rows = computed(() => this.data.invoices().filter((i) => this.filter() === 'all' || (this.filter() === 'paid') === i.paid));

  customer(orderId: string): string {
    const o = this.data.order(orderId);
    return o ? this.data.customerName(o.customerId) : '—';
  }
}
