import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { PasswordFieldComponent } from '../shared/password-field.component';

const passwordsMatch: ValidatorFn = (group) =>
  group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, PasswordFieldComponent],
  template: `
    <app-auth-layout>
      @if (valid() === null) {
        <p class="text-sm text-brand-muted">A verificar a ligação…</p>
      } @else if (valid() === false) {
        <h1 class="h1">Ligação inválida ou expirada</h1>
        <p class="mt-3 text-sm text-brand-muted">Peça uma nova ligação para redefinir a palavra-passe.</p>
        <a routerLink="/recuperar-palavra-passe" class="btn-dark mt-6">Pedir nova ligação</a>
      } @else {
        <h1 class="h1">Nova palavra-passe</h1>
        <p class="mt-1 text-sm text-brand-muted">Escolha a nova palavra-passe da sua conta.</p>
        <form class="mt-8 flex flex-col gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <app-password-field label="Nova palavra-passe" [control]="form.controls.password" autocomplete="new-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) { <p class="err-d">Use pelo menos 6 caracteres.</p> }
          </div>
          <div>
            <app-password-field label="Confirmar palavra-passe" [control]="form.controls.confirm" autocomplete="new-password" />
            @if (form.controls.confirm.touched && form.hasError('mismatch')) { <p class="err-d">As palavras-passe não coincidem.</p> }
          </div>
          @if (error()) { <p class="err-d" role="alert">{{ error() }}</p> }
          <button type="submit" class="btn-dark" [disabled]="busy()">{{ busy() ? 'A guardar…' : 'Guardar palavra-passe' }}</button>
        </form>
      }
    </app-auth-layout>
  `,
})
export class ResetPasswordPage {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  valid = signal<boolean | null>(null);
  error = signal('');
  busy = signal(false);

  form = this.fb.group(
    { password: ['', [Validators.required, Validators.minLength(6)]], confirm: ['', Validators.required] },
    { validators: [passwordsMatch] },
  );

  constructor() {
    this.auth.hasSession().then((ok) => this.valid.set(ok));
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const r = await this.auth.updatePassword(this.form.controls.password.value);
    this.busy.set(false);
    if (r.ok) this.router.navigateByUrl('/painel');
    else this.error.set(r.error);
  }
}
