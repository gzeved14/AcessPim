import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  // Estado global de autenticacao e navegacao do layout principal.
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly routerSubscription: Subscription;
  private readonly resizeHandler = () => this.syncViewportState();

  // Guarda a URL atual para decidir quando renderizar navbar.
  private readonly currentUrl = signal(this.router.url);

  protected readonly title = signal('front-end');

  protected readonly userName = computed(() => this.authService.currentUser()?.nome || 'Usuário');
  protected readonly sidebarCollapsed = signal(false);
  protected readonly sidebarMobileOpen = signal(false);
  protected readonly isMobileViewport = signal(false);

  // Navbar aparece apenas para usuario autenticado em rotas privadas.
  protected readonly showNavbar = computed(() => {
    const url = this.currentUrl();
    const isPublicRoute = url.startsWith('/login') || url.startsWith('/forbidden');
    return this.authService.isAuthenticated() && !isPublicRoute;
  });

  constructor() {
    // Sincroniza o layout inicial de acordo com o viewport atual.
    this.syncViewportState();

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.resizeHandler, { passive: true });
    }

    // Atualiza a URL observada a cada navegacao finalizada.
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        // Fecha o drawer lateral automaticamente após navegar no mobile.
        if (this.isMobileViewport()) {
          this.sidebarMobileOpen.set(false);
        }
      });
  }

  protected onToggleSidebar(): void {
    if (this.isMobileViewport()) {
      this.sidebarMobileOpen.update((value) => !value);
      return;
    }

    this.sidebarCollapsed.update((value) => !value);
  }

  protected onCloseSidebar(): void {
    this.sidebarMobileOpen.set(false);
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

    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  private syncViewportState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isMobile = window.innerWidth <= 1024;
    this.isMobileViewport.set(isMobile);

    // Ao sair do mobile, o drawer é fechado para manter consistência visual.
    if (!isMobile) {
      this.sidebarMobileOpen.set(false);
    }
  }
}
