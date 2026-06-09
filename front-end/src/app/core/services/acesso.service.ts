import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistroAcesso } from '../models/registro-acesso.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AcessoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/registro`; // A rota correta para os acessos no backend é /registro

  getHistoryByColaborador(colaboradorId: string, limit: number = 10): Observable<RegistroAcesso[]> {
    return this.http.get<RegistroAcesso[]>(`${this.apiUrl}/colaborador/${colaboradorId}/historico?limit=${limit}`);
  }
}