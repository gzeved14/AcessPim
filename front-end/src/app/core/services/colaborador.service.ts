import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Colaborador } from '../models/colaborador.model';

@Injectable({ providedIn: 'root' })
export class ColaboradorService {
  // Base da API de colaboradores usada em CRUD e consultas.
  private readonly API = `${environment.apiUrl}/colaborador`;

  // Injeta o cliente HTTP para executar requisicoes.
  constructor(private http: HttpClient) { }

  // US07: Listagem com busca (opcional passar filtros por query params)
  getColaboradores(timestamp?: number): Observable<Colaborador[]> {
    let params = new HttpParams();
    if (timestamp) {
      params = params.set('timestamp', timestamp.toString());
    }
    // Busca todos os colaboradores para listagem e selects.
    return this.http.get<Colaborador[]>(this.API, { params });
  }

  // Busca um colaborador pelo id.
  getById(id: string): Observable<Colaborador> {
    return this.http.get<Colaborador>(`${this.API}/${id}`);
  }

  // US07: Cadastro de novo colaborador
  create(colaborador: Partial<Colaborador>): Observable<Colaborador> {
    // Envia o novo colaborador para persistencia.
    return this.http.post<Colaborador>(this.API, colaborador);
  }

  // US07: Edição de dados existentes
  update(id: string, colaborador: Partial<Colaborador>): Observable<Colaborador> {
    // Atualiza o colaborador selecionado.
    return this.http.put<Colaborador>(`${this.API}/${id}`, colaborador);
  }

  /**
   * Dispara o inicio do Cadastro/Recadastro Facial na catraca da borda.
   * Liberado para OPERADOR, GESTOR e ADMIN.
   */
  iniciarCadastroFacial(colaboradorId: string): Observable<any> {
    return this.http.post(`${this.API}/cadastrar-rosto`, { colaborador_id: colaboradorId });
  }
  
  /**
   * Dispara uma verificação manual de reconhecimento facial na catraca da borda.
   */
  iniciarReconhecimentoManual(colaboradorId: string): Observable<any> {
    return this.http.post(`${this.API}/${colaboradorId}/reconhecer`, {});
  }

  /**
   * Expuga definitivamente os dados biométricos da borda (LGPD) 
   * Restrito a ADMIN e GESTOR.
   */
  excluirBiometriaFacial(colaboradorId: string): Observable<any>{
    return this.http.delete(`${this.API}/${colaboradorId}/facial`);
  }
  
  // US08: Alternar status ativo/inativo (sem deletar histórico)
  softDelete(id: string): Observable<void> {
    // Altera apenas o status sem remover o historico.
    return this.http.patch<void>(`${this.API}/${id}/toggle-status`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
