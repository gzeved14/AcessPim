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
	// Evento disparado quando o usuario clica em logout.
	@Output() logout = new EventEmitter<void>();

	onLogoutClick(): void {
		// Propaga a acao para o componente pai executar o logout real.
		this.logout.emit();
	}
}
