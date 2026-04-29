import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Colaborador } from '../../core/models/colaborador.model';
import { ColaboradorService } from '../../core/services/colaborador.service';

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './colaboradores.html',
  styleUrl: './colaboradores.css',
})
export class Colaboradores implements OnInit {
  private readonly colaboradorService = inject(ColaboradorService);

  formatarCargo(cargo: string): string {
  const labels: Record<string, string> = {
    ADMIN:            'Administrador',
    GESTOR_DE_AREA:   'Gestor de Área',
    OP_DE_SEGURANCA:  'Operador de Segurança',
  };
  return labels[cargo] ?? cargo;
}

  // Estados da listagem para loading, erro e conteudo.
  loading = signal(true);
  errorMessage = signal('');
  createErrorMessage = signal('');
  createLoading = signal(false);
  showCreateForm = signal(false);
  colaboradores = signal<Colaborador[]>([]);

  novoColaborador = {
    nome: '',
    matricula: '',
    cargo: '',
    setor: '',
  };

  ngOnInit(): void {
    // Dispara a busca inicial ao abrir a pagina.
    this.loadColaboradores();
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
  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.createErrorMessage.set('');
  }

  closeCreateForm(): void {
    this.showCreateForm.set(false);
    this.createErrorMessage.set('');
    this.novoColaborador = { nome: '', matricula: '', cargo: '', setor: '' };
  }

  submitNovoColaborador(): void {
    this.createLoading.set(true);
    this.createErrorMessage.set('');

    this.colaboradorService
      .create({ ...this.novoColaborador, ativo: true })
      .subscribe({
        next: () => {
          this.closeCreateForm();
          this.loadColaboradores();
          this.createLoading.set(false);
        },
        error: (err: unknown) => {
          this.createErrorMessage.set(
            err instanceof Error
              ? err.message
              : 'Nao foi possivel cadastrar o colaborador no momento.',
          );
          this.createLoading.set(false);
        },
      });
  }

  desativarColaborador(id: string): void {
    if (confirm('Tem certeza que deseja desativar este colaborador?')) {
      this.colaboradorService.softDelete(id).subscribe({
        next: () => {
          this.loadColaboradores(); // Recarrega a lista após a desativação
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            err instanceof Error
              ? err.message
              : 'Não foi possível desativar o colaborador.',
          );
        },
      });
    }
  }
}