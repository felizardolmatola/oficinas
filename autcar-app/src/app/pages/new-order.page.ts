import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../core/data.service';
import { today } from '../core/seed';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-new-order-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <a routerLink="/ordens" class="inline-flex items-center gap-1 text-sm font-semibold text-brand-muted hover:text-brand"><app-icon name="back" /> Ordens</a>
    <h1 class="h1 mt-2">Nova ordem de serviço</h1>
    <p class="text-sm text-brand-muted">Depois de criar a ordem, adicione a mão de obra e as peças na página da ordem.</p>

    <form class="card mt-6 grid max-w-3xl gap-5 p-6 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div>
        <label class="lbl">
          Cliente
          <select class="inp" formControlName="customerId" (change)="form.controls.vehicleId.reset('')">
            <option value="">Selecionar…</option>
            @for (c of data.customers(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
          </select>
        </label>
        @if (form.controls.customerId.touched && form.controls.customerId.invalid) { <p class="err-d">Escolha o cliente.</p> }
        @if (data.customers().length === 0) { <p class="mt-1 text-xs text-brand-muted">Ainda não há clientes. <a routerLink="/clientes" class="underline">Registar cliente</a></p> }
      </div>
      <div>
        <label class="lbl">
          Veículo
          <select class="inp" formControlName="vehicleId">
            <option value="">{{ customerId() ? 'Selecionar…' : 'Escolha primeiro o cliente' }}</option>
            @for (v of vehicles(); track v.id) { <option [value]="v.id">{{ v.model }} · {{ v.plate }}</option> }
          </select>
        </label>
        @if (form.controls.vehicleId.touched && form.controls.vehicleId.invalid) { <p class="err-d">Escolha o veículo.</p> }
        @if (customerId() && vehicles().length === 0) { <p class="mt-1 text-xs text-brand-muted">Este cliente não tem veículos. <a routerLink="/veiculos" class="underline">Registar veículo</a></p> }
      </div>
      <div>
        <label class="lbl">
          Mecânico responsável
          <select class="inp" formControlName="mechanicId">
            <option value="">Selecionar…</option>
            @for (s of activeStaff(); track s.id) { <option [value]="s.id">{{ s.name }} — {{ s.role }}</option> }
          </select>
        </label>
        @if (form.controls.mechanicId.touched && form.controls.mechanicId.invalid) { <p class="err-d">Escolha o responsável.</p> }
      </div>
      <label class="lbl">Entrega prevista<input class="inp" type="date" formControlName="dueDate" /></label>
      <div class="sm:col-span-2">
        <label class="lbl">Serviço pedido<textarea class="inp h-28 resize-none py-2.5" formControlName="description"></textarea></label>
        @if (form.controls.description.touched && form.controls.description.invalid) { <p class="err-d">Descreva o serviço pedido.</p> }
      </div>
      <div class="flex justify-end gap-3 sm:col-span-2">
        <a routerLink="/ordens" class="btn-outline">Cancelar</a>
        <button type="submit" class="btn-dark">Criar ordem</button>
      </div>
    </form>
  `,
})
export class NewOrderPage {
  data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);

  form = this.fb.group({
    customerId: ['', Validators.required],
    vehicleId: ['', Validators.required],
    mechanicId: ['', Validators.required],
    dueDate: [today(2), Validators.required],
    description: ['', Validators.required],
  });

  customerId = toSignal(this.form.controls.customerId.valueChanges, { initialValue: '' });
  vehicles = computed(() => this.data.vehicles().filter((v) => v.customerId === this.customerId()));
  activeStaff = computed(() => this.data.staff().filter((s) => s.active));

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const order = this.data.createOrder({ ...this.form.getRawValue(), description: this.form.controls.description.value.trim() });
    this.router.navigate(['/ordens', order.id]);
  }
}
