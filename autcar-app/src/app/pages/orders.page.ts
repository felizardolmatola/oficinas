import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data.service';
import { STATUSES, Status } from '../core/models';
import { today } from '../core/seed';
import { IconComponent } from '../shared/icon.component';
import { MtPipe } from '../shared/mt.pipe';
import { StatusBadgeComponent } from '../shared/status-badge.component';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [RouterLink, DatePipe, MtPipe, StatusBadgeComponent, IconComponent],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="h1">Ordens de serviço</h1>
        <p class="text-sm text-brand-muted">{{ data.orders().length }} ordens no total</p>
      </div>
      <a routerLink="/ordens/nova" class="btn-dark"><app-icon name="plus" /> Nova ordem</a>
    </header>

    <div class="mt-5 flex flex-wrap items-center gap-3">
      <label class="block w-full sm:w-72">
        <span class="sr-only">Pesquisar</span>
        <input class="inp !mt-0" type="search" placeholder="Pesquisar nº, cliente, matrícula…" [value]="query()" (input)="query.set(val($event))" />
      </label>
      <label class="block">
        <span class="sr-only">Mecânico</span>
        <select class="inp !mt-0 w-52" [value]="mechanic()" (change)="mechanic.set(val($event))">
          <option value="">Todos os mecânicos</option>
          @for (s of data.staff(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
        </select>
      </label>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      @for (f of filters; track f) {
        <button type="button" class="chip" [class.chip-on]="filter() === f" (click)="filter.set(f)">
          {{ f }} <span class="text-xs opacity-70">{{ count(f) }}</span>
        </button>
      }
    </div>

    <div class="table-wrap mt-4">
      <table class="tbl">
        <thead>
          <tr><th>Nº</th><th>Cliente</th><th>Veículo</th><th>Serviço</th><th>Mecânico</th><th>Entrega</th><th>Estado</th><th class="text-right">Total</th></tr>
        </thead>
        <tbody>
          @for (o of visible(); track o.id) {
            <tr>
              <td><a [routerLink]="['/ordens', o.id]" class="font-semibold text-brand underline">#{{ o.id }}</a></td>
              <td class="font-semibold">{{ data.customerName(o.customerId) }}</td>
              <td class="text-brand-muted">{{ data.vehicleLabel(o.vehicleId) }}</td>
              <td>{{ o.description }}</td>
              <td>{{ data.staffName(o.mechanicId) }}</td>
              <td [class.text-red-700]="late(o)" [class.font-semibold]="late(o)">{{ o.dueDate | date: 'dd/MM/yyyy' }}</td>
              <td><app-status [status]="o.status" /></td>
              <td class="text-right font-semibold">{{ data.total(o) | mt }}</td>
            </tr>
          } @empty {
            <tr><td colspan="8" class="py-10 text-center text-brand-muted">Nenhuma ordem encontrada. Ajuste a pesquisa ou os filtros.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class OrdersPage {
  data = inject(DataService);
  filters: ('Todas' | Status)[] = ['Todas', ...STATUSES];
  filter = signal<'Todas' | Status>('Todas');
  query = signal('');
  mechanic = signal('');

  private matches = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.data
      .orders()
      .filter((o) => !this.mechanic() || o.mechanicId === this.mechanic())
      .filter(
        (o) =>
          !q ||
          `${o.id} ${this.data.customerName(o.customerId)} ${this.data.vehicleLabel(o.vehicleId)} ${o.description}`.toLowerCase().includes(q),
      );
  });

  visible = computed(() => this.matches().filter((o) => this.filter() === 'Todas' || o.status === this.filter()));

  count(f: 'Todas' | Status): number {
    return this.matches().filter((o) => f === 'Todas' || o.status === f).length;
  }

  late(o: { status: Status; dueDate: string }): boolean {
    return (o.status === 'Aguardando' || o.status === 'Em curso') && o.dueDate < today();
  }

  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}
