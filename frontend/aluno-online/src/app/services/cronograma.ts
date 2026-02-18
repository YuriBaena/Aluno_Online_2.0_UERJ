import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CronRequest } from '../pages/cronograma/cronograma';

export interface CronInfo{
  nome: string,
  criado_em: string
}

@Injectable({
  providedIn: 'root',
})
export class CronogramaService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/cronograma`;

  saveCron(req: CronRequest): Observable<void> {
    return this.http.post<void>(`${this.API}/save`, req);
  }

  deleteCron(nome: string): Observable<void> {
    const params = new HttpParams().set('nome', nome);
    return this.http.delete<void>(`${this.API}/delete`, { params });
  }

  getCronByNome(nome: string): Observable<CronRequest> {
    return this.http.get<CronRequest>(`${this.API}/nome/${nome}`);
  }

  listNomesCronogramas(): Observable<CronInfo[]> {
    return this.http.get<CronInfo[]>(this.API);
  }
}