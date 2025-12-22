import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  
  // Mude para o caminho base do seu Resource
  private readonly API = 'http://localhost:8080/auth';

  login(matricula: string, senha: string) {
    // Agora apontamos para /auth/login
    return this.http.post<{token: string}>(`${this.API}/login`, { matricula, senha }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
      })
    );
  }

  registrar(aluno: any) {
    // Agora apontamos para /auth/registrar (ajuste para bater com o Java)
    return this.http.post(`${this.API}/register`, aluno);
  }
}