import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="relative">
      <label class="lbl">
        {{ label() }}
        <input class="inp pr-12" [type]="visible() ? 'text' : 'password'" [formControl]="control()" [autocomplete]="autocomplete()" />
      </label>
      <button
        type="button"
        class="absolute bottom-px right-0.5 grid h-11 w-11 place-items-center text-brand-muted"
        [attr.aria-label]="visible() ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'"
        (click)="visible.set(!visible())"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          @if (!visible()) {
            <path d="M3 3l18 18" />
          }
        </svg>
      </button>
    </div>
  `,
})
export class PasswordFieldComponent {
  label = input.required<string>();
  control = input.required<FormControl<string>>();
  autocomplete = input('off');
  visible = signal(false);
}
