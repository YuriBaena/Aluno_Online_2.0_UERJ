import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CronogramaService } from './cronograma';

describe('CronogramaService', () => {
  let service: CronogramaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CronogramaService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CronogramaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Garante que não fiquem requisições pendentes entre os testes
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});