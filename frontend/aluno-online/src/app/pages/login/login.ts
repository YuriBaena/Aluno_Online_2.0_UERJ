import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importante para o [type] e {{}}
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

  exibirSenha = false;

  toggleSenha() {
    this.exibirSenha = !this.exibirSenha;
  }

  fazerLogin(matricula: string, senha: string) {
    if (!matricula || !senha) {
      alert('Por favor, preencha matrícula e senha.');
      return;
    }

    this.authService.login(matricula, senha).subscribe({
      next: (res) => {
        console.log('Login realizado com sucesso!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        alert('Falha na autenticação. Verifique seus dados.');
      }
    });
  }
}