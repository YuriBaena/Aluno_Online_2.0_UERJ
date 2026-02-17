import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cronograma } from './cronograma';
import { CronogramaService } from '../../services/cronograma';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('Cronograma Component', () => {
  let component: Cronograma;
  let fixture: ComponentFixture<Cronograma>;
  let cronServiceSpy: jasmine.SpyObj<CronogramaService>;

  beforeEach(async () => {
    // 1. Criamos o Spy com os métodos que o componente usa
    const spy = jasmine.createSpyObj('CronogramaService', [
      'listNomesCronogramas', 
      'getCronByNome', 
      'deleteCron'
    ]);

    // 2. Simulamos retornos padrão para evitar erros de 'undefined'
    spy.listNomesCronogramas.and.returnValue(of([{ nome: 'Cronograma Teste', criadoEm: '2026/1' }]));
    spy.getCronByNome.and.returnValue(of({ nome_cronograma: 'Teste', disciplinas: [] }));

    await TestBed.configureTestingModule({
      imports: [Cronograma],
      providers: [
        { provide: CronogramaService, useValue: spy },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    cronServiceSpy = TestBed.inject(CronogramaService) as jasmine.SpyObj<CronogramaService>;
    fixture = TestBed.createComponent(Cronograma);
    component = fixture.componentInstance;
    
    // O detectChanges executa o ngOnInit
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar a lista de nomes ao iniciar e selecionar o primeiro', () => {
    expect(cronServiceSpy.listNomesCronogramas).toHaveBeenCalled();
    expect(cronServiceSpy.getCronByNome).toHaveBeenCalledWith('Cronograma Teste');
    expect(component.nomesCronogramas.length).toBe(1);
  });
});