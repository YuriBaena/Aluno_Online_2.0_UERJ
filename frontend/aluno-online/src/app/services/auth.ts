import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  
  // A URL agora vem do arquivo de ambiente selecionado no build
  private readonly API = `${environment.apiUrl}/auth`;

  login(matricula: string, senha: string) {
    return this.http.post<{token: string}>(`${this.API}/login`, { matricula, senha }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
      })
    );
  }

  registrar(aluno: any) {
    return this.http.post(`${this.API}/registrar`, aluno);
  }
}