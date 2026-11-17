import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/** Campo só de números, com limite de dígitos (por omissão 9, como os telemóveis de Moçambique). */
@Directive({
  selector: 'input[appDigitsOnly]',
  standalone: true,
  host: { inputmode: 'numeric', '[attr.maxlength]': 'maxDigits()' },
})
export class DigitsOnlyDirective {
  maxDigits = input(9);
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private control = inject(NgControl, { self: true, optional: true });

  @HostListener('input')
  clean(): void {
    const raw = this.el.nativeElement.value;
    const clean = raw.replace(/\D/g, '').slice(0, this.maxDigits());
    if (clean === raw) return;
    this.el.nativeElement.value = clean;
    this.control?.control?.setValue(clean);
  }
}
