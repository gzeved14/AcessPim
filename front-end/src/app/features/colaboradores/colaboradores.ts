import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Colaborador } from '../../core/models/colaborador.model';
import { ColaboradorService } from '../../core/services/colaborador.service';

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './colaboradores.html',
  styleUrl: './colaboradores.css',
})
export class Colaboradores implements OnInit {
  private readonly colaboradorService = inject(ColaboradorService);

  // Estados da listagem para loading, erro e conteudo.
  loading = signal(true);
  errorMessage = signal('');
  colaboradores = signal<Colaborador[]>([]);

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
}
