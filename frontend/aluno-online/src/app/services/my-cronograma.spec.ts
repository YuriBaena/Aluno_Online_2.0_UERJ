import { TestBed } from '@angular/core/testing';

import { MyCronogramaService } from './my-cronograma';

describe('MyCronogramaService', () => {
  let service: MyCronogramaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyCronogramaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
