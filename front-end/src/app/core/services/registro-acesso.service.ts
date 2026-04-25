import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegistroAcesso } from '../models/registro-acesso.model';
import { AuthService } from '../auth/auth.service';

// Payload usado no cadastro de entrada/saida de acesso.
export interface RegistroMovimentacaoInput {
	colaborador_id: string;
	area_id: string;
	tipo: 'entrada' | 'saida';
	autorizado?: boolean;
	observacao?: string | null;
}

// Filtros opcionais para consulta de historico.
export interface RegistroHistoricoFiltros {
	dataInicio?: string;
	dataFim?: string;
	area_id?: string;
	colaborador_id?: string;
}

@Injectable({ providedIn: 'root' })
export class RegistroAcessoService {
	private readonly http = inject(HttpClient);
	private readonly authService = inject(AuthService);
	private readonly API = `${environment.apiUrl}/registro`;

	// Registra uma movimentacao de acesso (entrada/saida/negativa).
	registrarMovimentacao(payload: RegistroMovimentacaoInput): Observable<RegistroAcesso> {
		// Regra de negocio da US04: acesso negado deve conter observacao.
		if (payload.autorizado === false && !payload.observacao?.trim()) {
			throw new Error('Informe uma observacao quando o acesso for negado.');
		}

		const operadorId = this.authService.currentUser()?.id;
		if (!operadorId) {
			throw new Error('Nao foi possivel identificar o operador autenticado.');
		}

		// Inclui o operador atual para compatibilidade com o DTO de criacao do back-end.
		return this.http.post<RegistroAcesso>(this.API, {
			colaborador_id: payload.colaborador_id,
			area_id: payload.area_id,
			tipo: payload.tipo,
			observacao: payload.observacao ?? null,
			// Mantido por compatibilidade com DTO atual do back-end.
			registrado_por: operadorId,
		});
	}

	// Busca historico de acessos, aceitando combinacao de filtros.
	listarHistorico(filtros: RegistroHistoricoFiltros = {}): Observable<RegistroAcesso[]> {
		let params = new HttpParams();

		if (filtros.dataInicio) {
			params = params.set('dataInicio', filtros.dataInicio);
		}

		if (filtros.dataFim) {
			params = params.set('dataFim', filtros.dataFim);
		}

		if (filtros.area_id) {
			params = params.set('area_id', filtros.area_id);
		}

		if (filtros.colaborador_id) {
			params = params.set('colaborador_id', filtros.colaborador_id);
		}

		return this.http.get<RegistroAcesso[]>(this.API, { params });
	}
}
