import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Fluxograma } from './fluxograma';
import { FluxogramaService } from '../../services/fluxograma-service';
import { of } from 'rxjs';

describe('Fluxograma', () => {
  let component: Fluxograma;
  let fixture: ComponentFixture<Fluxograma>;
  
  const mockFluxogramaService = {
    getFluxograma: jasmine.createSpy('getFluxograma').and.returnValue(of([
      { 
        codigo: 'MAT101', 
        nome: 'Cálculo I', 
        periodo: 1, 
        grupos_requisitos: [] 
      },
      { 
        codigo: 'MAT102', 
        nome: 'Cálculo II', 
        periodo: 2, 
        grupos_requisitos: [{ disciplinas: ['MAT101'] }] 
      }
    ]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fluxograma],
      providers: [
        { provide: FluxogramaService, useValue: mockFluxogramaService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Fluxograma);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('deve processar disciplinas e períodos ao iniciar', fakeAsync(() => {
    fixture.detectChanges(); // Dispara ngOnInit
    
    // Avança o tempo para os setTimeouts de 600ms no ngOnInit
    tick(600);
    
    expect(component.disciplinas().length).toBe(2);
    expect(component.periodosOrdenados()).toEqual([1, 2]);
  }));

  it('deve calcular a cadeia de requisitos ao clicar em uma disciplina', () => {
    fixture.detectChanges();
    
    // Clica na disciplina que tem pré-requisito
    component.onDisciplinaClick('MAT102');
    
    const highlighted = component.highlightedIds();
    expect(highlighted.has('MAT102')).toBe(true);
    expect(highlighted.has('MAT101')).toBe(true); // O requisito deve estar no Set
    expect(component.activeId()).toBe('MAT102');
  });

  it('deve limpar o destaque ao clicar na mesma disciplina novamente', () => {
    fixture.detectChanges();
    
    component.onDisciplinaClick('MAT101');
    component.onDisciplinaClick('MAT101'); // Segundo clique limpa
    
    expect(component.activeId()).toBeNull();
    expect(component.highlightedIds().size).toBe(0);
  });

  it('deve identificar corretamente se uma disciplina deve ficar esmaecida (dimmed)', () => {
    fixture.detectChanges();
    
    component.onDisciplinaClick('MAT101');
    
    // MAT101 está ativa, MAT102 não faz parte da cadeia de MAT101 (é sucessora, não requisito)
    expect(component.isDimmed('MAT102')).toBe(true);
    expect(component.isDimmed('MAT101')).toBe(false);
  });
});