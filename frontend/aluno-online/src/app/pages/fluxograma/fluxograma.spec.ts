import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fluxograma } from './fluxograma';

describe('Fluxograma', () => {
  let component: Fluxograma;
  let fixture: ComponentFixture<Fluxograma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fluxograma]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fluxograma);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
