import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardData } from '../models/dashboard.model';
import { RegistroAcesso } from '../models/registro-acesso.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/dashboard`;

  // Retorna o payload consolidado do dashboard (cards + ocupacao + ultimos acessos).
  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.API);
  }

  // Atalho para consumo direto da lista dos ultimos registros.
  getLatestAccesses(): Observable<RegistroAcesso[]> {
    return this.getDashboard().pipe(map((dashboard) => dashboard.latestAccesses ?? []));
  }
}
