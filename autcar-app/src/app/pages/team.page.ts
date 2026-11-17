import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../core/data.service';
import { Staff } from '../core/models';
import { IconComponent } from '../shared/icon.component';
import { ModalComponent } from '../shared/modal.component';
import { DigitsOnlyDirective } from '../shared/digits-only.directive';

@Component({
  selector: 'app-team-page',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, IconComponent, DigitsOnlyDirective],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="h1">Equipa</h1>
        <p class="text-sm text-brand-muted">{{ data.staff().length }} colaboradores</p>
      </div>
      <button type="button" class="btn-dark" (click)="open()"><app-icon name="plus" /> Novo colaborador</button>
    </header>

    <div class="table-wrap mt-5">
      <table class="tbl">
        <thead><tr><th>Nome</th><th>Função</th><th>Telemóvel</th><th class="text-right">Ordens abertas</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          @for (r of rows(); track r.s.id) {
            <tr>
              <td class="font-semibold">{{ r.s.name }}</td>
              <td>{{ r.s.role }}</td>
              <td>{{ r.s.phone || '—' }}</td>
              <td class="text-right">{{ r.open }}</td>
              <td>
                <span class="rounded-full border px-2.5 py-0.5 text-xs font-semibold" [class]="r.s.active ? 'border-brand bg-brand text-white' : 'border-[#C5CCD8] text-brand-muted'">
                  {{ r.s.active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="whitespace-nowrap text-right">
                <button type="button" class="link-btn" (click)="open(r.s)">Editar</button>
                <button type="button" class="link-btn ml-3" (click)="toggle(r.s)">{{ r.s.active ? 'Desativar' : 'Ativar' }}</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (dialog()) {
      <app-modal [title]="editing() ? 'Editar colaborador' : 'Novo colaborador'" (closed)="dialog.set(false)">
        <form class="grid gap-4" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div>
            <label class="lbl">Nome<input class="inp" type="text" formControlName="name" /></label>
            @if (form.controls.name.touched && form.controls.name.invalid) { <p class="err-d">Indique o nome.</p> }
          </div>
          <div>
            <label class="lbl">Função<input class="inp" type="text" formControlName="role" placeholder="Ex.: Mecânico" /></label>
            @if (form.controls.role.touched && form.controls.role.invalid) { <p class="err-d">Indique a função.</p> }
          </div>
          <label class="lbl">Telemóvel<input class="inp" type="tel" appDigitsOnly formControlName="phone" /></label>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="btn-outline" (click)="dialog.set(false)">Cancelar</button>
            <button type="submit" class="btn-dark">Guardar</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class TeamPage {
  data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  dialog = signal(false);
  editing = signal<Staff | null>(null);

  form = this.fb.group({ name: ['', Validators.required], role: ['', Validators.required], phone: [''] });

  rows = computed(() => {
    const orders = this.data.orders();
    return this.data.staff().map((s) => ({
      s,
      open: orders.filter((o) => o.mechanicId === s.id && (o.status === 'Aguardando' || o.status === 'Em curso')).length,
    }));
  });

  open(s?: Staff): void {
    this.editing.set(s ?? null);
    this.form.reset({ name: s?.name ?? '', role: s?.role ?? '', phone: s?.phone ?? '' });
    this.dialog.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const prev = this.editing();
    this.data.saveStaff({ ...this.form.getRawValue(), active: prev?.active ?? true }, prev?.id);
    this.dialog.set(false);
  }

  toggle(s: Staff): void {
    this.data.saveStaff({ name: s.name, role: s.role, phone: s.phone, active: !s.active }, s.id);
  }
}
