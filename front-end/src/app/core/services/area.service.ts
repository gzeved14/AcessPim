import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Area } from '../models/area.model';

@Injectable({ providedIn: 'root' })
export class AreaService {
  // Base da API de areas usada por todas as chamadas do service.
  private readonly API = `${environment.apiUrl}/area`;

  // Injeta o cliente HTTP para conversar com o back-end.
  constructor(private http: HttpClient) {}

  // US09: Listagem de áreas cadastradas
  getAreas(): Observable<Area[]> {
    // Busca todas as areas para listagem e selects.
    return this.http.get<Area[]>(this.API);
  }

  // Busca uma area especifica pelo identificador.
  getById(id: string): Observable<Area> {
    return this.http.get<Area>(`${this.API}/${id}`);
  }

  // US09: Cadastro de área com nível de risco e capacidade
  create(area: Partial<Area>): Observable<Area> {
    // Envia os dados da nova area para o back-end.
    return this.http.post<Area>(this.API, area);
  }

  // US09: Atualização de área
  update(id: string, area: Partial<Area>): Observable<Area> {
    // Atualiza a area existente informada pelo id.
    return this.http.put<Area>(`${this.API}/${id}`, area);
  }

  // Útil para preencher o select de responsáveis no cadastro de áreas
  getResponsaveisDisponiveis(): Observable<any[]> {
    // Carrega colaboradores com perfil de supervisor para o select.
    return this.http.get<any[]>(`${environment.apiUrl}/colaborador?cargo=supervisor`);
  }
}