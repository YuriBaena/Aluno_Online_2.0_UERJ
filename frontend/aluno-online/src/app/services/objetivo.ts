import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AvaliacaoDTO {
  id?: number;
  nome: string;
  codigo_disciplina: string;
  tipo: string;
  peso: number;
  nota: number | null;
  data: string;
}

export interface ResumoDisciplina {
  nome: string;
  codigo: string;
  creditos: number;
}

export interface DadosAluno {
  disciplinas: ResumoDisciplina[];
  cr: number;
  creditosFeitos: number;
}

@Injectable({
  providedIn: 'root',
})
export class ObjetivoService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/objetivo`;

  /**
   * Busca as estatísticas do aluno e a lista de disciplinas em andamento
   */
  getDadosIniciais(): Observable<DadosAluno> {
    return this.http.get<DadosAluno>(`${this.API}/dados`);
  }

  /**
   * Lista as avaliações com filtros opcionais
   */
  listarAvaliacoes(codigo_disciplina?: string, sort: string = 'data_agendada', dir: string = 'desc'): Observable<AvaliacaoDTO[]> {
    let params = new HttpParams().set('sort', sort).set('dir', dir);
    
    if (codigo_disciplina) {
      params = params.set('codigo_disciplina', codigo_disciplina);
    }

    return this.http.get<AvaliacaoDTO[]>(this.API, { params });
  }

  /**
   * Cria uma nova avaliação
   */
  criar(avaliacao: AvaliacaoDTO): Observable<AvaliacaoDTO> {
    return this.http.post<AvaliacaoDTO>(this.API, avaliacao);
  }

  /**
   * Atualiza uma avaliação existente
   */
  atualizar(id: number, avaliacao: AvaliacaoDTO): Observable<AvaliacaoDTO> {
    return this.http.put<AvaliacaoDTO>(`${this.API}/${id}`, avaliacao);
  }

  /**
   * Remove uma avaliação
   */
  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}