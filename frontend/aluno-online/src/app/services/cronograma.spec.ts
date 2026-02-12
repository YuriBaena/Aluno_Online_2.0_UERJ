import { TestBed } from '@angular/core/testing';

import { Cronograma } from './cronograma';

describe('Cronograma', () => {
  let service: Cronograma;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cronograma);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
