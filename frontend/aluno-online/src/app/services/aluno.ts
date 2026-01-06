import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface StatsAluno {
  cr: number;
  creditosFeitos: number;
  totalCreditos: number;
  progressoCurso: number;
  discplinasAndamento: number;
}

@Injectable({
  providedIn: 'root',
})
export class AlunoService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/aluno`;

  getStats(): Observable<StatsAluno> {
    return this.http.get<StatsAluno>(`${this.API}/stats`);
  }
}