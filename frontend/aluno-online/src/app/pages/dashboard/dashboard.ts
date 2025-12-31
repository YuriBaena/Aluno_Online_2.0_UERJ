import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, UsuarioToken } from '../../services/auth';
import { SincronizaService } from '../../services/sincroniza';

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

  constructor(private service: AuthService, private sincronizaService: SincronizaService) {}

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
    // 1. Validações iniciais (mantidas)
    if (!this.syncData.matricula || !this.syncData.senha) {
      alert('Por favor, preencha a matrícula e a senha do portal antigo.');
      return;
    }

    const matriculaValida = /^\d{12}$/.test(this.syncData.matricula);
    if (!matriculaValida) {
      alert('A matrícula deve conter exatamente 12 números.');
      return;
    }

    // 2. Inicia o estado de carregamento
    this.loadingSync = true;

    // 3. Prepara o DTO (Mapeando matricula -> login para o Java)
    const dadosParaEnvio = {
      login: this.syncData.matricula,
      senha: this.syncData.senha
    };

    // 4. Chama o serviço
    this.sincronizaService.sincronizaDados(dadosParaEnvio).subscribe({
      next: (res) => {
        // Sucesso: Resposta do ResponseEntity.ok()
        this.loadingSync = false;
        alert(res.message || 'Sincronização realizada com sucesso!');
        this.fecharModalSync();
        
        // Opcional: Atualizar a data da última sincronização na tela
        const agora = new Date();
        this.ultimaSincronizacao = agora.toLocaleString('pt-BR');
      },
      error: (msgErro) => {
        // Erro: Mapeado pelo catchError do service (401, 503, etc)
        this.loadingSync = false;
        alert(msgErro); // Mostra a mensagem amigável: "Senha incorreta", "Portal UERJ fora", etc.
      }
    });
  }
}