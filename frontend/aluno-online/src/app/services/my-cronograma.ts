import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Disciplina } from '../pages/my-cronograma/my-cronograma';

@Injectable({
  providedIn: 'root',
})
export class MyCronogramaService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/my-cron`;

  buscar(busca: string): Observable<Disciplina[]> {
    const params = new HttpParams().set('busca', busca);
    return this.http.get<Disciplina[]>(`${this.API}`, { params });
  }

  pegaPorPeriodo(busca: number): Observable<Disciplina[]> {
    const params = new HttpParams()
    return this.http.get<Disciplina[]>(`${this.API}/periodo/${busca}`, { params });
  }

  pegaNumPeriodos(): Observable<number> {
    const params = new HttpParams()
    return this.http.get<number>(`${this.API}/numero-de-periodos`, { params });
  }
}
