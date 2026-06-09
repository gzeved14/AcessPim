import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ColaboradorService } from '../../../core/services/colaborador.service';
import { Colaborador } from '../../../core/models/colaborador.model';
import { CARGO_COLABORADOR_OPTIONS } from '../../../core/types/CargoColaborador';

@Component({
  selector: 'app-colaborador-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './colaborador-form.html',
})
export class ColaboradorForm implements OnInit {
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  loading = signal(false);
  errorMessage = signal('');
  isEditMode = signal(false);
  showCustomCargo = signal(false);
  colaboradorId = '';

@ViewChild('form') form!: NgForm;

  colaborador: Partial<Colaborador> = {
    nome: '',
    matricula: '',
    cargo: '', // Valor padrão
    setor: '',
    ativo: true
  };

  cargoOptions = CARGO_COLABORADOR_OPTIONS;
  customCargo = '';

  ngOnInit(): void {
    this.colaboradorId = this.route.snapshot.paramMap.get('id') || '';
    if (this.colaboradorId) {
      this.isEditMode.set(true);
      this.loadColaborador();
    }
  }

  loadColaborador(): void {
    this.loading.set(true);
    this.colaboradorService.getById(this.colaboradorId).subscribe({
      next: (dados: Colaborador) => {
        this.colaborador = dados;
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(err.error?.message || err.message || 'Erro ao carregar os dados do colaborador.');
        this.loading.set(false);
      }
    });
  }

  salvar(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    // Se "Outros" foi selecionado, usar o cargo customizado
    if (this.showCustomCargo() && this.customCargo.trim()) {
      this.colaborador.cargo = this.customCargo.trim();
    }

    const request$ = this.isEditMode() 
      ? this.colaboradorService.update(this.colaboradorId, this.colaborador)
      : this.colaboradorService.create(this.colaborador);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/colaboradores']);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(err.error?.message || err.message || 'Erro ao salvar o colaborador.');
        this.loading.set(false);
      }
    });
  }

  onCargoChange(): void {
    if (this.colaborador.cargo === 'Outros') {
      this.showCustomCargo.set(true);
      this.colaborador.cargo = '';
    } else {
      this.showCustomCargo.set(false);
      this.customCargo = '';
    }
  }

  cancelar(): void {
    this.location.back();
  }
}