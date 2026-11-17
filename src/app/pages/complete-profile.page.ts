import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { DigitsOnlyDirective } from '../shared/digits-only.directive';

/** Passo seguinte à criação de conta com Google: faltam o nome da oficina e o telemóvel. */
@Component({
  selector: 'app-complete-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, AuthLayoutComponent, DigitsOnlyDirective],
  template: `
    <app-auth-layout>
      <h1 class="h1">Complete o seu perfil</h1>
      <p class="mt-1 text-sm text-brand-muted">Conta Google: <strong class="text-ink">{{ auth.user()?.email }}</strong>. Faltam alguns dados da oficina.</p>
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
          <label class="lbl">Número de telemóvel<input class="inp" type="tel" appDigitsOnly formControlName="phone" autocomplete="tel" /></label>
          @if (form.controls.phone.touched && form.controls.phone.invalid) { <p class="err-d">O telemóvel deve ter 9 dígitos.</p> }
        </div>
        @if (error()) { <p class="err-d" role="alert">{{ error() }}</p> }
        <button type="submit" class="btn-dark" [disabled]="busy()">{{ busy() ? 'A guardar…' : 'Continuar' }}</button>
        <button type="button" class="link-btn self-center" (click)="logout()">Usar outra conta</button>
      </form>
    </app-auth-layout>
  `,
})
export class CompleteProfilePage {
  auth = inject(AuthService);
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  error = signal('');
  busy = signal(false);

  form = this.fb.group({
    name: [this.auth.user()?.name ?? '', Validators.required],
    workshop: [this.auth.user()?.workshop ?? '', Validators.required],
    phone: [this.auth.user()?.phone ?? '', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const r = await this.auth.saveProfile(this.form.getRawValue());
    this.busy.set(false);
    if (r.ok) this.router.navigateByUrl('/painel');
    else this.error.set(r.error);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigateByUrl('/entrar');
  }
}
