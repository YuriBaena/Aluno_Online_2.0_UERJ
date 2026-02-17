import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetaAcademica } from './meta-academica';
import { ObjetivoService } from '../../services/objetivo';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('MetaAcademica', () => {
  let component: MetaAcademica;
  let fixture: ComponentFixture<MetaAcademica>;
  let objetivoServiceSpy: jasmine.SpyObj<ObjetivoService>;

  beforeEach(async () => {
    // 1. Criamos o Spy com os métodos EXATOS que o componente usa agora
    const spy = jasmine.createSpyObj('ObjetivoService', [
      'getDadosIniciais', 
      'listarAvaliacoes', 
      'criar', 
      'atualizar', 
      'excluir'
    ]);

    // 2. Mock dos retornos para evitar erros de .subscribe() no ngOnInit
    // Simulamos um retorno básico para o 'getDadosIniciais'
    spy.getDadosIniciais.and.returnValue(of({
      cr: 8.5,
      creditosFeitos: 100,
      disciplinas: []
    }));

    // Simulamos um retorno vazio para a listagem inicial de avaliações
    spy.listarAvaliacoes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MetaAcademica],
      providers: [
        { provide: ObjetivoService, useValue: spy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MetaAcademica);
    component = fixture.componentInstance;
    objetivoServiceSpy = TestBed.inject(ObjetivoService) as jasmine.SpyObj<ObjetivoService>;
    
    // O detectChanges() executa o ngOnInit do componente
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar dados iniciais no ngOnInit', () => {
    expect(objetivoServiceSpy.getDadosIniciais).toHaveBeenCalled();
  });

  it('deve calcular corretamente a média ponderada (current average)', () => {
    component.assessments = [
      { id: 1, codigo_disciplina: 'D1', nome: 'P1', tipo: 'Prova', peso: 40, nota: 10, data: '' },
      { id: 2, codigo_disciplina: 'D1', nome: 'P2', tipo: 'Prova', peso: 60, nota: 5, data: '' }
    ];
    
    // Média: (10 * 0.4) + (5 * 0.6) = 4 + 3 = 7
    // Como a função multiplica por 100/totalWeight: (7 / 100) * 100 = 7
    expect(component.calculateCurrentAverage()).toBe(7);
  });
});