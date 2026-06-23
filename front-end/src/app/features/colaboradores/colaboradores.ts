import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http'; // Importar HttpErrorResponse
import { Colaborador } from '../../core/models/colaborador.model';
import { ColaboradorService } from '../../core/services/colaborador.service';
import { CARGO_COLABORADOR_OPTIONS } from '../../core/types/CargoColaborador';
import { AuthService } from '../../core/auth/auth.service';
import { AcessoService } from '../../core/services/acesso.service'; // Importar AcessoService
import { Perfil } from '../../core/models/perfil.enum';
import { RegistroAcesso } from '../../core/models/registro-acesso.model'; // Importar RegistroAcesso
import { RegistroAcessoService } from '../../core/services/registro-acesso.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';


@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './colaboradores.html',
  styleUrl: './colaboradores.css',
})
export class Colaboradores implements OnInit {
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly acessoService = inject(AcessoService);
  protected readonly authService = inject(AuthService);
  private readonly registroAcessoService = inject(RegistroAcessoService);
  private readonly platformId = inject(PLATFORM_ID);

  cargoOptions = CARGO_COLABORADOR_OPTIONS;

  formatarCargo(cargo: string): string {
  const labels: Record<string, string> = {
    'Técnico de Manutenção': 'Técnico de Manutenção',
    'Supervisor de Produção': 'Supervisor de Produção',
  };
  return labels[cargo] ?? cargo;
}

  // Estados da listagem para loading, erro e conteudo.
  loading = signal(true);
  errorMessage = signal('');
  createErrorMessage = signal('');
  createLoading = signal(false);
  showCreateForm = signal(false);
  showColaboradorHistoryModal = signal(false); // Novo signal para o modal de histórico
  selectedColaboradorHistory = signal<RegistroAcesso[]>([]); // Novo signal para o histórico do colaborador
  selectedColaboradorName = signal(''); // Novo signal para o nome do colaborador selecionado
  showCustomCargo = signal(false);
  colaboradores = signal<Colaborador[]>([]);
  historicoLoading = signal(false);
  

  novoColaborador = {
    nome: '',
    matricula: '',
    cargo: '',
    setor: '',
  };

  customCargo = '';

  get isGestor(): boolean {
      if (!isPlatformBrowser(this.platformId)) return false;
      return this.authService.currentUser()?.cargo === 'GESTOR_DE_AREA';
  }

  get isOperador(): boolean {
      if (!isPlatformBrowser(this.platformId)) return false;
      return this.authService.currentUser()?.cargo === 'OP_DE_SEGURANCA';
  }

  get isAdmin(): boolean {
      if (!isPlatformBrowser(this.platformId)) return false;
      return this.authService.currentUser()?.cargo === 'ADMIN';
  }

  ngOnInit(): void {
    // Dispara a busca inicial ao abrir a pagina.
    this.loadColaboradores();
  }

