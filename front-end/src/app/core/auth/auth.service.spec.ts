import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AuthService (Teste Unitário Automatizado)', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Simula o módulo de rede para não dar erro
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  it('deve garantir que o mapeamento de dados trate campos ausentes como string vazia', () => {
    // Simulamos um JSON de login exatamente como veio da VPS (sem matricula/setor)
    const mockResponse = {
      user: {
        id: 'uuid-teste-123',
        nome: 'Eduardo Admin',
        email: 'admin@accesspim.dev',
        cargo: 'ADMIN'
      }
    };

    // Acessamos o método de mapeamento privado
    const resultado = (service as any).mapAuthUser(mockResponse);

    // VALIDAÇÕES (O que o professor quer ver)
    expect(resultado.id).toBe('uuid-teste-123');
    expect(resultado.nome).toBe('Eduardo Admin');
    
    // Testamos se a lógica de prevenção de erro (|| '') funcionou
    expect(resultado.matricula).toBe(''); 
    expect(resultado.setor).toBe('');
  });
});