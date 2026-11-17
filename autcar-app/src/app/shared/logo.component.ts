import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="flex items-center gap-3 font-extrabold tracking-tight" [class.text-white]="onDark()" [style.font-size.px]="size() * 0.65">
      <svg [attr.viewBox]="onDark() ? '10 10 76 76' : '0 0 96 96'" [attr.width]="iconSize()" [attr.height]="iconSize()" role="img" aria-label="Ícone de chave inglesa">
        @if (!onDark()) {
          <rect width="96" height="96" rx="22" fill="#0B1F3A" />
        }
        <g transform="translate(18 18) scale(1.25)">
          <g transform="rotate(45 24 24)" fill="none" [attr.stroke]="'#fff'" stroke-width="7" stroke-linecap="round">
            <path d="M29.14 8.87A8 8 0 1 1 18.86 8.87" />
            <path d="M24 23V42" />
          </g>
        </g>
      </svg>
      <span>Autcar</span>
    </div>
  `,
})
export class LogoComponent {
  onDark = input(false);
  size = input(40);
  /** O ícone é maior do que o texto para ganhar presença. */
  iconSize = computed(() => Math.round(this.size() * 1.35));
}
