import { TestBed } from '@angular/core/testing';

import { Sincroniza } from './sincroniza';

describe('Sincroniza', () => {
  let service: Sincroniza;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sincroniza);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
