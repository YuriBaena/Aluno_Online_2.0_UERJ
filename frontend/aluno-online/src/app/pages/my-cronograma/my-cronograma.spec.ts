import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCronograma } from './my-cronograma';

describe('MyCronograma', () => {
  let component: MyCronograma;
  let fixture: ComponentFixture<MyCronograma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCronograma]
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
