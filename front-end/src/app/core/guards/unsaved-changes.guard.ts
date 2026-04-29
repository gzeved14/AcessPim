import { CanDeactivateFn } from '@angular/router';
import { ColaboradorForm } from '../../colaborador-form';

export const unsavedChangesGuard: CanDeactivateFn<ColaboradorForm> = (component: ColaboradorForm) => {
  if (component.colaboradorForm && component.colaboradorForm.dirty && !component.colaboradorForm.submitted) {
    return confirm('Você tem alterações não salvas. Deseja realmente sair?');
  }
  return true;
};
