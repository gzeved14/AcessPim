import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'app-navbar',
	standalone: true,
	templateUrl: './navbar.component.html',
	styleUrl: './navbar.component.css',
})
export class NavbarComponent {
	// Nome do usuario exibido no canto superior.
	@Input() userName = '';
	// Evento para abrir/fechar a barra lateral.
	@Output() toggleSidebar = new EventEmitter<void>();
	// Evento disparado quando o usuario clica em logout.
	@Output() logout = new EventEmitter<void>();

	onToggleSidebar(): void {
		this.toggleSidebar.emit();
	}

	onLogoutClick(): void {
		// Propaga a acao para o componente pai executar o logout real.
		this.logout.emit();
	}
}
