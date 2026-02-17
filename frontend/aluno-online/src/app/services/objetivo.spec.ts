import { TestBed } from '@angular/core/testing';

import { ObjetivoService } from './objetivo';

describe('Objetivo', () => {
  let service: ObjetivoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjetivoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
