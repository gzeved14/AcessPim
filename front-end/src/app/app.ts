import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  // Estado global de autenticacao e navegacao do layout principal.
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly routerSubscription: Subscription;

  // Guarda a URL atual para decidir quando renderizar navbar.
  private readonly currentUrl = signal(this.router.url);

  protected readonly title = signal('front-end');

  protected readonly userName = computed(() => this.authService.currentUser()?.nome || 'Usuario');

  // Navbar aparece apenas para usuario autenticado em rotas privadas.
  protected readonly showNavbar = computed(() => {
    const url = this.currentUrl();
    const isPublicRoute = url.startsWith('/login') || url.startsWith('/forbidden');
    return this.authService.isAuthenticated() && !isPublicRoute;
  });

  constructor() {
    // Atualiza a URL observada a cada navegacao finalizada.
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  protected onLogout(): void {
    // Se logout remoto falhar, limpa sessao local para evitar estado inconsistente.
    this.authService.logout().subscribe({
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/login']);
      },
    });
  }

  ngOnDestroy(): void {
    // Evita vazamento de memoria no subscribe de eventos do router.
    this.routerSubscription.unsubscribe();
  }
}
