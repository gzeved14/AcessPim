import { CommonModule, Location } from '@angular/common';
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
  private readonly location = inject(Location);

  // Estado de tela para historico e mensagens ao usuario.
  loading = signal(true);
  errorMessage = signal('');
  records = signal<RegistroAcesso[]>([]);

  // Filtros de periodo usados na busca do historico.
  dataInicio = '';
  dataFim = '';
  nomeArea = '';
  nomeColaborador = '';

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
    this.nomeArea = '';
    this.nomeColaborador = '';
    this.loadHistory();
  }

  // Abre a tela de formulario para registrar entrada/saida.
  goToRegistrar(): void {
    this.router.navigate(['/acessos/registrar']);
  }

  goBack(): void {
    // Mantém experiência consistente de retorno entre os módulos.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  private loadHistory(): void {
    // Ativa loading e remove erro anterior antes da chamada.
    this.loading.set(true);
    this.errorMessage.set('');

    const filtros = {
      dataInicio: this.dataInicio || undefined,
      dataFim: this.dataFim || undefined,
      nome_area: this.nomeArea || undefined,
      nome_colaborador: this.nomeColaborador || undefined,
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
