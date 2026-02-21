import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FluxogramaService, DisciplinaFluxogramaDTO } from './fluxograma-service';
import { environment } from '../../environments/environment';

describe('FluxogramaService', () => {
  let service: FluxogramaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FluxogramaService,
        provideHttpClient(),
        provideHttpClientTesting(), // Mock das requisições HTTP
      ],
    });

    service = TestBed.inject(FluxogramaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Garante que nenhuma requisição ficou pendente entre os testes
  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve buscar os dados do fluxograma via GET', () => {
    const mockData: DisciplinaFluxogramaDTO[] = [
      {
        codigo: 'MAT101',
        nome: 'Cálculo I',
        periodo: 1,
        creditos: 4,
        status_historico: 'APROVADO',
        nota_final: 9.5,
        grupos_requisitos: []
      }
    ];

    service.getFluxograma().subscribe((data) => {
      expect(data.length).toBe(1);
      expect(data).toEqual(mockData);
    });

    // Verifica se a URL chamada está correta
    const req = httpMock.expectOne(`${environment.apiUrl}/fluxograma`);
    expect(req.request.method).toBe('GET');

    // Responde a requisição com os dados mockados
    req.flush(mockData);
  });
});