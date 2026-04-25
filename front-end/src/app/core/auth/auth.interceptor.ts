// Importa tipos para criar interceptor funcional e tratar erros HTTP.
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
// Importa inject para obter dependencias dentro da funcao.
import { inject } from '@angular/core';
// Importa Router para redirecionamentos.
import { Router } from '@angular/router';
// Importa operadores para tratamento de erros e troca de fluxo.
import { catchError, finalize, switchMap, throwError } from 'rxjs';
// Importa o servico de autenticacao.
import { AuthService } from './auth.service';

// Flag global para evitar multiplos refresh simultaneos.
let isRefreshing = false;

// Converte erros tecnicos HTTP em mensagens amigaveis para exibicao na interface.
const toFriendlyError = (error: HttpErrorResponse): Error => {
	// Erros 5xx: indisponibilidade do servidor.
	if (error.status >= 500) {
		return new Error('O servidor esta indisponivel no momento. Tente novamente em instantes.');
	}

	// Erro 401: sessao expirada ou token invalido.
	if (error.status === 401) {
		return new Error('Sua sessao expirou. Faça login novamente para continuar.');
	}

	// Demais erros: usa a mensagem original se existir.
	return new Error(error.message || 'Nao foi possivel concluir sua solicitacao.');
};

// Define o interceptor que adiciona token e trata 401.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Injeta o AuthService.
  const authService = inject(AuthService);

  // Injeta o Router.
  const router = inject(Router);

	const isAuthEndpoint =
		req.url.includes('/auth/login') ||
		req.url.includes('/auth/refresh') ||
		req.url.includes('/auth/logout');

	// Le o access token atual do estado reativo.
	const accessToken = authService.getAccessToken();
	// Clona a requisicao adicionando Authorization quando ha token.
	const requestToSend =
		!accessToken || isAuthEndpoint
			? req
			: req.clone({
					setHeaders: {
						Authorization: `Bearer ${accessToken}`,
					},
				});

	return next(requestToSend).pipe(
		catchError((error: unknown) => {
			if (!(error instanceof HttpErrorResponse)) {
				return throwError(() => error);
			}

			const isUnauthorized = error.status === 401;

			// Se nao for 401, for endpoint de auth ou nao houver refresh token salvo,
			// apenas propaga o erro.
			// Para erro interno do servidor, retorna erro amigavel para UI.
			if (error.status >= 500) {
				return throwError(() => toFriendlyError(error));
			}

			// Para erros diferentes de 401 ou chamadas de auth, nao tenta refresh.
			if (!isUnauthorized || isAuthEndpoint) {
				return throwError(() => toFriendlyError(error));
			}

			// Se nao existe refresh token salvo, encerra sessao e redireciona para login.
			if (!authService.hasSavedRefreshToken()) {
				authService.clearSession();
				router.navigate(['/login']);
				return throwError(() => toFriendlyError(error));
			}

			// Evita iniciar multiplos refresh simultaneos.
			if (isRefreshing) {
				authService.clearSession();
				router.navigate(['/login']);
				return throwError(() => toFriendlyError(error));
			}

			// Marca que o fluxo de refresh comecou.
			isRefreshing = true;

			// Tenta renovar token; se der certo, refaz a request original.
			return authService.refresh().pipe(
				switchMap((session) => {
					// Refaz a requisicao original com o novo access token.
					const retryReq = req.clone({
						setHeaders: {
							Authorization: `Bearer ${session.accessToken}`,
						},
					});

					return next(retryReq);
				}),
				catchError((refreshError: unknown) => {
					// Se o refresh falhar, encerra sessao e obriga novo login.
					authService.clearSession();
					router.navigate(['/login']);
					if (refreshError instanceof HttpErrorResponse) {
						return throwError(() => toFriendlyError(refreshError));
					}
					return throwError(() => refreshError);
				}),
				finalize(() => {
					// Garante liberacao da flag mesmo em caso de erro.
					isRefreshing = false;
				}),
			);
		}),
	);
};
