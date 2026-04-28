import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './login.component.html',
	styleUrl: './login.component.css',
})
export class LoginComponent {
	private readonly fb = inject(FormBuilder);
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);

	public loading = signal(false);
	public errorMessage = signal<string | null>(null);

	public form = this.fb.nonNullable.group({
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(6)]],
	});

	onSubmit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		this.loading.set(true);
		this.errorMessage.set(null);

		const { email, password } = this.form.getRawValue();
		// Evita erro de credencial por espacos acidentais e letras maiusculas no email.
		const normalizedEmail = email.trim().toLowerCase();
		
		this.authService.login(normalizedEmail, password).subscribe({
			next: (session) => {
				// Grava a sessao antes de ir para o dashboard para o guard reconhecer o usuario.
				this.authService.setSession(session);
				this.loading.set(false);
				this.router.navigate(['/dashboard'], { replaceUrl: true });
			},
			error: () => {
				this.loading.set(false);
				this.errorMessage.set('Falha no login. Verifique suas credenciais.');
			},
		});
	}
}
