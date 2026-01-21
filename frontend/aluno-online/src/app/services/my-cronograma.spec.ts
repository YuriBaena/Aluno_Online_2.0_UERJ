import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MyCronogramaService } from './my-cronograma';

describe('MyCronogramaService', () => {
  let service: MyCronogramaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MyCronogramaService,
        provideHttpClient(),        // Adicione isso
        provideHttpClientTesting() // Adicione isso
      ]
    });
    service = TestBed.inject(MyCronogramaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});