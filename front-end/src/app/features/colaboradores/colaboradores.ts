import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Colaborador } from '../../core/models/colaborador.model';
import { ColaboradorService } from '../../core/services/colaborador.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './colaboradores.html',
  styleUrl: './colaboradores.css',
})
export class Colaboradores implements OnInit {
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  public readonly authService = inject(AuthService);

  // Estados da listagem para loading, erro e conteudo.
  loading = signal(true);
  errorMessage = signal('');
  colaboradores = signal<Colaborador[]>([]);

  ngOnInit(): void {
    // Dispara a busca inicial ao abrir a pagina.
    this.loadColaboradores();
  }

  // Getter para facilitar a validação de permissão no HTML
  get isAdmin(): boolean {
    return this.authService.currentUser()?.cargo === 'Administrador';
  }

  loadColaboradores(): void {
    // Prepara a tela para uma nova consulta.
    this.loading.set(true);
    this.errorMessage.set('');

    this.colaboradorService.getColaboradores().subscribe({
      next: (colaboradores) => {
        // Atualiza tabela com resultado da API.
        this.colaboradores.set(colaboradores);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        // Exibe mensagem tratada quando a consulta falha.
        this.errorMessage.set(
          err instanceof Error
            ? err.message
            : 'Nao foi possivel carregar os colaboradores no momento.',
        );
        this.loading.set(false);
      },
    });
  }

  goToCreate(): void {
    // Navega para a tela de criação de um novo colaborador
    this.router.navigate(['/colaboradores/novo']);
  }

  goToEdit(id: string): void {
    // Navega para a tela de edição passando o ID do colaborador
    this.router.navigate(['/colaboradores/editar', id]);
  }

  deleteColaborador(id: string): void {
    if (confirm('Tem certeza que deseja desativar este colaborador?')) {
      this.loading.set(true);
      this.errorMessage.set('');

      // Usa o método 'update' do service para inativar o colaborador (soft delete)
      this.colaboradorService.update(id, { ativo: false }).subscribe({
        next: () => {
          this.loadColaboradores(); // Recarrega a lista para refletir o novo status
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            err instanceof Error ? err.message : 'Erro ao tentar desativar o colaborador.'
          );
          this.loading.set(false);
        },
      });
    }
  }

  reactivateColaborador(id: string): void {
    if (confirm('Tem certeza que deseja reativar este colaborador?')) {
      this.loading.set(true);
      this.errorMessage.set('');

      // Envia o status oposto (ativo: true) para restaurar
      this.colaboradorService.update(id, { ativo: true }).subscribe({
        next: () => {
          this.loadColaboradores();
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            err instanceof Error ? err.message : 'Erro ao tentar reativar o colaborador.'
          );
          this.loading.set(false);
        },
      });
    }
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
