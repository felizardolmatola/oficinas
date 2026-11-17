import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { DataService } from '../core/data.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  template: `
    <h1 class="h1">Definições</h1>

    <section class="card mt-6 max-w-2xl p-6">
      <h2 class="font-bold">Conta e oficina</h2>
      <dl class="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt class="text-brand-muted">Responsável</dt><dd class="font-semibold">{{ auth.user()?.name }}</dd></div>
        <div><dt class="text-brand-muted">Oficina</dt><dd class="font-semibold">{{ auth.user()?.workshop }}</dd></div>
        <div><dt class="text-brand-muted">Email</dt><dd class="font-semibold">{{ auth.user()?.email }}</dd></div>
        <div><dt class="text-brand-muted">Telemóvel</dt><dd class="font-semibold">{{ auth.user()?.phone }}</dd></div>
        <div><dt class="text-brand-muted">Método de entrada</dt><dd class="font-semibold">{{ auth.user()?.provider === 'google' ? 'Google' : 'Email e palavra-passe' }}</dd></div>
      </dl>
    </section>

    <section class="card mt-6 max-w-2xl p-6">
      <h2 class="font-bold">Dados</h2>
      <p class="mt-1 text-sm text-brand-muted">Nesta versão os dados ficam guardados neste navegador. Exporte uma cópia antes de limpar o navegador.</p>
      <div class="mt-4 flex flex-wrap gap-3">
        <button type="button" class="btn-outline" (click)="export()">Exportar cópia (JSON)</button>
        <button type="button" class="btn-outline" (click)="reset()">Apagar todos os dados</button>
      </div>
    </section>
  `,
})
export class SettingsPage {
  auth = inject(AuthService);
  private data = inject(DataService);

  export(): void {
    const url = URL.createObjectURL(new Blob([this.data.exportJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `autcar-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  reset(): void {
    if (confirm('Apagar todos os clientes, veículos, ordens, stock e faturas? Esta ação não pode ser desfeita.')) this.data.reset();
  }
}
