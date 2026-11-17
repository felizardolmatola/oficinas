import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Part } from '../core/models';
import { IconComponent } from '../shared/icon.component';
import { ModalComponent } from '../shared/modal.component';
import { MtPipe } from '../shared/mt.pipe';

@Component({
  selector: 'app-stock-page',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, IconComponent, MtPipe],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="h1">Stock de peças</h1>
        <p class="text-sm text-brand-muted">Valor em stock (custo): <strong class="text-ink">{{ stockValue() | mt }}</strong> · {{ data.stats().lowStock }} a repor</p>
      </div>
      <button type="button" class="btn-dark" (click)="open()"><app-icon name="plus" /> Nova peça</button>
    </header>

    <div class="mt-5 flex flex-wrap items-center gap-4">
      <label class="lbl w-full sm:w-72">
        <span class="sr-only">Pesquisar</span>
        <input class="inp !mt-0" type="search" placeholder="Pesquisar peça ou código…" [value]="query()" (input)="query.set(val($event))" />
      </label>
      <label class="flex items-center gap-2 text-[13px]">
        <input type="checkbox" class="h-[18px] w-[18px] accent-[#0B1F3A]" [checked]="onlyLow()" (change)="onlyLow.set(!onlyLow())" />
        Só stock baixo
      </label>
    </div>
    @if (message()) { <p class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ message() }}</p> }

    <div class="table-wrap mt-4">
      <table class="tbl">
        <thead><tr><th>Código</th><th>Peça</th><th class="text-center">Quantidade</th><th class="text-right">Mínimo</th><th class="text-right">Custo</th><th class="text-right">Preço</th><th></th></tr></thead>
        <tbody>
          @for (p of rows(); track p.id) {
            <tr>
              <td class="text-brand-muted">{{ p.sku }}</td>
              <td class="font-semibold">{{ p.name }}</td>
              <td>
                <div class="flex items-center justify-center gap-2">
                  <button type="button" class="grid h-7 w-7 place-items-center rounded border border-[#AEB6C4]" [attr.aria-label]="'Retirar uma unidade de ' + p.name" (click)="data.adjustPart(p.id, -1)">−</button>
                  <span class="min-w-8 text-center font-bold" [class.text-red-700]="p.qty <= p.min">{{ p.qty }}</span>
                  <button type="button" class="grid h-7 w-7 place-items-center rounded border border-[#AEB6C4]" [attr.aria-label]="'Acrescentar uma unidade de ' + p.name" (click)="data.adjustPart(p.id, 1)">+</button>
                </div>
              </td>
              <td class="text-right">{{ p.min }}</td>
              <td class="text-right">{{ p.cost | mt }}</td>
              <td class="text-right">{{ p.price | mt }}</td>
              <td class="whitespace-nowrap text-right">
                @if (p.qty <= p.min) { <span class="mr-3 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">Repor</span> }
                <button type="button" class="link-btn" (click)="open(p)">Editar</button>
                <button type="button" class="link-btn ml-3" (click)="remove(p)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="py-10 text-center text-brand-muted">Nenhuma peça encontrada.</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (dialog()) {
      <app-modal [title]="editing() ? 'Editar peça' : 'Nova peça'" (closed)="dialog.set(false)">
        <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div>
            <label class="lbl">Código<input class="inp" type="text" formControlName="sku" /></label>
            @if (form.controls.sku.touched && form.controls.sku.invalid) { <p class="err-d">Indique o código.</p> }
          </div>
          <div>
            <label class="lbl">Nome<input class="inp" type="text" formControlName="name" /></label>
            @if (form.controls.name.touched && form.controls.name.invalid) { <p class="err-d">Indique o nome.</p> }
          </div>
          <label class="lbl">Quantidade em stock<input class="inp" type="number" min="0" formControlName="qty" /></label>
          <label class="lbl">Stock mínimo<input class="inp" type="number" min="0" formControlName="min" /></label>
          <label class="lbl">Custo (MT)<input class="inp" type="number" min="0" formControlName="cost" /></label>
          <label class="lbl">Preço de venda (MT)<input class="inp" type="number" min="0" formControlName="price" /></label>
          <div class="flex justify-end gap-3 pt-2 sm:col-span-2">
            <button type="button" class="btn-outline" (click)="dialog.set(false)">Cancelar</button>
            <button type="submit" class="btn-dark">Guardar</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class StockPage {
  data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  query = signal('');
  onlyLow = signal(false);
  dialog = signal(false);
  editing = signal<Part | null>(null);
  message = signal('');

  form = this.fb.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    qty: [0, [Validators.required, Validators.min(0)]],
    min: [0, [Validators.required, Validators.min(0)]],
    cost: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]],
  });

  rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.data
      .parts()
      .filter((p) => !q || `${p.sku} ${p.name}`.toLowerCase().includes(q))
      .filter((p) => !this.onlyLow() || p.qty <= p.min);
  });

  stockValue = computed(() => this.data.parts().reduce((s, p) => s + p.qty * p.cost, 0));

  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  open(p?: Part): void {
    this.editing.set(p ?? null);
    this.form.reset({ sku: p?.sku ?? '', name: p?.name ?? '', qty: p?.qty ?? 0, min: p?.min ?? 0, cost: p?.cost ?? 0, price: p?.price ?? 0 });
    this.dialog.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.data.savePart(this.form.getRawValue(), this.editing()?.id);
    this.dialog.set(false);
  }

  remove(p: Part): void {
    if (!confirm(`Eliminar a peça "${p.name}"?`)) return;
    this.message.set(this.data.removePart(p.id) ? '' : `Não é possível eliminar "${p.name}": já foi usada em ordens de serviço.`);
  }
}
