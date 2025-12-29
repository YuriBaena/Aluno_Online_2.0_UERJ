import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http'; // Necessário para o AuthService
import { Aluno } from './aluno';

describe('Aluno', () => {
  let component: Aluno;
  let fixture: ComponentFixture<Aluno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Aluno],
      providers: [
        provideHttpClient() // Fornece o HttpClient para o AuthService injetado no Aluno
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Aluno);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});