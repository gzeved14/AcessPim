import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AreaService } from '../../core/services/area.service';
import { Area } from '../../core/models/area.model';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './areas.html',
  styleUrl: './areas.css',
})
export class Areas implements OnInit {
  private readonly areaService = inject(AreaService);

  // Estados da tela de listagem.
  loading = signal(true);
  errorMessage = signal('');
  areas = signal<Area[]>([]);

  ngOnInit(): void {
    // Carrega areas assim que o componente for iniciado.
    this.loadAreas();
  }

  loadAreas(): void {
    // Limpa estado de erro e ativa feedback visual de carregamento.
    this.loading.set(true);
    this.errorMessage.set('');

    this.areaService.getAreas().subscribe({
      next: (areas) => {
        // Salva os dados para renderizacao na tabela.
        this.areas.set(areas);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        // Mostra mensagem amigavel no lugar de erro tecnico.
        this.errorMessage.set(
          err instanceof Error
            ? err.message
            : 'Nao foi possivel carregar as areas no momento.',
        );
        this.loading.set(false);
      },
    });
  }
}
