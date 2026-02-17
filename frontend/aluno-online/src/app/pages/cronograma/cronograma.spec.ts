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
    // Criamos um "espião" para simular o serviço
    const spy = jasmine.createSpyObj('CronogramaService', ['listNomesCronogramas', 'getCronByNome']);

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar a lista de nomes ao iniciar', () => {
    expect(cronServiceSpy.listNomesCronogramas).toHaveBeenCalled();
    expect(component.nomesCronogramas.length).toBeGreaterThan(0);
  });
});