import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardCards, DashboardData } from '../../core/models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly dashboardService = inject(DashboardService);

  // Estado de tela para cards e lista de ultimos acessos.
  userName = computed(() => this.authService.currentUser()?.nome || 'Usuário');
  loading = signal(true);
  errorMessage = signal('');
  cards = signal<DashboardCards>({
    totalAccessesToday: 0,
    deniedToday: 0,
    collaboratorsNow: 0,
    mostActiveArea: 'Nenhuma área',
  });
  latestAccesses = signal<DashboardData['latestAccesses']>([]);

  ngOnInit(): void {
    // Carrega os indicadores assim que a tela abre.
    this.loadDashboard();
  }

  private loadDashboard(): void {
    // Reinicia estados antes de uma nova tentativa de busca.
    this.loading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getDashboard().subscribe({
      next: (res) => {
        // Atualiza os dados exibidos no dashboard.
        this.cards.set(res.cards);
        this.latestAccesses.set(res.latestAccesses ?? []);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        // Mostra erro amigavel vindo do interceptor ou fallback local.
        this.errorMessage.set(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar o dashboard no momento.',
        );
        this.loading.set(false);
      },
    });
  }

  goTo(path: string): void {
    // Atalho para navegar pelos modulos principais.
    this.router.navigate([path]);
  }

  goBack(): void {
    // Volta para a rota anterior; em fallback mantém usuário no dashboard.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}
