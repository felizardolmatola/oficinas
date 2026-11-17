import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data.service';
import { STATUSES, Status } from '../core/models';
import { IconComponent } from '../shared/icon.component';
import { MtPipe } from '../shared/mt.pipe';
import { StatusBadgeComponent } from '../shared/status-badge.component';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, MtPipe, StatusBadgeComponent, IconComponent],
  template: `
    <a routerLink="/ordens" class="inline-flex items-center gap-1 text-sm font-semibold text-brand-muted hover:text-brand"><app-icon name="back" /> Ordens</a>

    @if (order(); as o) {
      <header class="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h1 class="h1">Ordem #{{ o.id }}</h1>
          <app-status [status]="o.status" />
        </div>
        <label class="flex items-center gap-2 text-[13px] font-semibold">
          Estado
          <select class="inp !mt-0 w-44" [value]="o.status" (change)="changeStatus(o.id, $event)">
            @for (s of statuses; track s) { <option [value]="s" [selected]="s === o.status">{{ s }}</option> }
          </select>
        </label>
      </header>
      @if (message()) { <p class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ message() }}</p> }

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <section class="card p-5 text-sm lg:col-span-1">
          <h2 class="font-bold">Detalhes</h2>
          <dl class="mt-3 space-y-3">
            <div><dt class="text-brand-muted">Cliente</dt><dd class="font-semibold">{{ data.customerName(o.customerId) }}</dd></div>
            <div><dt class="text-brand-muted">Veículo</dt><dd class="font-semibold">{{ data.vehicleLabel(o.vehicleId) }}</dd></div>
            <div><dt class="text-brand-muted">Mecânico</dt><dd class="font-semibold">{{ data.staffName(o.mechanicId) }}</dd></div>
            <div><dt class="text-brand-muted">Aberta em</dt><dd class="font-semibold">{{ o.createdAt | date: 'dd/MM/yyyy' }}</dd></div>
            <div><dt class="text-brand-muted">Entrega prevista</dt><dd class="font-semibold">{{ o.dueDate | date: 'dd/MM/yyyy' }}</dd></div>
            <div><dt class="text-brand-muted">Serviço pedido</dt><dd>{{ o.description }}</dd></div>
          </dl>
          @if (invoice(); as inv) {
            <a [routerLink]="['/faturacao', inv.id]" class="btn-outline btn-sm mt-5">Ver fatura {{ inv.id }}</a>
          }
        </section>

        <section class="card lg:col-span-2">
          <div class="px-5 py-4"><h2 class="font-bold">Serviços e peças</h2></div>
          <div class="overflow-x-auto">
            <table class="tbl">
              <thead><tr><th>Descrição</th><th>Tipo</th><th class="text-right">Qtd.</th><th class="text-right">Preço</th><th class="text-right">Subtotal</th><th></th></tr></thead>
              <tbody>
                @for (it of o.items; track $index) {
                  <tr>
                    <td>{{ it.description }}</td>
                    <td class="text-brand-muted">{{ it.kind === 'peca' ? 'Peça' : 'Serviço' }}</td>
                    <td class="text-right">{{ it.qty }}</td>
                    <td class="text-right">{{ it.unitPrice | mt }}</td>
                    <td class="text-right font-semibold">{{ it.qty * it.unitPrice | mt }}</td>
                    <td class="text-right">
                      @if (o.status !== 'Entregue') {
                        <button type="button" class="link-btn" (click)="data.removeItem(o.id, $index)">Remover</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="py-8 text-center text-brand-muted">Ainda sem itens. Adicione mão de obra e peças abaixo.</td></tr>
                }
              </tbody>
              <tfoot>
                <tr><td colspan="4" class="px-4 py-3 text-right font-bold">Total</td><td class="px-4 py-3 text-right text-base font-bold">{{ data.total(o) | mt }}</td><td></td></tr>
              </tfoot>
            </table>
          </div>

          @if (o.status !== 'Entregue') {
            <form class="grid gap-3 border-t border-brand-line p-5 sm:grid-cols-6" [formGroup]="form" (ngSubmit)="addItem(o.id)" novalidate>
              <label class="lbl sm:col-span-2">
                Tipo
                <select class="inp" formControlName="kind" (change)="onKind()">
                  <option value="servico">Serviço / mão de obra</option>
                  <option value="peca">Peça do stock</option>
                </select>
              </label>
              @if (form.controls.kind.value === 'peca') {
                <label class="lbl sm:col-span-4">
                  Peça
                  <select class="inp" formControlName="partId" (change)="onPart()">
                    <option value="">Selecionar…</option>
                    @for (p of data.parts(); track p.id) { <option [value]="p.id" [disabled]="p.qty === 0">{{ p.name }} ({{ p.qty }} em stock)</option> }
                  </select>
                </label>
              } @else {
                <label class="lbl sm:col-span-4">Descrição<input class="inp" type="text" formControlName="description" /></label>
              }
              <label class="lbl sm:col-span-2">Quantidade<input class="inp" type="number" min="1" formControlName="qty" /></label>
              <label class="lbl sm:col-span-2">Preço unitário (MT)<input class="inp" type="number" min="0" formControlName="unitPrice" /></label>
              <div class="flex items-end sm:col-span-2"><button type="submit" class="btn-dark w-full">Adicionar</button></div>
            </form>
          }
        </section>
      </div>
    } @else {
      <p class="card mt-6 p-6 text-sm">Ordem não encontrada.</p>
    }
  `,
})
export class OrderDetailPage {
  id = input.required<string>();
  data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  statuses = STATUSES;
  message = signal('');

  order = computed(() => this.data.order(this.id()));
  invoice = computed(() => this.data.invoiceOf(this.id()));

  form = this.fb.group({
    kind: ['servico' as 'servico' | 'peca'],
    description: [''],
    partId: [''],
    qty: [1, [Validators.required, Validators.min(1)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]],
  });

  onKind(): void {
    this.form.patchValue({ description: '', partId: '', unitPrice: 0, qty: 1 });
  }

  onPart(): void {
    const part = this.data.parts().find((p) => p.id === this.form.controls.partId.value);
    if (part) this.form.patchValue({ unitPrice: part.price });
  }

  changeStatus(id: string, e: Event): void {
    const select = e.target as HTMLSelectElement;
    const ok = this.data.setStatus(id, select.value as Status);
    this.message.set(ok ? '' : 'Esta ordem já tem a fatura paga e não pode voltar atrás. Marque a fatura como por pagar primeiro.');
    if (!ok) select.value = this.order()?.status ?? select.value;
  }

  addItem(orderId: string): void {
    const v = this.form.getRawValue();
    if (this.form.invalid) return;
    if (v.kind === 'peca') {
      const part = this.data.parts().find((p) => p.id === v.partId);
      if (!part) return this.message.set('Escolha a peça a utilizar.');
      if (!this.data.addItem(orderId, { kind: 'peca', description: part.name, qty: v.qty, unitPrice: v.unitPrice, partId: part.id })) {
        return this.message.set(`Stock insuficiente de "${part.name}" (disponível: ${part.qty}).`);
      }
    } else {
      if (!v.description.trim()) return this.message.set('Indique a descrição do serviço.');
      this.data.addItem(orderId, { kind: 'servico', description: v.description.trim(), qty: v.qty, unitPrice: v.unitPrice });
    }
    this.message.set('');
    this.form.reset({ kind: v.kind, description: '', partId: '', qty: 1, unitPrice: 0 });
  }
}
