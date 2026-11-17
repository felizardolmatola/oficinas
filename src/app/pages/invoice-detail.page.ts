import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { IconComponent } from '../shared/icon.component';
import { LogoComponent } from '../shared/logo.component';
import { MtPipe } from '../shared/mt.pipe';

@Component({
  selector: 'app-invoice-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe, MtPipe, IconComponent, LogoComponent],
  template: `
    <div class="flex items-center justify-between print:hidden">
      <a routerLink="/faturacao" class="inline-flex items-center gap-1 text-sm font-semibold text-brand-muted hover:text-brand"><app-icon name="back" /> Faturação</a>
      @if (inv()) { <button type="button" class="btn-dark btn-sm" (click)="print()"><app-icon name="print" /> Imprimir</button> }
    </div>

    @if (inv(); as i) {
      @if (order(); as o) {
        <article class="card mx-auto mt-4 max-w-3xl p-8 print:border-0 print:p-0">
          <header class="flex items-start justify-between gap-4">
            <div>
              <app-logo [size]="36" />
              <p class="mt-3 text-sm font-semibold">{{ auth.user()?.workshop }}</p>
              <p class="text-sm text-brand-muted">{{ auth.user()?.phone }} · {{ auth.user()?.email }}</p>
            </div>
            <div class="text-right">
              <h1 class="text-2xl font-bold">Fatura {{ i.id }}</h1>
              <p class="text-sm text-brand-muted">Emitida em {{ i.issuedAt | date: 'dd/MM/yyyy' }}</p>
              <p class="mt-1 text-sm font-semibold">{{ i.paid ? 'PAGA' : 'POR PAGAR' }}</p>
            </div>
          </header>

          <section class="mt-8 grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <p class="text-brand-muted">Cliente</p>
              <p class="font-semibold">{{ data.customerName(o.customerId) }}</p>
              <p>{{ data.customer(o.customerId)?.phone }}</p>
            </div>
            <div>
              <p class="text-brand-muted">Veículo</p>
              <p class="font-semibold">{{ data.vehicleLabel(o.vehicleId) }}</p>
              <p>Ordem #{{ o.id }} · {{ o.description }}</p>
            </div>
          </section>

          <table class="tbl mt-8 !min-w-0">
            <thead><tr><th>Descrição</th><th class="text-right">Qtd.</th><th class="text-right">Preço</th><th class="text-right">Subtotal</th></tr></thead>
            <tbody>
              @for (it of o.items; track $index) {
                <tr><td>{{ it.description }}</td><td class="text-right">{{ it.qty }}</td><td class="text-right">{{ it.unitPrice | mt }}</td><td class="text-right">{{ it.qty * it.unitPrice | mt }}</td></tr>
              }
            </tbody>
            <tfoot><tr><td colspan="3" class="px-4 py-3 text-right font-bold">Total</td><td class="px-4 py-3 text-right text-lg font-bold">{{ i.total | mt }}</td></tr></tfoot>
          </table>
        </article>
      }
    } @else {
      <p class="card mt-4 p-6 text-sm">Fatura não encontrada.</p>
    }
  `,
})
export class InvoiceDetailPage {
  id = input.required<string>();
  data = inject(DataService);
  auth = inject(AuthService);

  inv = computed(() => this.data.invoices().find((i) => i.id === this.id()));
  order = computed(() => {
    const i = this.inv();
    return i ? this.data.order(i.orderId) : undefined;
  });

  print(): void {
    window.print();
  }
}
