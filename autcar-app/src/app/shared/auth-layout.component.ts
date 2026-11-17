import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { LogoComponent } from './logo.component';

/** Estrutura das páginas de entrada: painel de apresentação à esquerda, formulário à direita. */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [LogoComponent],
  template: `
    <div class="grid min-h-screen lg:grid-cols-2">
      <section class="hidden flex-col justify-between bg-brand p-12 text-white lg:flex">
        <app-logo [onDark]="true" [size]="46" />
        <div>
          <h2 class="max-w-md text-3xl font-extrabold leading-tight">A gestão completa da sua oficina, num só lugar.</h2>
          <ul class="mt-8 flex max-w-md flex-col gap-3 text-brand-soft">
            <li>Ordens de serviço do pedido à entrega</li>
            <li>Clientes, veículos e histórico de reparações</li>
            <li>Stock de peças com alertas de reposição</li>
            <li>Faturação, recebimentos e relatórios</li>
          </ul>
        </div>
        <p class="text-xs text-brand-soft">Autcar · Plataforma de gestão de oficinas</p>
      </section>
      <section class="flex items-center justify-center px-6 py-10">
        <div class="w-full max-w-sm">
          <div class="mb-8 flex justify-center lg:hidden"><app-logo [size]="40" /></div>
          @if (!auth.configured) {
            <p class="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900" role="status">
              O Supabase ainda não está configurado. Preencha <strong>src/environments/environment.ts</strong> (veja o README) para entrar e criar contas.
            </p>
          }
          <ng-content />
        </div>
      </section>
    </div>
  `,
})
export class AuthLayoutComponent {
  auth = inject(AuthService);
}
