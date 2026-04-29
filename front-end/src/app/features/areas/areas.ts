import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AreaService } from '../../core/services/area.service';
import { Area } from '../../core/models/area.model';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './areas.html',
  styleUrl: './areas.css',
})
export class Areas implements OnInit {
  private readonly areaService = inject(AreaService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  public readonly authService = inject(AuthService);

  // Estados da tela de listagem.
  loading = signal(true);
  errorMessage = signal('');
  areas = signal<Area[]>([]);

  ngOnInit(): void {
    // Carrega areas assim que o componente for iniciado.
    this.loadAreas();
  }

  // Getter para facilitar a validação de permissão no HTML
  get isAdmin(): boolean {
    return this.authService.currentUser()?.cargo === 'ADMIN';
  }

  loadAreas(): void {
    // Limpa estado de erro e ativa feedback visual de carregamento.
    this.loading.set(true);
    this.errorMessage.set('');

    this.areaService.getAreas().subscribe({
      next: (areas) => {
        // Log temporário para debug: inspecionar retorno das áreas
        console.log('Áreas recebidas:', areas);
        // Salva os dados para renderizacao na tabela.
        this.areas.set(areas);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        // Mostra mensagem amigavel no lugar de erro tecnico.
        this.errorMessage.set(
          err instanceof Error
            ? err.message
            : 'Nao foi possivel carregar as areas no momento.',
        );
        this.loading.set(false);
      },
    });
  }

  goToCreate(): void {
    // Rota para o futuro formulário de criação
    this.router.navigate(['/areas/nova']);
  }

  goToEdit(id: string): void {
    // Rota para o futuro formulário de edição
    this.router.navigate(['/areas/editar', id]);
  }

  deleteArea(id: string): void {
    if (confirm('Tem certeza que deseja inativar esta área? O histórico de acessos será mantido.')) {
      this.loading.set(true);
      this.errorMessage.set('');
      this.areaService.delete(id).subscribe({
        next: () => {
          // Recarrega a lista para remover a área inativada da tela
          this.loadAreas();
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            err instanceof Error ? err.message : 'Erro ao tentar inativar a área.'
          );
          this.loading.set(false);
        }
      });
    }
  }

  reactivateArea(id: string): void {
    if (confirm('Tem certeza que deseja reativar esta área?')) {
      this.loading.set(true);
      this.errorMessage.set('');
      
      this.areaService.update(id, { ativa: true }).subscribe({
        next: () => {
          this.loadAreas();
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            err instanceof Error ? err.message : 'Erro ao tentar reativar a área.'
          );
          this.loading.set(false);
        }
      });
    }
  }

  onTestClick(): void {
    alert('Botão de teste clicado!');
  }

  goBack(): void {
    // Mantém experiência consistente de retorno entre os módulos.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}
