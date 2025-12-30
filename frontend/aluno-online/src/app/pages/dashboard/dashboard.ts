import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, UsuarioToken } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit{
  // Dados do Usuário
  usuario: UsuarioToken | null = null; 
  ultimaSincronizacao = '30/12/2025 às 10:20';

  // Controle do Modal e Loading
  exibirModalSync = false;
  loadingSync = false;

  // Objeto para os campos do formulário
  syncData = {
    matricula: '',
    senha: ''
  };

  constructor(private service: AuthService) {}

  ngOnInit(): void {
    // Pega o nome do usuário do serviço AuthService
    this.usuario = this.service.getUsuario();
  }

  abrirModalSync() {
    this.exibirModalSync = true;
  }

  fecharModalSync() {
    if (!this.loadingSync) {
      this.exibirModalSync = false;
      this.syncData = { matricula: '', senha: '' }; // Limpa os campos
    }
  }

  confirmarSincronizacao() {
    // 1. Verifica se os campos estão vazios
    if (!this.syncData.matricula || !this.syncData.senha) {
      alert('Por favor, preencha a matrícula e a senha do portal antigo.');
      return;
    }

    // 2. Verifica se tem exatamente 12 números
    // O regex /^\d{12}$/ garante que sejam apenas dígitos e exatamente 12 caracteres
    const matriculaValida = /^\d{12}$/.test(this.syncData.matricula);

    if (!matriculaValida) {
      alert('A matrícula deve conter exatamente 12 números.');
      return;
    }

    // Se passou nas validações, inicia o loading e a chamada
    this.loadingSync = true;

    // Chama serviço para acionar a Lambda
  }
}