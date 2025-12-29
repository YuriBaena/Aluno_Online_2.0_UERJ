import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UsuarioToken } from '../../services/auth';

@Component({
  selector: 'app-aluno',
  imports: [CommonModule],
  templateUrl: './aluno.html',
  styleUrl: './aluno.scss',
})
export class Aluno implements OnInit {

  usuario: UsuarioToken | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.usuario = this.auth.getUsuario();
  }
}
