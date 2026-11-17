import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Vehicle } from '../core/models';
import { IconComponent } from '../shared/icon.component';
import { ModalComponent } from '../shared/modal.component';

@Component({
  selector: 'app-vehicles-page',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, IconComponent],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="h1">Veículos</h1>
        <p class="text-sm text-brand-muted">{{ data.vehicles().length }} veículos registados</p>
      </div>
      <button type="button" class="btn-dark" [disabled]="data.customers().length === 0" (click)="open()"><app-icon name="plus" /> Novo veículo</button>
    </header>

    <label class="lbl mt-5 block w-full sm:w-72">
      <span class="sr-only">Pesquisar</span>
      <input class="inp !mt-0" type="search" placeholder="Pesquisar matrícula, modelo, cliente…" [value]="query()" (input)="query.set(val($event))" />
    </label>
    @if (message()) { <p class="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ message() }}</p> }

    <div class="table-wrap mt-4">
      <table class="tbl">
        <thead><tr><th>Matrícula</th><th>Modelo</th><th>Ano</th><th class="text-right">Km</th><th>Proprietário</th><th class="text-right">Ordens</th><th></th></tr></thead>
        <tbody>
          @for (r of rows(); track r.v.id) {
            <tr>
              <td class="font-semibold">{{ r.v.plate }}</td>
              <td>{{ r.v.model }}</td>
              <td>{{ r.v.year ?? '—' }}</td>
              <td class="text-right">{{ r.v.km.toLocaleString('pt-PT') }}</td>
              <td>{{ data.customerName(r.v.customerId) }}</td>
              <td class="text-right">{{ r.orders }}</td>
              <td class="whitespace-nowrap text-right">
                <button type="button" class="link-btn" (click)="open(r.v)">Editar</button>
                <button type="button" class="link-btn ml-3" (click)="remove(r.v)">Eliminar</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="py-10 text-center text-brand-muted">Nenhum veículo encontrado.</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (dialog()) {
      <app-modal [title]="editing() ? 'Editar veículo' : 'Novo veículo'" (closed)="dialog.set(false)">
        <form class="grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="sm:col-span-2">
            <label class="lbl">
              Proprietário
              <select class="inp" formControlName="customerId">
                <option value="">Selecionar…</option>
                @for (c of data.customers(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select>
            </label>
            @if (form.controls.customerId.touched && form.controls.customerId.invalid) { <p class="err-d">Escolha o proprietário.</p> }
          </div>
          <div>
            <label class="lbl">Matrícula<input class="inp" type="text" formControlName="plate" /></label>
            @if (form.controls.plate.touched && form.controls.plate.invalid) { <p class="err-d">Indique a matrícula.</p> }
          </div>
          <div>
            <label class="lbl">Marca e modelo<input class="inp" type="text" formControlName="model" /></label>
            @if (form.controls.model.touched && form.controls.model.invalid) { <p class="err-d">Indique o modelo.</p> }
          </div>
          <label class="lbl">Ano<input class="inp" type="number" formControlName="year" /></label>
          <label class="lbl">Quilometragem<input class="inp" type="number" min="0" formControlName="km" /></label>
          <div class="flex justify-end gap-3 pt-2 sm:col-span-2">
            <button type="button" class="btn-outline" (click)="dialog.set(false)">Cancelar</button>
            <button type="submit" class="btn-dark">Guardar</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class VehiclesPage {
  data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  query = signal('');
  dialog = signal(false);
  editing = signal<Vehicle | null>(null);
  message = signal('');

  form = this.fb.group({
    customerId: ['', Validators.required],
    plate: ['', Validators.required],
    model: ['', Validators.required],
    year: [null as number | null],
    km: [0, Validators.min(0)],
  });

  rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const orders = this.data.orders();
    return this.data
      .vehicles()
      .filter((v) => !q || `${v.plate} ${v.model} ${this.data.customerName(v.customerId)}`.toLowerCase().includes(q))
      .map((v) => ({ v, orders: orders.filter((o) => o.vehicleId === v.id).length }));
  });

  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  open(v?: Vehicle): void {
    this.editing.set(v ?? null);
    this.form.reset({ customerId: v?.customerId ?? '', plate: v?.plate ?? '', model: v?.model ?? '', year: v?.year ?? null, km: v?.km ?? 0 });
    this.dialog.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.data.saveVehicle(this.form.getRawValue(), this.editing()?.id);
    this.dialog.set(false);
  }

  remove(v: Vehicle): void {
    if (!confirm(`Eliminar o veículo ${v.plate}?`)) return;
    this.message.set(this.data.removeVehicle(v.id) ? '' : `Não é possível eliminar ${v.plate}: tem ordens de serviço associadas.`);
  }
}
