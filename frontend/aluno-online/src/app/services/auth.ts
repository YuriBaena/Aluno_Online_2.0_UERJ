import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';

/**
 * Interface que representa os dados contidos no Payload do JWT.
 * sub: ID único (UUID) do aluno no banco de dados.
 * matricula: Número da matrícula (pode mudar via scraper, por isso não é o 'sub').
 */
export interface UsuarioToken {
  sub: string;           // UUID do Aluno
  matricula: number;     // Matrícula atual
  nome: string;
  email: string;
  periodo_inicio: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/auth`;

  /**
   * Realiza o login enviando as credenciais iniciais.
   * O backend deve retornar um token cujo 'subject' é o UUID do aluno.
   */
  login(matricula: string, senha: string) {
    return this.http.post<{ token: string }>(`${this.API}/login`, { matricula, senha }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
      })
    );
  }

  /**
   * Realiza o cadastro de um novo aluno.
   */
  registrar(aluno: any) {
    return this.http.post(`${this.API}/registrar`, aluno);
  }

  /**
   * Pega o usuário decodificado do localStorage.
   * Agora mapeia corretamente o UUID (sub) e a Matrícula (claim extra).
   */
  getUsuario(): UsuarioToken | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      
      return {
        sub: decoded.sub,                   // O UUID vindo do Java
        matricula: decoded.matricula,       // A claim extra que adicionamos
        nome: decoded.nome,
        email: decoded.email,
        periodo_inicio: decoded.periodo_inicio,
        role: decoded.role
      };
    } catch (error) {
      console.error('Token inválido ou mal formatado', error);
      this.logout(); // Limpa o lixo se o token estiver corrompido
      return null;
    }
  }

  /**
   * Verifica se o usuário tem permissão de administrador.
   */
  isAdmin(): boolean {
    const usuario = this.getUsuario();
    // Verifica se a role contém ADMIN (ajuste conforme seu Enum no Java)
    return usuario?.role === 'ROLE_ADMIN' || usuario?.role === 'ADMIN';
  }

  /**
   * Verifica se existe um token guardado.
   */
  isAutenticado(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Remove o token e limpa a sessão.
   */
  logout() {
    localStorage.removeItem('token');
  }
}