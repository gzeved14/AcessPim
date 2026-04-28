import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { Area } from '../../../core/models/area.model';
import { Colaborador } from '../../../core/models/colaborador.model';
import { AreaService } from '../../../core/services/area.service';
import { ColaboradorService } from '../../../core/services/colaborador.service';
import { RegistroAcessoService } from '../../../core/services/registro-acesso.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-registrar-acesso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar-acesso.html',
  styleUrl: './registrar-acesso.css',
})
export class RegistrarAcesso implements OnInit {
  // Injeção de dependências
  private readonly areaService = inject(AreaService);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly registroAcessoService = inject(RegistroAcessoService);
  private readonly authService = inject(AuthService); // Injetado para pegar o operador logado
  private readonly router = inject(Router);

  // Estados de reatividade (Signals)
  loadingOptions = signal(true);
  submitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Opções para os selects
  colaboradores = signal<Colaborador[]>([]);
  areas = signal<Area[]>([]);

  // Modelos do formulário
  colaboradorId = '';
  areaId = '';
  tipo: 'entrada' | 'saida' = 'entrada';
  resultado: 'autorizado' | 'negado' = 'autorizado';
  observacao = '';

  ngOnInit(): void {
    this.loadOptions();
  }

  private loadOptions(): void {
    this.loadingOptions.set(true);
    this.errorMessage.set('');

    forkJoin({
      colaboradores: this.colaboradorService.getColaboradores(),
      areas: this.areaService.getAreas(),
    }).subscribe({
      next: ({ colaboradores, areas }) => {
        // US08: Exibe apenas colaboradores ativos
        this.colaboradores.set(colaboradores.filter((c) => c.ativo));
        
        // Exibe apenas áreas ativas
        this.areas.set(
         areas.filter((area) => area.ativa) // Agora 'ativa' será reconhecido pelo TS
        );
        
        this.loadingOptions.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível carregar os dados do formulário.');
        this.loadingOptions.set(false);
      },
    });
  }

  get showObservacao(): boolean {
    return this.resultado === 'negado';
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    // Validações de frontend
    if (!this.colaboradorId || !this.areaId) {
      this.errorMessage.set('Selecione colaborador e área para continuar.');
      return;
    }

    // US04: Observação obrigatória para negativas
    if (this.resultado === 'negado' && !this.observacao.trim()) {
      this.errorMessage.set('Informe uma observação para acesso negado.');
      return;
    }

    const operador = this.authService.currentUser();
    if (!operador?.id) {
      this.errorMessage.set('Sessão inválida. Faça login novamente.');
      return;
    }

    this.submitting.set(true);

    // Envio para o serviço
    this.registroAcessoService
      .registrarMovimentacao({
        colaborador_id: this.colaboradorId,
        area_id: this.areaId,
        tipo: this.tipo,
        autorizado: this.resultado === 'autorizado',
        observacao: this.observacao || null,
        registrado_por: operador.id // Campo obrigatório no backend
      })
      .subscribe({
        next: () => {
          this.successMessage.set('Registro salvo com sucesso!');
          this.submitting.set(false);
          this.resetForm();
        },
        error: (err: HttpErrorResponse) => {
          // Captura erro 403 (permissão) ou 400 (saída sem entrada)
          this.errorMessage.set(err.error?.message || 'Erro ao registrar acesso.');
          this.submitting.set(false);
        },
      });
  }

  private resetForm(): void {
    this.colaboradorId = '';
    this.areaId = '';
    this.tipo = 'entrada';
    this.resultado = 'autorizado';
    this.observacao = '';
  }

  goBack(): void {
    this.router.navigate(['/app/acessos/historico']);
  }
}