import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule], // Adicione estes dois aqui
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  salvar(dados: any) {
    if (!dados.nome || !dados.matricula || !dados.senhaHash) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    // Chamamos o método de registrar que criamos no AuthService
    this.authService.registrar(dados).subscribe({
      next: () => {
        alert('Cadastro realizado com sucesso! Agora faça seu login.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
        alert('Erro ao cadastrar aluno. Verifique se a matrícula já existe.');
      }
    });
  }
}