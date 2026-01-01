import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

export interface SincronizaDTO {
  login: string;
  senha: string;
}

// Interface para tipar a resposta da nossa VIEW do banco
export interface StatusSincronizacaoResponse {
  status_sinc: 'PENDENTE' | 'PROCESSANDO' | 'COMPLETO' | 'ERRO';
  detalhes: string;
  data_inicio: string;
  data_fim?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SincronizaService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/sync`;

  sincronizaDados(dto: SincronizaDTO) {
    return this.http.post<any>(this.API, dto);
  }

  /**
   * Consulta a VIEW v_status_sincronizacao_atual
   */
  verificarStatus(): Observable<StatusSincronizacaoResponse> {
    // Não precisamos passar o login, o Spring Security identifica o aluno pelo Token JWT
    return this.http.get<StatusSincronizacaoResponse>(`${this.API}/status`);
  }

  /**
 * Busca a data da última sincronização.
 * Não precisamos passar o login, o Spring Security identifica o aluno pelo Token JWT.
 */
  getUltimaSincronizacao(): Observable<string | null> {
    return this.http.get<{ ultima_sinc: string }>(`${this.API}/ultima`).pipe(
      // Se a string vier vazia do backend, transformamos em null para facilitar o tratamento
      map(res => res.ultima_sinc !== "" ? res.ultima_sinc : null)
    );
  }

}