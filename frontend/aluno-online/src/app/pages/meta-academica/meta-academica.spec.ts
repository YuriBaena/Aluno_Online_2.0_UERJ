import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaAcademica } from './meta-academica';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('MetaAcademica', () => {
  let component: MetaAcademica;
  let fixture: ComponentFixture<MetaAcademica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetaAcademica],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
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
