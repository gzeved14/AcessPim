import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface ColaboradorMinimal {
  id: string;
  nome: string;
  matricula: string;
}

interface AreaMinimal {
  id: string;
  nome: string;
  nivelRisco: string;
  ativa?: boolean;
}

@Component({
  selector: 'app-permissoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permissoes.html',
})
export class PermissoesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3001/api';

  // Estados Reativos (Signals)
  loading = signal<boolean>(false);
  loadingPermissoes = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Listas de dados
  colaboradores = signal<ColaboradorMinimal[]>([]);
  areas = signal<AreaMinimal[]>([]);

  // Estado de seleção
  colaboradorSelecionado = signal<string>('');
  areasPermitidasIds = signal<string[]>([]);

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  carregarDadosIniciais(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    // Busca colaboradores e áreas simultaneamente para otimizar o carregamento
    this.http.get<ColaboradorMinimal[]>(`${this.API_URL}/colaborador`).subscribe({
      next: (res) => this.colaboradores.set(res),
      error: (err: HttpErrorResponse) => this.tratarErro(err, 'Erro ao carregar colaboradores.')
    });

    this.http.get<AreaMinimal[]>(`${this.API_URL}/area`).subscribe({
      next: (res) => {
        const areasAtivas = res.filter(area => area.ativa !== false);
        this.areas.set(areasAtivas);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => this.tratarErro(err, 'Erro ao carregar áreas restritas.')
    });
  }

  onColaboradorChange(): void {
    const id = this.colaboradorSelecionado();
    if (!id) {
      this.areasPermitidasIds.set([]);
      return;
    }

    this.loadingPermissoes.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Rota que retorna o array de autorizações atuais do colaborador
    this.http.get<any[]>(`${this.API_URL}/registro/colaborador/${id}/permissoes`).subscribe({
      next: (res) => {
        // Mapeia o retorno para guardar apenas o ID de cada área autorizada
        const ids = res.map(auth => auth.areaId);
        this.areasPermitidasIds.set(ids);
        this.loadingPermissoes.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.tratarErro(err, 'Erro ao carregar permissões do colaborador.');
        this.loadingPermissoes.set(false);
      }
    });
  }

  isAreaMarcada(areaId: string): boolean {
    return this.areasPermitidasIds().includes(areaId);
  }

  toggleArea(areaId: string): void {
    const listaAtual = [...this.areasPermitidasIds()];
    const index = listaAtual.indexOf(areaId);

    if (index > -1) {
      listaAtual.splice(index, 1); // Desmarcou: remove do array
    } else {
      listaAtual.push(areaId); // Marcou: adiciona ao array
    }

    this.areasPermitidasIds.set(listaAtual);
  }

  salvarPermissoes(): void {
    const idColaborador = this.colaboradorSelecionado();
    if (!idColaborador) return;

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = {
      colaboradorId: idColaborador,
      areasIds: this.areasPermitidasIds()
    };

    this.http.post(`${this.API_URL}/registro/permissoes/vincular`, payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Permissões de acesso atualizadas com sucesso!');
        // Remove a mensagem de sucesso após 4 segundos
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err: HttpErrorResponse) => {
        this.tratarErro(err, 'Falha ao salvar lote de permissões.');
      }
    });
  }

  private tratarErro(err: HttpErrorResponse, mensagemPadrao: string): void {
    this.errorMessage.set(err.error?.message || err.message || mensagemPadrao);
    this.loading.set(false);
  }
}