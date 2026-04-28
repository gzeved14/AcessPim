// Importa os tipos necessários do Angular para criar um interceptor funcional e lidar com os retornos de erro das chamadas HTTP.
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
// Importa a função inject, que permite injetar serviços e dependências diretamente em funções (padrão do Angular moderno) em vez de usar construtores.
import { inject } from '@angular/core';
// Importa o Router do Angular para podermos redirecionar o usuário para outras telas (como a de login) caso a sessão caia.
import { Router } from '@angular/router';
// Importa operadores reativos do RxJS usados para manipular o fluxo da requisição assíncrona, capturar exceções e trocar streams.
import { catchError, finalize, switchMap, throwError } from 'rxjs';
// Importa o serviço de autenticação local que gerencia tokens, login e logout.
import { AuthService } from './auth.service';

// Variável de controle (flag) global no escopo deste arquivo usada para evitar que múltiplas requisições que falharam ao mesmo tempo tentem disparar várias renovações (refresh) de token simultaneamente.
let isRefreshing = false;

// Função auxiliar que traduz os erros técnicos recebidos do backend (HttpErrorResponse) em objetos Error com mensagens amigáveis para serem exibidas na interface do usuário (UI).
const toFriendlyError = (error: HttpErrorResponse): Error => {
	// Se o status HTTP for 500 ou maior, significa que o backend quebrou ou está offline.
	if (error.status >= 500) {
		return new Error('O servidor esta indisponivel no momento. Tente novamente em instantes.');
	}

	// Se o status for 401 (Unauthorized), indica que o token é inválido, expirou ou o usuário não tem permissão de acesso.
	if (error.status === 401) {
		return new Error('Sua sessao expirou. Faça login novamente para continuar.');
	}

	// Para outros erros (ex: 400 Bad Request, 404 Not Found), tenta usar a mensagem customizada enviada pelo backend (se houver), ou uma mensagem padrão.
	return new Error(error.message || 'Nao foi possivel concluir sua solicitacao.');
};

// Define e exporta o interceptor HTTP. Ele atua como um "pedágio" por onde todas as requisições HTTP do Angular passam antes de ir para a internet e ao voltarem.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Injeta a instância do serviço de autenticação para obtermos acesso aos métodos de ler token e fazer logout/refresh.
  const authService = inject(AuthService);

  // Injeta a instância de rotas do Angular para conseguir navegar o usuário de volta para o "/login" programaticamente.
  const router = inject(Router);

    // Verifica se a URL da requisição atual é de login ou refresh. Nessas rotas nós NÃO devemos injetar o cabeçalho Authorization, pois o usuário está justamente tentando obter um ou criar uma nova chave.
	const isAuthEndpoint =
		req.url.includes('/auth/login') ||
		req.url.includes('/auth/refresh');

	// Busca no AuthService qual é a string do token de acesso (Access Token) salvo no momento.
	const accessToken = authService.accessToken();
	
    // Como os objetos de Request (req) no Angular são imutáveis (não podem ser alterados), precisamos "clonar" a requisição original e incluir nosso cabeçalho nela, ou mandá-la pura se for tela de login/ausência de token.
	const requestToSend =
		!accessToken || isAuthEndpoint
			? req
			: req.clone({
					setHeaders: {
                        // Adiciona o cabeçalho padrão 'Authorization' com a palavra 'Bearer' seguida do token, que o backend (ensureAuth) espera receber.
						Authorization: `Bearer ${accessToken}`,
					},
				});

    // A função 'next()' envia a requisição finalmente. O '.pipe()' permite interceptar e tratar a resposta ou o erro que voltar do backend usando operadores RxJS.
	return next(requestToSend).pipe(
        // Operador responsável por capturar qualquer falha ou erro de rede/HTTP retornado pelo servidor.
		catchError((error: unknown) => {
            // Verifica se o erro gerado não é uma resposta HTTP. Se não for (erro interno de código do TS, por exemplo), apenas repassa o erro adiante sem traduzi-lo.
			if (!(error instanceof HttpErrorResponse)) {
				return throwError(() => error);
			}

            // Salva um booleano verificando se o erro que recebemos significa que o usuário não está logado / token expirou.
			const isUnauthorized = error.status === 401;

			// Se o servidor deu crash (Erro 500+), nós não tentamos renovar token. Simplesmente encerramos estourando o erro amigável na tela.
			if (error.status >= 500) {
				return throwError(() => toFriendlyError(error));
			}

			// Se o erro foi outro código qualquer (ex: 400 - dados inválidos) ou se deu erro 401 LOGO NA TELA DE LOGIN, também não tem sentido tentar usar refresh. Simplesmente propaga o erro pro componente que originou a chamada.
			if (!isUnauthorized || isAuthEndpoint) {
				return throwError(() => toFriendlyError(error));
			}

			// Chegando aqui, sabemos que é um erro 401 real em uma rota protegida. 
            // Porém, se o usuário não tem um token de renovação (refresh token) armazenado, não há o que fazer além de barrá-lo.
			if (!authService.hasSavedRefreshToken()) {
                // Limpa os dados residuais de usuário/sessão.
				authService.clearSession();
                // Manda de volta pra tela de acesso.
				router.navigate(['/login']);
                // Dispara o erro amigável para parar a execução atual e avisar a UI.
				return throwError(() => toFriendlyError(error));
			}

			// Se já existe um processo de "refresh" em andamento (isRefreshing = true), nós impedimos que essa segunda requisição tente fazer de novo simultaneamente para não bugar o fluxo e evitar loopings.
			if (isRefreshing) {
                // Se estourar outro erro 401 enquando já renova, algo muito errado aconteceu, então força o logout por segurança.
				authService.clearSession();
				router.navigate(['/login']);
				return throwError(() => toFriendlyError(error));
			}

			// Marca a flag como true bloqueando a porta. A partir de agora o sistema entrou oficialmente no modo "renovando chave".
			isRefreshing = true;

			// Chama o método que solicita um novo par de tokens ao back-end utilizando o refresh token antigo salvo.
			return authService.refresh().pipe(
                // Operador switchMap cancela a observação atual e troca pelo resultado da nova chamada. É útil para recriar a chamada que falhou lá atrás com o token vencido.
				switchMap((session) => {
					// Refaz a requisição original clonando-a novamente, mas agora injetando o novo token de acesso fresquinho que acabamos de receber de session.accessToken.
					const retryReq = req.clone({
						setHeaders: {
							Authorization: `Bearer ${session.accessToken}`,
						},
					});

                    // Envia ela de volta pro servidor e segue a vida como se o erro 401 nunca tivesse acontecido para o usuário (transparência de sessão).
					return next(retryReq);
				}),
                // Caso nossa tentativa de pedir um novo token falhe (ex: Refresh token expirou no back-end, foi banido da Blacklist ou corrompido)
				catchError((refreshError: unknown) => {
					// A sessão do usuário morreu por completo sem salvação, então forçamos o logout limpando storage.
					authService.clearSession();
                    // Mandamos de volta pro login
					router.navigate(['/login']);
					if (refreshError instanceof HttpErrorResponse) {
						return throwError(() => toFriendlyError(refreshError));
					}
					return throwError(() => refreshError);
				}),
                // O finalize é executado IMPRETERIVELMENTE, quer a tentativa de refresh dê certo ou falhe na metade.
				finalize(() => {
					// Ele solta a flag (passando pra false) para garantir que as próximas requisições HTTP possam rodar o fluxo normal novamente e não fiquem presas em travamento de estado.
					isRefreshing = false;
				}),
			);
		}),
	);
};
