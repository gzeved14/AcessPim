import { CanDeactivateFn } from '@angular/router';
import { NgForm } from '@angular/forms';

export interface HasUnsavedChanges {
  form: NgForm;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (component.form && component.form.dirty && !component.form.submitted) {
    return confirm('Você tem alterações não salvas. Deseja sair mesmo assim?');
  }
  return true;
};