import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CronRequest } from '../pages/cronograma/cronograma';

@Injectable({
  providedIn: 'root',
})
export class CronogramaService {
  private http = inject(HttpClient);
  // Importante: no seu Controller está @RequestMapping("/cronograma")
  private readonly API = `${environment.apiUrl}/cronograma`;

  /**
   * Salva um novo cronograma (POST)
   */
  saveCron(req: CronRequest): Observable<void> {
    return this.http.post<void>(`${this.API}/save`, req);
  }

  /**
   * Deleta um cronograma pelo nome (DELETE com Query Param)
   */
  deleteCron(nome: string): Observable<void> {
    // Como no Spring usamos @RequestParam, passamos via HttpParams (?nome=...)
    const params = new HttpParams().set('nome', nome);
    return this.http.delete<void>(`${this.API}/delete`, { params });
  }

  /**
   * Busca um cronograma específico (GET com Path Variable)
   */
  getCronByNome(nome: string): Observable<CronRequest> {
    return this.http.get<CronRequest>(`${this.API}/nome/${nome}`);
  }

  /**
   * Lista apenas os nomes dos cronogramas do aluno (GET)
   */
  listNomesCronogramas(): Observable<string[]> {
    return this.http.get<string[]>(this.API);
  }
}