import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Customer } from '../core/models';
import { IconComponent } from '../shared/icon.component';
import { ModalComponent } from '../shared/modal.component';
import { MtPipe } from '../shared/mt.pipe';
import { DigitsOnlyDirective } from '../shared/digits-only.directive';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, IconComponent, MtPipe, DigitsOnlyDirective],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="h1">Clientes</h1>
        <p class="text-sm text-brand-muted">{{ data.customers().length }} clientes registados</p>
      </div>
      <button type="button" class="btn-dark" (click)="open()"><app-icon name="plus" /> Novo cliente</button>
    </header>

    <label class="lbl mt-5 block w-full sm:w-72">
      <span class="sr-only">Pesquisar</span>
      <input class="inp !mt-0" type="search" placeholder="Pesquisar cliente…" [value]="query()" (input)="query.set(val($event))" />
    </label>
    @if (message()) { <p class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ message() }}</p> }

    <div class="table-wrap mt-4">
      <table class="tbl">
        <thead><tr><th>Nome</th><th>Telemóvel</th><th>Email</th><th>Morada</th><th class="text-right">Veículos</th><th class="text-right">Ordens</th><th class="text-right">Faturado</th><th></th></tr></thead>
        <tbody>
          @for (r of rows(); track r.c.id) {
            <tr>
              <td class="font-semibold">{{ r.c.name }}</td>
              <td>{{ r.c.phone }}</td>
              <td class="text-brand-muted">{{ r.c.email || '—' }}</td>
              <td class="text-brand-muted">{{ r.c.address || '—' }}</td>
              <td class="text-right">{{ r.vehicles }}</td>
              <td class="text-right">{{ r.orders }}</td>
              <td class="text-right">{{ r.billed | mt }}</td>
              <td class="whitespace-nowrap text-right">
                <button type="button" class="link-btn" (click)="open(r.c)">Editar</button>
                <button type="button" class="link-btn ml-3" (click)="remove(r.c)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="8" class="py-10 text-center text-brand-muted">Nenhum cliente encontrado.</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (dialog()) {
      <app-modal [title]="editing() ? 'Editar cliente' : 'Novo cliente'" (closed)="dialog.set(false)">
        <form class="grid gap-4" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div>
            <label class="lbl">Nome<input class="inp" type="text" formControlName="name" /></label>
            @if (form.controls.name.touched && form.controls.name.invalid) { <p class="err-d">Indique o nome.</p> }
          </div>
          <div>
            <label class="lbl">Telemóvel<input class="inp" type="tel" appDigitsOnly formControlName="phone" /></label>
            @if (form.controls.phone.touched && form.controls.phone.invalid) { <p class="err-d">Indique o telemóvel.</p> }
          </div>
          <div>
            <label class="lbl">Email<input class="inp" type="email" formControlName="email" /></label>
            @if (form.controls.email.touched && form.controls.email.invalid) { <p class="err-d">Email inválido.</p> }
          </div>
          <label class="lbl">Morada<input class="inp" type="text" formControlName="address" /></label>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="btn-outline" (click)="dialog.set(false)">Cancelar</button>
            <button type="submit" class="btn-dark">Guardar</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class CustomersPage {
  data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  query = signal('');
  dialog = signal(false);
  editing = signal<Customer | null>(null);
  message = signal('');

  form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', Validators.email],
    address: [''],
  });

  rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const orders = this.data.orders();
    const invoices = this.data.invoices();
    return this.data
      .customers()
      .filter((c) => !q || `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q))
      .map((c) => {
        const mine = orders.filter((o) => o.customerId === c.id);
        return {
          c,
          vehicles: this.data.vehicles().filter((v) => v.customerId === c.id).length,
          orders: mine.length,
          billed: invoices.filter((i) => mine.some((o) => o.id === i.orderId)).reduce((s, i) => s + i.total, 0),
        };
      });
  });

  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  open(c?: Customer): void {
    this.editing.set(c ?? null);
    this.form.reset({ name: c?.name ?? '', phone: c?.phone ?? '', email: c?.email ?? '', address: c?.address ?? '' });
    this.dialog.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.data.saveCustomer(this.form.getRawValue(), this.editing()?.id);
    this.dialog.set(false);
  }

  remove(c: Customer): void {
    if (!confirm(`Eliminar o cliente "${c.name}"?`)) return;
    this.message.set(this.data.removeCustomer(c.id) ? '' : `Não é possível eliminar "${c.name}": tem veículos ou ordens associados.`);
  }
}
