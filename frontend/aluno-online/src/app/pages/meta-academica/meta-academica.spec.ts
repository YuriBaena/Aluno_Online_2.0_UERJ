import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaAcademica } from './meta-academica';

describe('MetaAcademica', () => {
  let component: MetaAcademica;
  let fixture: ComponentFixture<MetaAcademica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetaAcademica]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetaAcademica);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
