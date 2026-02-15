import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Estados da UI
  exibirSenha = false;
  erroMensagem = '';
  carregando = false;

  toggleSenha(): void {
    this.exibirSenha = !this.exibirSenha;
  }

  /**
   * Limpa a mensagem de erro ao digitar
   */
  limparErro(): void {
    if (this.erroMensagem) {
      this.erroMensagem = '';
    }
  }

  fazerLogin(matricula: string, senha: string): void {
    this.erroMensagem = '';

    if (!matricula || !senha) {
      this.erroMensagem = 'Por favor, preencha todos os campos.';
      return;
    }

    this.carregando = true;

    this.authService.login(matricula, senha).subscribe({
      next: (res) => {
        console.log('Login realizado com sucesso!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.carregando = false;
        this.erroMensagem = err?.error?.message || 'Matrícula ou senha incorretos.';
      },
      complete: () => {
        this.carregando = false;
      }
    });
  }
}