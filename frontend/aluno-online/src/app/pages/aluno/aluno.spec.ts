import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Aluno } from './aluno';

describe('Aluno', () => {
  let component: Aluno;
  let fixture: ComponentFixture<Aluno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Aluno]
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
