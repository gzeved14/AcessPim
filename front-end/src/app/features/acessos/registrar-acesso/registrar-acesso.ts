import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Area } from '../../../core/models/area.model';
import { Colaborador } from '../../../core/models/colaborador.model';
import { AreaService } from '../../../core/services/area.service';
import { ColaboradorService } from '../../../core/services/colaborador.service';
import { RegistroAcessoService } from '../../../core/services/registro-acesso.service';

@Component({
  selector: 'app-registrar-acesso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-acesso.html',
  styleUrl: './registrar-acesso.css',
})
export class RegistrarAcesso implements OnInit {
  private readonly areaService = inject(AreaService);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly registroAcessoService = inject(RegistroAcessoService);
  private readonly router = inject(Router);

  // Estados de carregamento e feedback da tela.
  loadingOptions = signal(true);
  submitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Opcoes dos selects para o formulario.
  colaboradores = signal<Colaborador[]>([]);
  areas = signal<Area[]>([]);

  // Campos do formulario de registro.
  colaboradorId = '';
  areaId = '';
  tipo: 'entrada' | 'saida' = 'entrada';
  resultado: 'autorizado' | 'negado' = 'autorizado';
  observacao = '';

  ngOnInit(): void {
    this.loadOptions();
  }

  // Carrega areas e colaboradores para preencher os selects.
  private loadOptions(): void {
    this.loadingOptions.set(true);
    this.errorMessage.set('');

    forkJoin({
      colaboradores: this.colaboradorService.getColaboradores(),
      areas: this.areaService.getAreas(),
    }).subscribe({
      next: ({ colaboradores, areas }) => {
        // US08/RF10: oculta colaboradores inativos no select de registro.
        this.colaboradores.set(colaboradores.filter((colaborador) => colaborador.ativo));

        // Mantem apenas areas ativas quando o backend expuser esse campo.
        this.areas.set(
          areas.filter((area) => {
            const maybeAtiva = (area as unknown as { ativa?: boolean }).ativa;
            return maybeAtiva === undefined ? area.ativo : maybeAtiva;
          }),
        );

        this.loadingOptions.set(false);
      },
      error: (err: unknown) => {
        this.errorMessage.set(
          err instanceof Error
            ? err.message
            : 'Nao foi possivel carregar os dados do formulario.',
        );
        this.loadingOptions.set(false);
      },
    });
  }

  // Exibe o campo observacao somente quando o resultado for negado.
  get showObservacao(): boolean {
    return this.resultado === 'negado';
  }

  // Envia o formulario para registrar entrada ou saida.
  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.colaboradorId || !this.areaId) {
      this.errorMessage.set('Selecione colaborador e area para continuar.');
      return;
    }

    if (this.resultado === 'negado' && !this.observacao.trim()) {
      this.errorMessage.set('Informe uma observacao para acesso negado.');
      return;
    }

    this.submitting.set(true);

    this.registroAcessoService
      .registrarMovimentacao({
        colaborador_id: this.colaboradorId,
        area_id: this.areaId,
        tipo: this.tipo,
        autorizado: this.resultado === 'autorizado',
        observacao: this.observacao || null,
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Registro salvo com sucesso.');
          this.submitting.set(false);
          this.resetForm();
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            err instanceof Error ? err.message : 'Nao foi possivel registrar o acesso.',
          );
          this.submitting.set(false);
        },
      });
  }

  // Limpa o formulario para novo registro.
  private resetForm(): void {
    this.colaboradorId = '';
    this.areaId = '';
    this.tipo = 'entrada';
    this.resultado = 'autorizado';
    this.observacao = '';
  }

  // Volta para tela de historico de acessos.
  goBack(): void {
    this.router.navigate(['/acessos']);
  }
}
