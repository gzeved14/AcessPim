import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistroAcesso } from '../../core/models/registro-acesso.model';
import { RegistroAcessoService } from '../../core/services/registro-acesso.service';

@Component({
  selector: 'app-acessos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acessos.html',
  styleUrl: './acessos.css',
})
export class Acessos implements OnInit {
  private readonly registroAcessoService = inject(RegistroAcessoService);
  private readonly router = inject(Router);

  // Estado de tela para historico e mensagens ao usuario.
  loading = signal(true);
  errorMessage = signal('');
  records = signal<RegistroAcesso[]>([]);

  // Filtros de periodo usados na busca do historico.
  dataInicio = '';
  dataFim = '';
  areaId = '';
  colaboradorId = '';

  ngOnInit(): void {
    // Carrega o historico inicial sem filtros.
    this.loadHistory();
  }

  onFilter(): void {
    // Reconsulta aplicando o periodo informado.
    this.loadHistory();
  }

  clearFilter(): void {
    // Limpa filtros e volta ao estado padrao da tela.
    this.dataInicio = '';
    this.dataFim = '';
    this.areaId = '';
    this.colaboradorId = '';
    this.loadHistory();
  }

  // Abre a tela de formulario para registrar entrada/saida.
  goToRegistrar(): void {
    this.router.navigate(['/acessos/registrar']);
  }

  private loadHistory(): void {
    // Ativa loading e remove erro anterior antes da chamada.
    this.loading.set(true);
    this.errorMessage.set('');

    const filtros = {
      dataInicio: this.dataInicio || undefined,
      dataFim: this.dataFim || undefined,
      area_id: this.areaId || undefined,
      colaborador_id: this.colaboradorId || undefined,
    };

    this.registroAcessoService.listarHistorico(filtros).subscribe({
        next: (records) => {
          // Atualiza a tabela com os registros retornados.
          this.records.set(records);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          // Exibe mensagem amigavel em falha de consulta.
          this.errorMessage.set(
            err instanceof Error
              ? err.message
              : 'Nao foi possivel consultar o historico agora.',
          );
          this.loading.set(false);
        },
      });
  }
}