  loadColaboradores(): void {
    // Prepara a tela para uma nova consulta.
    this.loading.set(true);
    this.errorMessage.set('');

    // Adiciona um parâmetro de cache-busting à requisição
    this.colaboradorService.getColaboradores(new Date().getTime()).subscribe({
      next: (colaboradores) => {
        console.log('Colaboradores recebidos após loadColaboradores():', colaboradores);
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
    this.showCustomCargo.set(false);
    this.createErrorMessage.set('');
    this.novoColaborador = { nome: '', matricula: '', cargo: '', setor: '' };
    this.customCargo = '';
  }

  onCargoChange(): void {
    if (this.novoColaborador.cargo === 'Outros') {
      this.showCustomCargo.set(true);
      this.novoColaborador.cargo = '';
    } else {
      this.showCustomCargo.set(false);
      this.customCargo = '';
    }
  }

  submitNovoColaborador(): void {
    const cargoFinal = this.showCustomCargo() && this.customCargo.trim() 
      ? this.customCargo.trim()
      : this.novoColaborador.cargo;

    if (!cargoFinal) {
      this.createErrorMessage.set('Por favor, selecione ou digite um cargo válido.');
      return;
    }

    this.createLoading.set(true);
    this.createErrorMessage.set('');

    const payload = { 
      ...this.novoColaborador, 
      cargo: cargoFinal, 
      ativo: true
    };

    this.colaboradorService
      .create(payload)
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

  ativarColaborador(id: string): void {
    if (confirm('Tem certeza que deseja ativar este colaborador?')) {
      this.colaboradorService.update(id, { ativo: true }).subscribe({
        next: () => {
          // Atualização otimista: Encontra o colaborador e atualiza seu status 'ativo' no signal
          this.colaboradores.update(colabs =>
            colabs.map(colab =>
              colab.id === id ? { ...colab, ativo: true } : colab
            )
          );
          this.loadColaboradores(); // Recarrega a lista após a ativação
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            err instanceof Error
              ? err.message
              : 'Não foi possível ativar o colaborador.'
          );
        }
      })
    }
  }

  excluirColaborador(id: string): void {
    if (confirm('ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE este colaborador? Esta ação não pode ser desfeita.')) {
      this.colaboradorService.delete(id).subscribe({
        next: () => {
          this.loadColaboradores(); // Recarrega a lista após a exclusão
        },
        error: (err: unknown) => {
          this.errorMessage.set(
            err instanceof Error
              ? err.message
              : 'Não foi possível excluir o colaborador permanentemente.',
          );
        },
      });
    }
  }

  solicitarCadastroFacial(colaboradorId: string): void {
    if (confirm('Iniciar o cadastro facial para este colaborador? Certifique-se de que ele esteja posicionado corretamente na catraca.')) {
      this.colaboradorService.iniciarCadastroFacial(colaboradorId).subscribe({
        next: (response) => alert (`Automação de Borda Iniciada: ${response.message}`),
        error: (err) => alert(`Falha de Comunicação: ${err.error?.message || 'Catraca offline'}`)
      });
    }
  }

  testarLeitorFacial(id: string) {
    this.colaboradorService.iniciarReconhecimentoManual(id).subscribe({
      next: (response) => alert(`Comando de varredura manual enviado. Oleitor processará a resposta em instantes`),
      error: (err) => alert(`Falha: ${err.error?.message}`)
    });
  }

  removerBiometriaFacial(id: string){
    if (confirm(`ATENÇÃO: Esta ação removerá permanentemente as assinaturas biométricas armazenadas na catraca local, em estrita conformidade com a LGPD. Deseja expurgar os dados?`)){
      this.colaboradorService.excluirBiometriaFacial(id).subscribe({
        next: (response) => {
          alert(`${response.message}`);

          this.loadColaboradores();
        },
        error: (err) => alert(`Falha ao expurgar: ${err.error?.message}`)
      });
    }
  }
  // Novo método para visualizar o histórico de um colaborador
  verHistoricoColaborador(colaborador: Colaborador): void {
      this.loading.set(true);
      this.errorMessage.set('');
      this.selectedColaboradorName.set(colaborador.nome);
      this.showColaboradorHistoryModal.set(true);

      const cargo = this.authService.currentUser()?.cargo;
      
      const request$ = cargo === 'GESTOR_DE_AREA'
          ? this.registroAcessoService.getHistoricoColaboradorNaMinhaArea(colaborador.id)
          : this.acessoService.getHistoryByColaborador(colaborador.id);

      request$.subscribe({
          next: (records: RegistroAcesso[]) => {
              this.selectedColaboradorHistory.set(records);
              this.loading.set(false);
          },
          error: (err: HttpErrorResponse) => {
              this.errorMessage.set(err.error?.message || 'Erro ao carregar histórico.');
              this.loading.set(false);
          }
    });
  }

  closeColaboradorHistoryModal(): void {
    this.showColaboradorHistoryModal.set(false);
    this.selectedColaboradorHistory.set([]);
    this.selectedColaboradorName.set('');
  }

  verHistoricoGestor(): void {
    this.historicoLoading?.set(true);
    this.showColaboradorHistoryModal.set(true);
    this.selectedColaboradorName.set('Minha Área');

    this.registroAcessoService.getHistoricoGestor().subscribe({
        next: (records) => {
            this.selectedColaboradorHistory.set(records);
            this.historicoLoading?.set(false);
        },
        error: () => {
            this.selectedColaboradorHistory.set([]);
            this.historicoLoading?.set(false);
        }
    });
  }
  

}