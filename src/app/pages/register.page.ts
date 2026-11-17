import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { GoogleButtonComponent } from '../shared/google-button.component';
import { PasswordFieldComponent } from '../shared/password-field.component';
import { DigitsOnlyDirective } from '../shared/digits-only.directive';

const passwordsMatch: ValidatorFn = (group) =>
  group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, PasswordFieldComponent, GoogleButtonComponent, DigitsOnlyDirective],
  template: `
    <app-auth-layout>
      @if (sentTo()) {
        <h1 class="h1">Verifique o seu email</h1>
        <p class="mt-3 text-sm leading-relaxed text-brand-muted">
          Enviámos uma ligação de confirmação para <strong class="text-ink">{{ sentTo() }}</strong>. Abra-a para ativar a conta e depois entre na plataforma. Veja também o lixo eletrónico.
        </p>
        <a routerLink="/entrar" class="btn-dark mt-6 w-full">Ir para Entrar</a>
      } @else {
        <h1 class="h1">Criar conta</h1>
        <p class="mt-1 text-sm text-brand-muted">Registe a sua oficina em poucos minutos.</p>

        <form class="mt-8 flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <label class="lbl">Nome<input class="inp" type="text" formControlName="name" autocomplete="name" /></label>
            @if (form.controls.name.touched && form.controls.name.invalid) { <p class="err-d">Indique o seu nome.</p> }
          </div>
          <div>
            <label class="lbl">Nome da oficina<input class="inp" type="text" formControlName="workshop" autocomplete="organization" /></label>
            @if (form.controls.workshop.touched && form.controls.workshop.invalid) { <p class="err-d">Indique o nome da oficina.</p> }
          </div>
          <div>
            <label class="lbl">Email<input class="inp" type="email" formControlName="email" autocomplete="email" /></label>
            @if (form.controls.email.touched && form.controls.email.invalid) { <p class="err-d">Indique um email válido.</p> }
          </div>
          <div>
            <label class="lbl">Número de telemóvel<input class="inp" type="tel" appDigitsOnly formControlName="phone" autocomplete="tel" /></label>
            @if (form.controls.phone.touched && form.controls.phone.invalid) { <p class="err-d">O telemóvel deve ter 9 dígitos.</p> }
          </div>
          <div>
            <app-password-field label="Palavra-passe" [control]="form.controls.password" autocomplete="new-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) { <p class="err-d">Use pelo menos 6 caracteres.</p> }
          </div>
          <div>
            <app-password-field label="Confirmar palavra-passe" [control]="form.controls.confirm" autocomplete="new-password" />
            @if (form.controls.confirm.touched && form.hasError('mismatch')) { <p class="err-d">As palavras-passe não coincidem.</p> }
          </div>
          <label class="flex min-h-11 items-center gap-2 text-[13px]">
            <input type="checkbox" class="h-[18px] w-[18px] accent-[#0B1F3A]" formControlName="terms" />
            Li e aceito os Termos de Uso e a Política de Privacidade.
          </label>
          @if (form.controls.terms.touched && form.controls.terms.invalid) { <p class="err-d">Aceite os termos para continuar.</p> }
          @if (error()) { <p class="err-d" role="alert">{{ error() }}</p> }
          <button type="submit" class="btn-dark w-full" [disabled]="busy()">{{ busy() ? 'A criar conta…' : 'Criar conta' }}</button>
        </form>

        <div class="my-6 flex items-center gap-3 text-xs text-brand-muted" aria-hidden="true">
          <span class="h-px flex-1 bg-brand-line"></span>ou<span class="h-px flex-1 bg-brand-line"></span>
        </div>
        <app-google-button [busy]="googleBusy()" (pressed)="google()" />

        <p class="mt-6 text-center text-sm text-brand-muted">
          Já tem conta? <a routerLink="/entrar" class="font-semibold text-brand underline">Entrar</a>
        </p>
      }
    </app-auth-layout>
  `,
})
export class RegisterPage {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  error = signal('');
  busy = signal(false);
  googleBusy = signal(false);
  sentTo = signal('');

  form = this.fb.group(
    {
      name: ['', Validators.required],
      workshop: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    },
    { validators: [passwordsMatch] },
  );

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, workshop, email, phone, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    const r = await this.auth.register({ name, workshop, email, phone, password });
    this.busy.set(false);
    if (!r.ok) this.error.set(r.error);
    else if (r.needsConfirmation) this.sentTo.set(email.trim());
    else this.router.navigateByUrl('/painel');
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
