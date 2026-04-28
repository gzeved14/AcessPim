import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css',
})
export class UsuarioForm implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);

  loading = signal(false);
  errorMessage = signal('');

  usuario = {
    nome: '',
    matricula: '',
    email: '',
    senha: '',
    setor: '',
    cargo: 'OP_DE_SEGURANCA'
  };

  ngOnInit(): void {
    // Proteção na tela: Só ADMIN pode usar este formulário
    const currentUser = this.authService.currentUser() as any;
    if (currentUser?.cargo !== 'ADMIN') {
      alert('Acesso negado. Apenas administradores podem cadastrar novos usuários no sistema.');
      this.location.back();
    }
  }

  salvar(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.post('http://localhost:3000/usuario', this.usuario).subscribe({
      next: () => {
        alert('Usuário cadastrado com sucesso!');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || err.message || 'Erro ao cadastrar usuário.');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.location.back();
  }
}