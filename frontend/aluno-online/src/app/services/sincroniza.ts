import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, throwError } from 'rxjs';

// Ajustado para bater com o Record SyncRequest do Java
export interface SincronizaDTO {
  login: string; // mudei de matricula para login
  senha: string;
}

@Injectable({
  providedIn: 'root'
})
export class SincronizaService {
  private http = inject(HttpClient);
  
  // Ajustado para bater com o @RequestMapping("/sync") do Java
  private readonly API = `${environment.apiUrl}/sync`;

  /**
   * Dispara a sincronização. 
   * Note que o Java retorna um JSON { "message": "..." } ou { "error": "..." }
   */
  sincronizaDados(dto: SincronizaDTO) {
    return this.http.post<any>(this.API, dto).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ocorreu um erro inesperado.';
        
        if (error.error && error.error.error) {
          // Captura a mensagem que enviamos no Map.of("error", e.getMessage())
          errorMessage = error.error.error;
        }

        // Retorna o erro para o componente tratar (ex: mostrar um Toast)
        return throwError(() => errorMessage);
      })
    );
  }
}