import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router'; // 1. Importe o provideRouter
import { MyCronograma } from './my-cronograma';

describe('MyCronograma', () => {
  let component: MyCronograma;
  let fixture: ComponentFixture<MyCronograma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCronograma], 
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]) // 2. Adicione este provedor para resolver o erro do ActivatedRoute
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyCronograma);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});