// src/app/shared/directives/if-role.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { UserStore } from '../../core/stores/user.store';

@Directive({
  selector: '[appIfRole]',
  standalone: true
})
export class IfRoleDirective {
  private userStore = inject(UserStore);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;
  private allowedRoles: string[] = [];

  // El Input ahora solo guarda los roles permitidos
  @Input() set appIfRole(allowedRoles: string | string[]) {
    this.allowedRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  }

  constructor() {
    // Usamos un 'effect' que se ejecuta automáticamente
    // cada vez que la señal 'currentUser' cambia.
    effect(() => {
      const user = this.userStore.currentUser(); // Obtenemos el usuario actual del store
      const userRole = user?.role;

      const shouldShow = userRole ? this.allowedRoles.includes(userRole) : false;

      if (shouldShow && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!shouldShow && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
