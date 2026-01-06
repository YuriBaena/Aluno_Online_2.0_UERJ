import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AlunoService } from '../services/aluno';

describe('Aluno', () => {
  let service: AlunoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Adicionamos os provedores de HttpClient para o ambiente de teste
      providers: [
        AlunoService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AlunoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});