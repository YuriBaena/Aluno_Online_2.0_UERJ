import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RequisitoGrupoDTO {
  id_grupo: number;
  disciplinas: string[];
}

export interface DisciplinaFluxogramaDTO {
  codigo: string;
  nome: string;
  periodo: number;
  creditos: number;
  status_historico: string | null;
  nota_final: number | null;
  grupos_requisitos: RequisitoGrupoDTO[];
}

@Injectable({
  providedIn: 'root',
})
export class FluxogramaService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/fluxograma`;

  /**
   * Obtém a lista completa de disciplinas do curso do aluno logado
   * formatada para a exibição no fluxograma.
   */
  getFluxograma(): Observable<DisciplinaFluxogramaDTO[]> {
    return this.http.get<DisciplinaFluxogramaDTO[]>(this.API);
  }
}