import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';
import { IconComponent } from './icon.component';
import { LogoComponent } from './logo.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  template: `
    <!-- barra superior (ecrãs pequenos) -->
    <header class="sticky top-0 z-30 flex items-center justify-between bg-brand px-4 py-3 lg:hidden print:hidden">
      <app-logo [onDark]="true" [size]="30" />
      <button type="button" class="grid h-10 w-10 place-items-center rounded-md text-white hover:bg-white/10" aria-label="Abrir menu" (click)="open.set(true)">
        <app-icon name="menu" [size]="22" />
      </button>
    </header>

    @if (open()) {
      <div class="fixed inset-0 z-40 bg-black/50 lg:hidden print:hidden" (click)="open.set(false)"></div>
    }

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand text-white transition-transform lg:translate-x-0 print:hidden"
      [class.-translate-x-full]="!open()"
      aria-label="Navegação principal"
    >
      <div class="flex h-16 items-center justify-between px-5">
        <app-logo [onDark]="true" [size]="34" />
        <button type="button" class="grid h-9 w-9 place-items-center rounded-md hover:bg-white/10 lg:hidden" aria-label="Fechar menu" (click)="open.set(false)">
          <app-icon name="x" />
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-2">
        <ul class="flex flex-col gap-0.5">
          @for (item of items(); track item.path) {
            <li>
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-white/15 text-white"
                class="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold text-brand-soft hover:bg-white/10 hover:text-white"
                (click)="open.set(false)"
              >
                <app-icon [name]="item.icon" />
                <span class="flex-1">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-brand">{{ item.badge }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      <div class="border-t border-white/15 p-4">
        <p class="truncate text-sm font-semibold">{{ auth.user()?.name }}</p>
        <p class="truncate text-xs text-brand-soft">{{ auth.user()?.workshop }}</p>
        <button type="button" class="mt-3 flex min-h-9 items-center gap-2 text-[13px] font-semibold text-brand-soft hover:text-white" (click)="logout()">
          <app-icon name="logout" /> Sair
        </button>
      </div>
    </aside>

    <main class="lg:pl-64 print:pl-0">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0"><router-outlet /></div>
    </main>
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  private data = inject(DataService);
  private router = inject(Router);
  open = signal(false);

  items = computed(() => {
    const s = this.data.stats();
    const unpaid = this.data.invoices().filter((i) => !i.paid).length;
    return [
      { path: '/painel', label: 'Painel', icon: 'dashboard', badge: 0 },
      { path: '/ordens', label: 'Ordens de serviço', icon: 'orders', badge: s.open },
      { path: '/clientes', label: 'Clientes', icon: 'customers', badge: 0 },
      { path: '/veiculos', label: 'Veículos', icon: 'vehicles', badge: 0 },
      { path: '/stock', label: 'Stock', icon: 'stock', badge: s.lowStock },
      { path: '/faturacao', label: 'Faturação', icon: 'invoices', badge: unpaid },
      { path: '/relatorios', label: 'Relatórios', icon: 'reports', badge: 0 },
      { path: '/equipa', label: 'Equipa', icon: 'team', badge: 0 },
      { path: '/definicoes', label: 'Definições', icon: 'settings', badge: 0 },
    ];
  });

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigateByUrl('/entrar');
  }
}
