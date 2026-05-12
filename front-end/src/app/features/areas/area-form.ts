import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { AreaService } from '../../core/services/area.service';
import { ColaboradorService } from '../../core/services/colaborador.service'; // Para buscar responsáveis
import { Area } from '../../core/models/area.model';

@Component({
  selector: 'app-area-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './area-form.html',
})
export class AreaForm implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly areaService = inject(AreaService);

  loading = signal(false);
  errorMessage = signal('');
  responsaveis = signal<any[]>([]);
  isEditMode = signal(false);
  areaId = '';

  @ViewChild('form') areaForm!: NgForm;

  area: Partial<Area> = {
    nome: '',
    descricao: '',
    nivel_risco: 'BAIXO',
    capacidade: 1,
    responsavel_id: '', // Agora responsavel_id é uma string diretamente
    ativa: true
  };

  ngOnInit(): void {
    this.areaId = this.route.snapshot.paramMap.get('id') || '';
    if (this.areaId) {
      this.isEditMode.set(true);
      this.loadArea();
    }
    this.loadResponsaveis();
  }

  loadResponsaveis(): void {
    this.colaboradorService.getColaboradores().subscribe({
      next: (colaboradores) => {
        this.responsaveis.set(colaboradores.filter(c => c.cargo === 'GESTOR_DE_AREA' || c.cargo === 'ADMIN')); // Filtra por cargos relevantes
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(err.error?.message || err.message || 'Erro ao carregar responsáveis.');
      }
    });
  }

  loadArea(): void {
    this.loading.set(true);
    this.areaService.getById(this.areaId).subscribe({
      next: (dados: Area) => {
        this.area = dados;
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(err.error?.message || err.message || 'Erro ao carregar os dados da área.');
        this.loading.set(false);
      }
    });
  }

  salvar(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const request$ = this.isEditMode()
      ? this.areaService.update(this.areaId, this.area)
      : this.areaService.create(this.area);
    request$.subscribe({
      next: () => {
        this.router.navigate(['/areas']);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(err.error?.message || err.message || 'Erro ao salvar a área.');
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.location.back();
  }
}