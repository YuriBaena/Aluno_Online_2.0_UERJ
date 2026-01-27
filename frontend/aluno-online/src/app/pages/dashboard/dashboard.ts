import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, UsuarioToken } from '../../services/auth';
import { SincronizaService } from '../../services/sincroniza';
import { AlunoService, Aula, StatsAluno } from '../../services/aluno';
import { interval, Subscription, switchMap, takeWhile } from 'rxjs';

export interface AulaAgrupada {
  disciplina: string;
  professor: string;
  horarios: string[]; // Ex: ["M1", "M2"]
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit, OnDestroy {
  usuario: UsuarioToken | null = null;

  statsAluno: StatsAluno | null = null;

  lista_aulas_hoje: Array<Aula> | null = null;
  aulasAgrupadas: Array<AulaAgrupada> = [];

  ultimaSincronizacao: string | null = null;

  exibirModalSync = false;
  loadingSync = false;
  syncFull = false;
  
  mensagemErro: string | null = null;
  mensagemSucesso: string | null = null;
  statusTexto: string = 'Iniciando...'; // Para mostrar o que o back-end está fazendo

  syncData = { matricula: '', senha: '' };

  termosAceitos = false;
  mostrarDetalhes = false;
  
  private statusSubscription?: Subscription;

  constructor(private service: AuthService, private sincronizaService: SincronizaService, private alunoService : AlunoService) {}

  ngOnInit(): void {
    this.usuario = this.service.getUsuario();
    this.carregarUltimaSinc();
    this.alunoService.getStats().subscribe((resp: StatsAluno)=>{this.statsAluno = resp});
    this.alunoService.getAulasHoje(this.getDiaSemana()).subscribe((resp: Array<Aula>)=>{
      this.lista_aulas_hoje = resp
      this.agruparAulas();
    })
  }

  carregarUltimaSinc() {
    this.sincronizaService.getUltimaSincronizacao().subscribe({
      next: (data) => {
        this.ultimaSincronizacao = data ? new Date(data).toLocaleString('pt-BR') : 'Nunca';
      },
      error: () => this.ultimaSincronizacao = 'Nunca'
    });
  }
  ngOnDestroy(): void {
    this.pararVerificacao();
  }

  abrirModalSync() {
    this.exibirModalSync = true;
  }

  fecharModalSync() {
    if (this.loadingSync) {
      this.exibirModalSync = false;
    } else {
      this.exibirModalSync = false;
      this.syncData = { matricula: '', senha: '' };
      this.mensagemErro = null;
      this.mensagemSucesso = null;
      
      // ADICIONE ESTAS LINHAS PARA RESETAR O ESTADO:
      this.termosAceitos = false;
      this.mostrarDetalhes = false;
    }
  }

  confirmarSincronizacao(full: boolean = false) {
    this.syncFull = full;
    this.mensagemErro = null;
    this.mensagemSucesso = null;

    if (!this.termosAceitos) {
      this.mensagemErro = 'Você precisa aceitar os termos para prosseguir.';
      return;
    }

    if (!this.syncData.matricula || !this.syncData.senha) {
      this.mensagemErro = 'Preencha todos os campos.';
      return;
    }

    this.loadingSync = true;
    this.statusTexto = 'Enviando credenciais...';

    // 1. Chama o serviço para iniciar
    this.sincronizaService.sincronizaDados({
      login: this.syncData.matricula,
      senha: this.syncData.senha,
      full: this.syncFull
    }).subscribe({
      next: () => {
        // 2. Se o início deu certo, começa a monitorar o andamento
        this.iniciarAcompanhamento();
      },
      error: (err) => {
        this.loadingSync = false;
        this.mensagemErro = err;
      }
    });
  }

  iniciarAcompanhamento() {
    this.statusTexto = 'Sincronizando dados do portal...';
    
    // Cancela qualquer subscrição anterior por segurança
    this.pararVerificacao();

    // 3. Polling: Verifica a cada 10 segundos
    this.statusSubscription = interval(10000).pipe(
      switchMap(() => this.sincronizaService.verificarStatus()),
      // Para o loop quando loadingSync for false (definido no next ou error)
      takeWhile(() => this.loadingSync)
    ).subscribe({
      next: (res: any) => {
        // Exemplo de resposta: { status: 'COMPLETO' | 'PROCESSANDO' | 'ERRO', message: '...' }
        this.statusTexto = res.detalhes || 'Sincronizando...';

        if (res.status_sinc === 'COMPLETO') {
          this.finalizarSucesso(res.detalhes);
        } else if (res.status_sinc === 'ERRO') {
          this.finalizarErro(res.detalhes);
        }
      },
      error: (err) => this.finalizarErro('Falha ao verificar status.')
    });
  }

  private finalizarSucesso(msg: string) {
    this.loadingSync = false;
    this.mensagemSucesso = msg || 'Sincronização concluída!';
    this.ultimaSincronizacao = new Date().toLocaleString('pt-BR');
    this.pararVerificacao();
    setTimeout(() => { if (!this.exibirModalSync) return; this.fecharModalSync(); }, 4000);
  }

  private finalizarErro(msg: string) {
    this.loadingSync = false;
    this.mensagemErro = msg;
    this.pararVerificacao();
  }

  private pararVerificacao() {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  private getDiaSemana(): string {
    const dias = [
      'Domingo', 'Segunda', 'Terca', 
      'Quarta', 'Quinta', 'Sexta', 'Sabado'
    ];
    const hoje = new Date();
    return dias[hoje.getDay()];
  }

  private agruparAulas() {
    if (!this.lista_aulas_hoje) return;

    const grupos = this.lista_aulas_hoje.reduce((acc: any, aula) => {
      if (!acc[aula.disciplina]) {
        acc[aula.disciplina] = {
          disciplina: aula.disciplina,
          professor: aula.professor,
          horarios: []
        };
      }
      acc[aula.disciplina].horarios.push(aula.codigo_hora);
      return acc;
    }, {});

    this.aulasAgrupadas = Object.values(grupos);
  }
}