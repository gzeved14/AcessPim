import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Acessos } from './acessos';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('Componente Acessos (Listagem)', () => {
  let component: Acessos;
  let fixture: ComponentFixture<Acessos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Importamos o componente standalone e os módulos de teste
      imports: [Acessos, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Acessos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve limpar os filtros corretamente ao chamar clearFilter()', () => {
    // 1. Definimos valores nos filtros
    component.nomeArea = 'Almoxarifado';
    component.nomeColaborador = 'Eduardo';
    component.dataInicio = '2026-05-01';

    // 2. Chamamos a função de limpar
    component.clearFilter();

    // 3. EXPECTATIVA: Tudo deve estar vazio
    expect(component.nomeArea).toBe('');
    expect(component.nomeColaborador).toBe('');
    expect(component.dataInicio).toBe('');
  });

  it('deve iniciar com o estado de loading como verdadeiro', () => {
    // Verifica se o signal de loading começa ativado
    expect(component.loading()).toBe(true);
  });
});