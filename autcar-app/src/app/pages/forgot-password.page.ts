import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout>
      @if (sentTo()) {
        <h1 class="h1">Verifique o seu email</h1>
        <p class="mt-3 text-sm leading-relaxed text-brand-muted">
          Se existir uma conta com <strong class="text-ink">{{ sentTo() }}</strong>, enviámos uma ligação para definir uma nova palavra-passe. Pode demorar alguns minutos; veja também o lixo eletrónico.
        </p>
        <a routerLink="/entrar" class="btn-dark mt-6">Voltar a entrar</a>
      } @else {
        <h1 class="h1">Esqueci a palavra-passe</h1>
        <p class="mt-1 text-sm text-brand-muted">Indique o email da conta e enviamos uma ligação para a redefinir.</p>
        <form class="mt-8 flex flex-col gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label class="lbl">Email<input class="inp" type="email" formControlName="email" autocomplete="email" /></label>
            @if (form.controls.email.touched && form.controls.email.invalid) { <p class="err-d">Indique um email válido.</p> }
          </div>
          @if (error()) { <p class="err-d" role="alert">{{ error() }}</p> }
          <button type="submit" class="btn-dark" [disabled]="busy()">{{ busy() ? 'A enviar…' : 'Enviar ligação' }}</button>
        </form>
        <p class="mt-6 text-sm text-brand-muted"><a routerLink="/entrar" class="font-semibold text-brand underline">Voltar a entrar</a></p>
      }
    </app-auth-layout>
  `,
})
export class ForgotPasswordPage {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  error = signal('');
  busy = signal(false);
  sentTo = signal('');

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    const r = await this.auth.requestPasswordReset(email);
    this.busy.set(false);
    if (r.ok) this.sentTo.set(email.trim());
    else this.error.set(r.error);
  }
}
