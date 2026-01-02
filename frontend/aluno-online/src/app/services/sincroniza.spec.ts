import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SincronizaService } from './sincroniza';

describe('SincronizaService', () => {
  let service: SincronizaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SincronizaService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(SincronizaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});