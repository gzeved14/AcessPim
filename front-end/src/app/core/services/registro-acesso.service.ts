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
}