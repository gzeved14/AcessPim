import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegistroAcesso } from '../models/registro-acesso.model';

@Injectable({ providedIn: 'root' })
export class RegistroAcessoService {
  // Base da API para a rota de registros de acesso
  private readonly API = `${environment.apiUrl}/registro`;

  constructor(private http: HttpClient) {}

  // Retorna o histórico de acessos aplicando filtros se existirem (usado na tela Acessos)
  listarHistorico(filtros: any): Observable<RegistroAcesso[]> {
    let params = new HttpParams();
    
    if (filtros.dataInicio) params = params.set('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) params = params.set('dataFim', filtros.dataFim);
    if (filtros.nome_area) params = params.set('nome_area', filtros.nome_area);
    if (filtros.nome_colaborador) params = params.set('nome_colaborador', filtros.nome_colaborador);

    return this.http.get<RegistroAcesso[]>(this.API, { params });
  }

  /**
   * Preview de autorização: Verifica se um acesso será autorizado ANTES de registrar.
   * Retorna detalhes sobre a autorização (motivo, capacidade, etc).
   */
  verificarAutorizacao(colaboradorId: string, areaId: string, tipo: string): Observable<any> {
    return this.http.post<any>(`${this.API}/preview`, {
      colaborador_id: colaboradorId,
      area_id: areaId,
      tipo,
    });
  }

  // Envia um novo registro para o banco de dados (usado na tela Registrar Acesso)
  registrarMovimentacao(payload: any): Observable<RegistroAcesso> {
    const payloadTratado = {
      colaborador_id: payload.colaborador_id,
      area_id: payload.area_id,
      tipo: payload.tipo,
      // Inclui o status de autorizado. Caso a tela não envie, presume-se autorizado (true).
      autorizado: payload.autorizado !== undefined ? payload.autorizado : true,
      // Substitui 'null' por 'undefined' para evitar que o Zod recuse o campo opcional no back-end.
      observacao: payload.observacao ? payload.observacao : undefined,
      registrado_por: payload.registrado_por,
    };

    return this.http.post<RegistroAcesso>(this.API, payloadTratado);
  }

  getHistoricoByColaborador(colaboradorId: string): Observable<RegistroAcesso[]> {
    return this.http.get<RegistroAcesso[]>(`${this.API}/colaborador/${colaboradorId}/historico`);
  }

  getHistoricoGestor(): Observable<RegistroAcesso[]> {
    return this.http.get<RegistroAcesso[]>(`${this.API}/gestor/minha-area`);
  }

  getHistoricoColaboradorNaMinhaArea(colaboradorId: string): Observable<RegistroAcesso[]> {
    return this.http.get<RegistroAcesso[]>(`${this.API}/gestor/colaborador/${colaboradorId}`);
  }
}