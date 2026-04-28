import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  @Input() collapsed = false;
  @Output() navigate = new EventEmitter<void>();

  protected readonly userName = computed(() => this.authService.currentUser()?.nome || 'Usuário');
  protected readonly userCargo = computed(() => this.authService.currentUser()?.cargo || 'Operação');
  protected readonly userPic = computed(() => (this.authService.currentUser() as any)?.foto || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y');

  protected readonly menuItems = [
    { label: 'Dashboard', link: '/dashboard', hint: 'Visão geral do sistema', icon: 'fa fa-tachometer-alt' },
    { label: 'Colaboradores', link: '/colaboradores', hint: 'Cadastro e status', icon: 'fa fa-users' },
    { label: 'Áreas', link: '/areas', hint: 'Riscos e capacidade', icon: 'fa fa-map-marker-alt' },
    { label: 'Acessos', link: '/acessos', hint: 'Histórico e filtros', icon: 'fa fa-history' },
    { label: 'Registrar acesso', link: '/acessos/registrar', hint: 'Nova entrada ou saída', icon: 'fa fa-sign-in-alt' },
  ];

  protected readonly adminMenuItems = [
    { label: 'Novo Usuário', link: '/usuarios/novo', hint: 'Apenas Administrador', icon: 'fa fa-user-shield' }
  ];

  protected onNavigate(): void {
    this.navigate.emit();
  }
}