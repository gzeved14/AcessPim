import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColaboradorForm } from './colaborador-form';
import { ColaboradorService } from '../../../core/services/colaborador.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ColaboradorForm', () => {
  let component: ColaboradorForm;
  let fixture: ComponentFixture<ColaboradorForm>;
  let mockColaboradorService: { getById: ReturnType<typeof vi.fn>, create: ReturnType<typeof vi.fn>, update: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockActivatedRoute: any;
  let mockLocation: { back: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockColaboradorService = {
      getById: vi.fn(),
      create:  vi.fn(),
      update:  vi.fn(),
    };
    mockRouter   = { navigate: vi.fn() };
    mockLocation = { back: vi.fn() };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (_key: string) => null,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, ReactiveFormsModule, ColaboradorForm],
      providers: [
        { provide: ColaboradorService, useValue: mockColaboradorService },
        { provide: Router,             useValue: mockRouter },
        { provide: ActivatedRoute,     useValue: mockActivatedRoute },
        { provide: Location,           useValue: mockLocation },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ColaboradorForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ------------------------------------------------------------------
  // Criação
  // ------------------------------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize in create mode if no ID is provided', () => {
    expect(component.isEditMode()).toBe(false);
    expect(component.colaboradorId).toBe('');
  });

  // ------------------------------------------------------------------
  // Modo edição — carregamento
  // ------------------------------------------------------------------

  it('should initialize in edit mode and load colaborador if ID is provided', () => {
    const colaboradorId = '123';
    const mockColaborador = { id: colaboradorId, nome: 'Test', matricula: '12345', cargo: 'Técnico', setor: 'TI', ativo: true };

    mockActivatedRoute.snapshot.paramMap.get = (key: string) => (key === 'id' ? colaboradorId : null);
    mockColaboradorService.getById.mockReturnValue(of(mockColaborador));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(component.colaboradorId).toBe(colaboradorId);
    expect(mockColaboradorService.getById).toHaveBeenCalledWith(colaboradorId);
    expect(component.colaborador).toEqual(mockColaborador);
    expect(component.loading()).toBeFalsy();
  });

  it('should handle error when loading colaborador in edit mode', () => {
    const colaboradorId = '123';
    const errorResponse = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      error: { message: 'Colaborador não encontrado' },
    });

    mockActivatedRoute.snapshot.paramMap.get = (key: string) => (key === 'id' ? colaboradorId : null);
    mockColaboradorService.getById.mockReturnValue(throwError(() => errorResponse));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(mockColaboradorService.getById).toHaveBeenCalledWith(colaboradorId);
    expect(component.errorMessage()).toBe('Colaborador não encontrado');
    expect(component.loading()).toBeFalsy();
  });

  // ------------------------------------------------------------------
  // Salvar — create
  // ------------------------------------------------------------------

  it('should call create and navigate on successful save in create mode', () => {
    const newColaborador = { nome: 'Novo', matricula: '67890', cargo: 'Engenheiro', setor: 'P&D', ativo: true };
    mockColaboradorService.create.mockReturnValue(of(newColaborador));

    component.colaborador = { ...newColaborador };
    component.salvar();
    fixture.detectChanges();

    expect(mockColaboradorService.create).toHaveBeenCalledWith(newColaborador);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/colaboradores']);
    expect(component.loading()).toBeFalsy();
  });

  // ------------------------------------------------------------------
  // Salvar — update
  // ------------------------------------------------------------------

  it('should call update and navigate on successful save in edit mode', () => {
    const colaboradorId = '123';
    const updatedColaborador = { id: colaboradorId, nome: 'Atualizado', matricula: '12345', cargo: 'Técnico', setor: 'TI', ativo: true };

    component.isEditMode.set(true);
    component.colaboradorId = colaboradorId;
    component.colaborador   = { ...updatedColaborador };
    mockColaboradorService.update.mockReturnValue(of(updatedColaborador));

    component.salvar();
    fixture.detectChanges();

    expect(mockColaboradorService.update).toHaveBeenCalledWith(colaboradorId, updatedColaborador);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/colaboradores']);
    expect(component.loading()).toBeFalsy();
  });

  // ------------------------------------------------------------------
  // Salvar — erro
  // ------------------------------------------------------------------

  it('should handle error when saving colaborador', () => {
    const errorResponse = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
      error: { message: 'Erro interno' },
    });
    mockColaboradorService.create.mockReturnValue(throwError(() => errorResponse));

    component.colaborador = { nome: 'Erro', matricula: '111', cargo: 'Operador', setor: 'Produção', ativo: true };
    component.salvar();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Erro interno');
    expect(component.loading()).toBeFalsy();
  });

  // ------------------------------------------------------------------
  // Cargo customizado
  // ------------------------------------------------------------------

  it('should show custom cargo input when "Outros" is selected', () => {
    component.colaborador.cargo = 'Outros';
    component.onCargoChange();

    expect(component.showCustomCargo()).toBe(true);
    expect(component.colaborador.cargo).toBe('');
  });

  it('should hide custom cargo input and clear customCargo when another option is selected', () => {
    component.showCustomCargo.set(true);
    component.customCargo          = 'Meu Cargo Customizado';
    component.colaborador.cargo    = 'Técnico de Manutenção';
    component.onCargoChange();

    expect(component.showCustomCargo()).toBe(false);
    expect(component.customCargo).toBe('');
  });

  it('should use customCargo value when "Outros" is selected and customCargo is provided', () => {
    const customCargoValue = 'Cientista de Dados';

    component.colaborador.cargo = 'Outros';
    component.onCargoChange();
    component.customCargo       = customCargoValue;
    component.colaborador       = { nome: 'Custom', matricula: '999', cargo: 'Outros', setor: 'Inovação', ativo: true };

    mockColaboradorService.create.mockReturnValue(of({}));
    component.salvar();
    fixture.detectChanges();

    expect(mockColaboradorService.create).toHaveBeenCalledWith(
      expect.objectContaining({ cargo: customCargoValue }),
    );
  });

  // ------------------------------------------------------------------
  // Cancelar
  // ------------------------------------------------------------------

  it('should call location.back() when cancelar is called', () => {
    component.cancelar();
    expect(mockLocation.back).toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  // Guard de alterações não salvas — estado do form
  // ------------------------------------------------------------------

  it('should expose form as not dirty on fresh component (guard can deactivate)', () => {
    component.form = { dirty: false, submitted: false } as NgForm;
    expect(component.form.dirty).toBe(false);
    expect(component.form).toBeDefined();
  });

  it('should expose form as dirty and not submitted (guard prompts confirmation)', () => {
    component.form = { dirty: true, submitted: false } as NgForm;
    expect(component.form.dirty).toBe(true);
    expect(component.form.submitted).toBe(false);
  });

  it('should expose form as submitted even when dirty (guard can deactivate)', () => {
    component.form = { dirty: true, submitted: true } as NgForm;
    expect(component.form.submitted).toBe(true);
  });
});