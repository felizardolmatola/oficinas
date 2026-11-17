import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'mt', standalone: true })
export class MtPipe implements PipeTransform {
  transform(value: number): string {
    return `${value.toLocaleString('pt-PT')} MT`;
  }
}
