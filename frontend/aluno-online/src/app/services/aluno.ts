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

export interface Aula {
  codigo: string;
  disciplina: string;
  professor: string;
  diaSemana: 'Domingo' | 'Segunda' | 'Terca' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sabado';
  codigo_hora: string;
  hora: string;
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

  getAulasHoje(dia_Semana: string): Observable<Array<Aula>> {
    const params = { diaSemana: dia_Semana }; 

    return this.http.get<Array<Aula>>(`${this.API}/aulas_hoje`, { params });
  }
}