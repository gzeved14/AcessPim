
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DashboardCards, DashboardData, AreaOccupancyItem, HourlyAccess } from '../../core/models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {


  constructor() {
  // Sempre que o período mudar, recarrega o dashboard
    effect(() => {
      this.loadDashboard();
    });
  }

    displayedChartLabel = computed(() => {
      const labels = {
        today: 'Gráfico de acessos por hora (hoje)',
        week: 'Gráfico de acessos por (semana)',
        month: 'Gráfico de acessos por (mês)',
        year: 'Gráfico de acessos por (ano)',
      };
      return labels[this.currentAccessPeriod()];
    });
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly dashboardService = inject(DashboardService);

  // Estado de tela para cards e lista de ultimos acessos.
  userName = computed(() => this.authService.currentUser()?.nome || 'Usuário');
  areaOccupancy = signal<DashboardData['areaOccupancy']>([]);
  loading = signal(true); // Propriedade para indicar estado de carregamento
  accessesByHour = signal<HourlyAccess[]>([]);
  errorMessage = signal('');
  cards = signal<DashboardCards>({
    totalAccessesToday: 0,
    deniedToday: 0,
    totalAccessesThisWeek: 0,
    totalAccessesThisMonth: 0,
    totalAccessesThisYear: 0,
    collaboratorsNow: 0,
    mostActiveArea: 'Nenhuma área',
  });
  protected readonly isAdmin = computed(() => this.authService.currentUser()?.cargo === 'ADMIN');
  currentAccessPeriod = signal<'today' | 'week' | 'month' | 'year'>('today');
  latestAccesses = signal<DashboardData['latestAccesses']>([]);

  ngOnInit(): void {
    // Carrega os indicadores assim que a tela abre.
    console.log('Cargo do usuário logado:', this.authService.currentUser()?.cargo);
    console.log('isAdmin (computed):', this.isAdmin());
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);

    this.dashboardService.getDashboard(this.currentAccessPeriod()).subscribe({
      next: (res) => {
        // 1. Atualiza os cards (indicadores)
        this.cards.set(res.cards);
      
        // 2. Atualiza o gráfico de acessos
        this.accessesByHour.set(res.accessesByHour); 

        // 3. ATUALIZAÇÃO NECESSÁRIA: Ocupação das áreas (barras de progresso)
        this.areaOccupancy.set(res.areaOccupancy ?? []);

        // 4. ATUALIZAÇÃO NECESSÁRIA: Lista de histórico recente
        this.latestAccesses.set(res.latestAccesses ?? []);

        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Erro ao carregar dados do dashboard.');
        this.loading.set(false);
      }
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

  toggleAccessPeriod(): void {
    const current = this.currentAccessPeriod();
    switch (current) {
      case 'today':
        this.currentAccessPeriod.set('week');
        break;
      case 'week':
        this.currentAccessPeriod.set('month');
        break;
      case 'month':
        this.currentAccessPeriod.set('year');
        break;
      case 'year':
        this.currentAccessPeriod.set('today');
        break;
    }
  }

  displayedAccessCount = computed(() => {
    const cards = this.cards();
    switch (this.currentAccessPeriod()) {
      case 'today': return cards.totalAccessesToday;
      case 'week': return cards.totalAccessesThisWeek;
      case 'month': return cards.totalAccessesThisMonth;
      case 'year': return cards.totalAccessesThisYear;
    }
  });

  displayedAccessLabel = computed(() => {
    const labels = { today: 'Acessos hoje', week: 'Acessos semana', month: 'Acessos mês', year: 'Acessos ano' };
    return labels[this.currentAccessPeriod()];
  });
  // No dashboard.ts
  maxHourlyAccess = computed(() => {
    const counts = this.accessesByHour().map(h => h.total || 0);
    const max = Math.max(...counts, 0);
    return max <= 0 ? 1 : max; // Nunca deixa ser zero para não dividir por zero
  });

  getBarHeight(total: number): number {
    const max = Math.max(...this.accessesByHour().map(h => h.total), 1);
    if (total === 0) return 4; // Altura mínima para barras vazias
    return (total / max) * 100;
}

}
