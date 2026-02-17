import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ObjetivoService } from './objetivo';

describe('ObjetivoService', () => {
  let service: ObjetivoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ObjetivoService,           // Provide the service itself
        provideHttpClient(),       // Provide the actual HttpClient
        provideHttpClientTesting() // Provide the testing backend to mock requests
      ]
    });
    service = TestBed.inject(ObjetivoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});