import { TestBed } from '@angular/core/testing';

import { FluxogramaService } from './fluxograma-service';

describe('FluxogramaService', () => {
  let service: FluxogramaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FluxogramaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
