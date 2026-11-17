import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { GoogleButtonComponent } from '../shared/google-button.component';
import { PasswordFieldComponent } from '../shared/password-field.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, PasswordFieldComponent, GoogleButtonComponent],
  template: `
    <app-auth-layout>
      <h1 class="h1">Entrar</h1>
      <p class="mt-1 text-sm text-brand-muted">Aceda à gestão da sua oficina.</p>

      <form class="mt-8 flex flex-col gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div>
          <label class="lbl">
            Email
            <input class="inp" type="email" formControlName="email" autocomplete="username" />
          </label>
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="err-d">Indique um email válido.</p>
          }
        </div>
        <div>
          <app-password-field label="Palavra-passe" [control]="form.controls.password" autocomplete="current-password" />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="err-d">Indique a palavra-passe.</p>
          }
        </div>
        <div class="flex items-center justify-between text-[13px]">
          <label class="flex min-h-11 items-center gap-2">
            <input type="checkbox" class="h-[18px] w-[18px] accent-[#0B1F3A]" formControlName="remember" />
            Lembrar palavra-passe
          </label>
          <a routerLink="/recuperar-palavra-passe" class="font-semibold text-brand underline">Esqueceu a palavra-passe?</a>
        </div>
        @if (error()) {
          <p class="err-d" role="alert">{{ error() }}</p>
        }
        <button type="submit" class="btn-dark w-full" [disabled]="busy()">{{ busy() ? 'A entrar…' : 'Entrar' }}</button>
      </form>

      <div class="my-6 flex items-center gap-3 text-xs text-brand-muted" aria-hidden="true">
        <span class="h-px flex-1 bg-brand-line"></span>ou<span class="h-px flex-1 bg-brand-line"></span>
      </div>
      <app-google-button [busy]="googleBusy()" (pressed)="google()" />

      <p class="mt-6 text-center text-sm text-brand-muted">
        Ainda não tem conta? <a routerLink="/criar-conta" class="font-semibold text-brand underline">Criar conta</a>
      </p>
    </app-auth-layout>
  `,
})
export class LoginPage {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  error = signal('');
  busy = signal(false);
  googleBusy = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [true],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password, remember } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    const r = await this.auth.login(email, password, remember);
    this.busy.set(false);
    if (r.ok) this.router.navigateByUrl('/painel');
    else this.error.set(r.error);
  }

  async google(): Promise<void> {
    this.error.set('');
    this.googleBusy.set(true);
    const r = await this.auth.loginWithGoogle();
    if (!r.ok) {
      this.googleBusy.set(false);
      this.error.set(r.error);
    }
  }
}
