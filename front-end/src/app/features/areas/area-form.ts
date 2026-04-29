import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AreaService } from '../../core/services/area.service';

@Component({
  selector: 'app-area-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './area-form.html',
})
export class AreaForm implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly areaService = inject(AreaService);

  loading = signal(false);
  errorMessage = signal('');
  responsaveis = signal<any[]>([]);

  area = {
    nome: '',
    descricao: '',
    nivel_risco: 'BAIXO',
    capacidade: 1,
    responsavel_id: ''
  };

  ngOnInit(): void {
    this.areaService.getResponsaveisDisponiveis().subscribe({
      next: (dados) => this.responsaveis.set(dados),
      error: (err) => console.error('Erro ao carregar responsáveis:', err)
    });
  }

  salvar(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.post('http://localhost:3000/area', this.area).subscribe({
      next: () => {
        this.router.navigate(['/areas']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || err.message || 'Erro ao cadastrar a área.');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.location.back();
  }
}