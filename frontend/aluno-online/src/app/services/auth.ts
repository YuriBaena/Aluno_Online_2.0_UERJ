import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';

// Definimos a estrutura do seu usuário para todo o app
export interface UsuarioToken {
  sub: string;
  nome: string;
  email: string;
  periodo_inicio: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/auth`;

  login(matricula: string, senha: string) {
    return this.http.post<{ token: string }>(`${this.API}/login`, { matricula, senha }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
      })
    );
  }

  registrar(aluno: any) {
    return this.http.post(`${this.API}/registrar`, aluno);
  }

  /**
   * Pega o usuário decodificado do localStorage.
   * Centraliza a lógica de extração das 5 propriedades.
   */
  getUsuario(): UsuarioToken | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return {
        sub: decoded.sub,
        nome: decoded.nome,
        email: decoded.email,
        periodo_inicio: decoded.periodo_inicio,
        role: decoded.role
      };
    } catch (error) {
      console.error('Token inválido ou mal formatado', error);
      return null;
    }
  }

  /**
   * Método rápido para verificar se é Admin.
   * Facilita o uso em Guards e templates HTML.
   */
  isAdmin(): boolean {
    const usuario = this.getUsuario();
    return usuario?.role === 'ROLE_ADMIN';
  }

  /**
   * Remove o token e limpa a sessão.
   */
  logout() {
    localStorage.removeItem('token');
  }
}