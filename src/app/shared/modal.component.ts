import { Component, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" (click)="closed.emit()">
      <div
        class="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        (click)="$event.stopPropagation()"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <h2 class="text-lg font-bold">{{ title() }}</h2>
          <button type="button" class="grid h-8 w-8 place-items-center rounded-md text-brand-muted hover:bg-slate-100" aria-label="Fechar" (click)="closed.emit()">
            <app-icon name="x" />
          </button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  title = input.required<string>();
  closed = output<void>();
}
