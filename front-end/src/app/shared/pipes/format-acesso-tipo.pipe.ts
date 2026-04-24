import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatAcessoTipo',
  standalone: true,
})
export class FormatAcessoTipoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value === 'ENTRADA' ? 'Entrada' : value === 'SAIDA' ? 'Saida' : value;
  }
}
