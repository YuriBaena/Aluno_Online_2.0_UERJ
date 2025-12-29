import { Component, OnInit } from '@angular/core'; // Importe OnInit
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { Aluno } from '../aluno/aluno';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true, // Certifique-se de que é standalone se estiver usando imports diretos
  imports: [CommonModule, Aluno],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  // Criamos uma variável para segurar os dados do usuário na Home
  dadosUsuario: any = null;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Pegamos os dados decodificados do seu serviço
    this.dadosUsuario = this.auth.getUsuario();
  }

  novoAluno() {
    this.router.navigate(['/registrar']);
  }

  isAdmin(): boolean {
    return this.auth.isAdmin();
  }
}