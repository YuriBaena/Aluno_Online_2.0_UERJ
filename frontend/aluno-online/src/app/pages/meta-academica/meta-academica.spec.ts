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
    // 1. Criamos um "Spy" (espião) para simular o serviço e seus métodos
    const spy = jasmine.createSpyObj('ObjetivoService', ['getResumo', 'getAvaliacoes']);

    // 2. Configuramos o Spy para retornar um Observable vazio (evita o erro de .subscribe())
    spy.getResumo.and.returnValue(of([]));
    spy.getAvaliacoes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MetaAcademica],
      providers: [
        { provide: ObjetivoService, useValue: spy }, // Substitui o serviço real pelo mock
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MetaAcademica);
    component = fixture.componentInstance;
    objetivoServiceSpy = TestBed.inject(ObjetivoService) as jasmine.SpyObj<ObjetivoService>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});