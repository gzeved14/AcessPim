import { Injectable, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, map, tap } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { Perfil } from '../models/perfil.enum';
import { AuthResponse } from '../models/auth-response.model';
import { environment } from '../../../environments/environment';

interface AuthState {
	usuario: Usuario | null;
	accessToken: string | null;
}

interface LoginResponse {
	accessToken: string;
	refreshToken: string;
	usuario: Usuario;
}

interface RefreshResponse {
	accessToken: string;
	refreshToken: string;
}

interface SessionPayload {
	accessToken: string;
	refreshToken: string;
	usuario: Usuario;
}

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'authUser';
const LEGACY_ACCESS_TOKEN_KEY = 'access_token';

const EMPTY_USER: Usuario = {
	id: '',
	nome: '',
	email: '',
	cargo: '',
	matricula: '',
	setor: '',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly platformId = inject(PLATFORM_ID);
	private readonly http = inject(HttpClient);
	private readonly router = inject(Router);

	private readonly state = signal<AuthState>({
		usuario: null,
		accessToken: null,
	});

	constructor() {
		this.hydrateSessionFromStorage();
	}

	isAuthenticated = computed(() => !!this.state().accessToken);
	currentUser = computed(() => this.state().usuario);
	currentPerfil = computed<Perfil | null>(() => {
		const cargo = this.state().usuario?.cargo;
		return this.toPerfil(cargo);
	});
	accessToken = computed(() => this.state().accessToken);

	login(email: string, password: string): Observable<LoginResponse> {
		return this.http
			.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
			.pipe(
				map((res) => ({
					accessToken: res.accessToken,
					refreshToken: res.refreshToken,
					usuario: this.mapAuthUser(res),
				})),
				tap((res) => {
					this.persistSession(res);
				}),
			);
	}

	refresh(): Observable<LoginResponse> {
		const refreshToken = this.getStorageItem(REFRESH_TOKEN_KEY);

		return this.http
			.post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
			.pipe(
				map((res) => ({
					accessToken: res.accessToken,
					refreshToken: res.refreshToken,
					usuario: this.state().usuario ?? EMPTY_USER,
				})),
				tap((res) => {
					this.persistSession(res);
				}),
			);
	}

	setSession(session: SessionPayload): void {
		// Reaproveita a mesma rotina usada pelo refresh para manter a sessao sincronizada.
		this.persistSession(session);
	}

	logout(): Observable<void> {
		const refreshToken = this.getStorageItem(REFRESH_TOKEN_KEY);

		return this.http
			.post<void>(`${environment.apiUrl}/auth/logout`, { refreshToken })
			.pipe(
				tap(() => {
					this.clearSession();
					this.router.navigate(['/login']);
				}),
			);
	}

	clearSession(): void {
		if (isPlatformBrowser(this.platformId)) {
			localStorage.removeItem(ACCESS_TOKEN_KEY);
			localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
			localStorage.removeItem(REFRESH_TOKEN_KEY);
			localStorage.removeItem(USER_KEY);
		}

		this.state.set({ usuario: null, accessToken: null });
	}

	hasSavedRefreshToken(): boolean {
		return !!this.getStorageItem(REFRESH_TOKEN_KEY);
	}

	hasRole(perfil: Perfil): boolean {
		return this.currentPerfil() === perfil;
	}

	getAccessToken(): string | null {
		return this.accessToken();
	}

	private mapAuthUser(response: AuthResponse): Usuario {
		return {
			id: response.user.id,
			nome: response.user.nome,
			email: response.user.email,
			cargo: response.user.cargo,
			matricula: '',
			setor: '',
		};
	}

	private persistSession(session: SessionPayload): void {
		// O armazenamento em browser nao existe no servidor, então este bloco deve ser ignorado no SSR.
		if (!isPlatformBrowser(this.platformId)) {
			return;
		}

		localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
		localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
		localStorage.setItem(USER_KEY, JSON.stringify(session.usuario));
		this.state.set({ usuario: session.usuario, accessToken: session.accessToken });
	}

	private toPerfil(cargo: string | undefined): Perfil | null {
		if (!cargo) {
			return null;
		}

		return Object.values(Perfil).includes(cargo as Perfil)
			? (cargo as Perfil)
			: null;
	}

	private getStorageItem(key: string): string {
		if (!isPlatformBrowser(this.platformId)) {
			return '';
		}

		return localStorage.getItem(key) ?? '';
	}

	private hydrateSessionFromStorage(): void {
		if (!isPlatformBrowser(this.platformId)) {
			return;
		}

		const accessToken =
			this.getStorageItem(ACCESS_TOKEN_KEY) || this.getStorageItem(LEGACY_ACCESS_TOKEN_KEY);

		if (!accessToken) {
			return;
		}

		const user = this.getStorageUser();
		this.state.set({
			usuario: user,
			accessToken,
		});
	}

	private getStorageUser(): Usuario | null {
		const rawUser = this.getStorageItem(USER_KEY);

		if (!rawUser) {
			return null;
		}

		try {
			return JSON.parse(rawUser) as Usuario;
		} catch {
			return null;
		}
	}
}
