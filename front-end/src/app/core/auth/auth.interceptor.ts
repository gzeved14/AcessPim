import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(AuthService);
	const router = inject(Router);

	const isAuthEndpoint =
		req.url.includes('/auth/login') ||
		req.url.includes('/auth/refresh') ||
		req.url.includes('/auth/logout');

	const accessToken = authService.getAccessToken();
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
			const isUnauthorized =
				error instanceof HttpErrorResponse && error.status === 401;

			if (
				!isUnauthorized ||
				isAuthEndpoint ||
				!authService.hasSavedRefreshToken()
			) {
				return throwError(() => error);
			}

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
					return throwError(() => refreshError);
				}),
			);
		}),
	);
};
