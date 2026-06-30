import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Flag global para evitar múltiplas renovações de token simultâneas
let isRefreshing = false;

// Traduz erros técnicos do backend em mensagens amigáveis para a interface do usuário
const toFriendlyError = (error: HttpErrorResponse): Error => {
	if (error.status >= 500) {
		return new Error('O servidor esta indisponivel no momento. Tente novamente em instantes.');
	}
	if (error.status === 401) {
		return new Error('Sua sessao expirou. Faça login novamente para continuar.');
	}
	return new Error(error.message || 'Nao foi possivel concluir sua solicitacao.');
};

// Interceptor HTTP: insere token de autenticação e trata erros globais de sessão
export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService);
	const router = inject(Router);

	const isAuthEndpoint =
		req.url.includes('/auth/login') ||
		req.url.includes('/auth/refresh');
	const accessToken = authService.accessToken();
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
			if (error.status >= 500) {
				return throwError(() => toFriendlyError(error));
			}
			if (!isUnauthorized || isAuthEndpoint) {
				return throwError(() => toFriendlyError(error));
			}
			if (!authService.hasSavedRefreshToken()) {
				authService.clearSession();
				router.navigate(['/login']);
				return throwError(() => toFriendlyError(error));
			}
			if (isRefreshing) {
				authService.clearSession();
				router.navigate(['/login']);
				return throwError(() => toFriendlyError(error));
			}
			isRefreshing = true;

			// Solicita novo token usando o refresh token salvo
			return authService.refresh().pipe(
				switchMap((session) => {
					const retryReq = req.clone({
						setHeaders: {
							Authorization: `Bearer ${session.accessToken}`,
						},
					});
					return next(retryReq);
				}),
				catchError((refreshError: unknown) => {
					authService.clearSession();
					router.navigate(['/login']);
					if (refreshError instanceof HttpErrorResponse) {
						return throwError(() => toFriendlyError(refreshError));
					}
					return throwError(() => refreshError);
				}),
				finalize(() => {
					isRefreshing = false;
				}),
			);
		}),
	);
};
