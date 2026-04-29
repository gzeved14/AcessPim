import { Injectable, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { Perfil } from '../models/perfil.enum';
import { AuthResponse } from '../models/auth-response.model';
import { environment } from '../../../environments/environment';

interface AuthState {
    usuario: Usuario | null;
    accessToken: string | null;
}

// Interfaces internas para melhor controle de tipos
interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    usuario: Usuario;
}

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'authUser';

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

    // Selectors reativos usando Signals
    isAuthenticated = computed(() => !!this.state().accessToken);
    currentUser = computed(() => this.state().usuario);
    accessToken = computed(() => this.state().accessToken);
    
    // US09: Facilita a verificação de permissões para áreas restritas
    currentPerfil = computed<Perfil | null>(() => {
        const cargo = this.state().usuario?.cargo;
        return this.toPerfil(cargo);
    });

    login(email: string, password: string): Observable<LoginResponse> {
        return this.http
            .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
            .pipe(
                map((res) => ({
                    accessToken: res.accessToken,
                    refreshToken: res.refreshToken,
                    usuario: this.mapAuthUser(res),
                })),
                tap((res) => this.persistSession(res))
            );
    }

    logout(): Observable<void> {
    const refreshToken = this.getStorageItem(REFRESH_TOKEN_KEY);
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, { refreshToken })
        .pipe(
            tap(() => {
                this.clearSession();
                this.router.navigate(['/login']);
            }),
            catchError(() => {
                this.clearSession();
                this.router.navigate(['/login']);
                return of(undefined);
            })
        );
    }

    clearSession(): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.clear(); // Limpa tokens e dados do usuário
        }
        this.state.set({ usuario: null, accessToken: null });
    }

    hasRole(perfil: Perfil): boolean {
        return this.currentPerfil() === perfil;
    }

    hasSavedRefreshToken(): boolean {
        return !!this.getStorageItem(REFRESH_TOKEN_KEY);
    }

    refresh(): Observable<LoginResponse> {
        const refreshToken = this.getStorageItem(REFRESH_TOKEN_KEY);
        return this.http
            .post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
            .pipe(
                map((res) => ({
                    accessToken: res.accessToken,
                    refreshToken: res.refreshToken,
                    usuario: this.mapAuthUser(res),
                })),
                tap((res) => this.persistSession(res))
            );
    }

    private mapAuthUser(response: AuthResponse): Usuario {
        // Correção: Mapeando campos obrigatórios conforme o PRD
        return {
            id: response.user.id,
            nome: response.user.nome,
            email: response.user.email,
            cargo: response.user.cargo,
            matricula: response.user.matricula || '', // Essencial para US07
            setor: response.user.setor || '',         // Essencial para US07
        };
    }

    private persistSession(session: { accessToken: string; refreshToken: string; usuario: Usuario }): void {
        if (!isPlatformBrowser(this.platformId)) return;

        localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(session.usuario));
        
        this.state.set({ usuario: session.usuario, accessToken: session.accessToken });
    }

    private toPerfil(cargo: string | undefined): Perfil | null {
        if (!cargo) return null;
        // Normaliza o cargo para o Enum de Perfil (Administrador, Gestor, Operador)
        return Object.values(Perfil).includes(cargo as Perfil) ? (cargo as Perfil) : null;
    }

    private getStorageItem(key: string): string {
        return isPlatformBrowser(this.platformId) ? localStorage.getItem(key) ?? '' : '';
    }

    private hydrateSessionFromStorage(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const accessToken = this.getStorageItem(ACCESS_TOKEN_KEY);
        if (!accessToken) return;

        try {
            const userJson = this.getStorageItem(USER_KEY);
            const usuario = userJson ? JSON.parse(userJson) : null;
            this.state.set({ usuario, accessToken });
        } catch {
            this.clearSession();
        }
    }

    setSession(session: LoginResponse): void {
    // Reaproveita a lógica de persistência já existente no serviço
    this.persistSession(session);
    }
}