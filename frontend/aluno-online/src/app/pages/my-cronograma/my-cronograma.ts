import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MyCronogramaService } from '../../services/my-cronograma'; // Ajuste o caminho conforme seu projeto
import { Subject, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

// --- Interfaces ---
export interface Horario {
  dia: string;
  hora_codigo: string;
}

export interface Turma {
  id: number;
  nome: string;
  professor: string;
  horario: Horario[];
  vagas: number;
}

export interface Disciplina {
  codigo: string;
  nome: string;
  periodo: number;
  selectedTurmaId?: number;
  turmas: Turma[];
}

@Component({
  selector: 'app-my-cronograma',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-cronograma.html',
  styleUrl: './my-cronograma.scss',
})
export class MyCronograma implements OnInit, OnDestroy {
  private cronogramaService = inject(MyCronogramaService);

  listaHorariosDefinidos = [
    { codigo: 'M1', intervalo: '07:00 - 07:50' },
    { codigo: 'M2', intervalo: '07:50 - 08:40' },
    { codigo: 'M3', intervalo: '08:50 - 09:40' },
    { codigo: 'M4', intervalo: '09:40 - 10:30' },
    { codigo: 'M5', intervalo: '10:40 - 11:30' },
    { codigo: 'M6', intervalo: '11:30 - 12:20' },
    { codigo: 'T1', intervalo: '12:30 - 13:20' },
    { codigo: 'T2', intervalo: '13:20 - 14:10' },
    { codigo: 'T3', intervalo: '14:20 - 15:10' },
    { codigo: 'T4', intervalo: '15:10 - 16:00' },
    { codigo: 'T5', intervalo: '16:10 - 17:00' },
    { codigo: 'T6', intervalo: '17:00 - 17:50' },
    { codigo: 'N1', intervalo: '18:00 - 18:50' },
    { codigo: 'N2', intervalo: '18:50 - 19:40' },
    { codigo: 'N3', intervalo: '19:40 - 20:30' },
    { codigo: 'N4', intervalo: '20:30 - 21:20' },
    { codigo: 'N5', intervalo: '21:20 - 22:10' }
  ];

  periodos:number[] = [];

  // Estados
  menu1Aberto = false;
  menu2Aberto = false;
  menu3Aberto = false;
  exibirModal = false;
  exibirModalResumo = false;

  submenuPeriodoAberto = false;

  exibirModalConflito = false;
  conflitoInfo: any = null;

  exibirModalOtimizar = false;
  abaAtiva: 'turnos' | 'personalizado' = 'turnos';

  // Configuração de Turno
  turnoSelecionado: 'M' | 'T' | 'N' | null = null;

  // Estrutura flexível: cada dia pode ter N janelas de tempo
  disponibilidade: any = {
    'SEG': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'TER': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'QUA': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'QUI': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'SEX': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'SAB': []
  };

  diasSemana = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  turmaSelecionadaDetalhe: any = null;
  disiplinaSelecionada: any = null;

  // Dados
  listaDisciplinasDisponiveis: any[] = [];
  selecionadas: any[] = [];
  termoBusca: string = '';

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  ngOnInit() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(termo => this.executarBusca(termo));
    this.cronogramaService.pegaNumPeriodos().subscribe(res => {
      this.periodos = [];
      const total = res || 12;
      for (let i = 1; i <= total; i++) {
        this.periodos.push(i);
      }
    });
  }

  ngOnDestroy() { this.searchSub?.unsubscribe(); }

  onSearchChange(v: string) { this.searchSubject.next(v); }

  executarBusca(termo: string) {
    if (termo.length < 3) { this.listaDisciplinasDisponiveis = []; return; }
    this.cronogramaService.buscar(termo).subscribe(res => this.listaDisciplinasDisponiveis = res);
  }

  selecionarDisciplina(disc: any) {
    if (!this.selecionadas.find(d => d.nome === disc.nome)) {
      // Adiciona cores para o card e expande
      this.selecionadas.push({ 
        ...disc, 
        expandida: true,
        cor: this.gerarCorHex(disc.nome) 
      });
      
      // UX: Fecha a busca e abre as turmas para o próximo passo
      this.termoBusca = '';
      this.listaDisciplinasDisponiveis = [];
      this.menu1Aberto = false;
      this.menu2Aberto = true;
    }
  }

  removerDisciplina(disc: any) {
    this.selecionadas = this.selecionadas.filter(d => d.nome !== disc.nome);
  }

  toggleExpandir(disc: any) {
    disc.expandida = !disc.expandida;
  }

  confirmarLimparTudo() {
    this.selecionadas = [];
  }

  abrirModal(disc: Disciplina, t: Turma) { this.disiplinaSelecionada = disc; this.turmaSelecionadaDetalhe = t; this.exibirModal = true; }
  fecharModal() { this.exibirModal = false; }
  selecionarTurmaModal(){ 
    this.disiplinaSelecionada.selectedTurmaId =  (this.disiplinaSelecionada.selectedTurmaId === this.turmaSelecionadaDetalhe.id ? undefined : this.turmaSelecionadaDetalhe.id);
    this.fecharModal();
  }

  getHorariosAgrupados(horarios: any[]) {
    if (!horarios) return [];
    return horarios.reduce((acc: any[], curr) => {
      const dia = acc.find(item => item.dia === curr.dia);
      dia ? dia.codigos.push(curr.hora_codigo) : acc.push({ dia: curr.dia, codigos: [curr.hora_codigo] });
      return acc;
    }, []);
  }

  getAulaNoSlot(dia: string, horaCodigo: string) {

    for (const disc of this.selecionadas) {
      // Só verifica se a disciplina tiver uma turma selecionada
      if (disc.selectedTurmaId) {
        const turmaAtiva = disc.turmas.find((t: Turma) => t.id === disc.selectedTurmaId);
        
        if (turmaAtiva) {
          // Verifica se algum horário da turma bate com o dia e código da célula
          const ocupado = turmaAtiva.horario.some((h: Horario) => 
            h.dia.toLowerCase().includes(dia.toLowerCase()) && 
            h.hora_codigo === horaCodigo
          );

          if (ocupado) {
            return {
              nome: disc.nome,
              professor: turmaAtiva.professor,
              turma: turmaAtiva.id,
              // Gerar uma cor consistente baseada no nome da disciplina
              cor: this.gerarCorHex(disc.nome) 
            };
          }
        }
      }
    }
    return null;
  }

  selecionarTurmaComVerificacao(disciplina: any, turma: any) {
    // 1. Se o usuário clicar na turma que JÁ está selecionada, ele quer desmarcar
    if (disciplina.selectedTurmaId === turma.id) {
      disciplina.selectedTurmaId = undefined;
      return;
    }

    // 2. Verificar conflitos APENAS com OUTRAS disciplinas
    const conflito = this.checarConflito(turma, disciplina.nome);

    if (conflito) {
      this.conflitoInfo = {
        turmaNova: { 
          nome: disciplina.nome, 
          professor: turma.professor, 
          horario: turma.horario 
        },
        turmaExistente: conflito
      };
      this.exibirModalConflito = true;
    } else {
      // 3. Se não houver conflito (ou se for a mesma matéria), seleciona/substitui
      disciplina.selectedTurmaId = turma.id;
    }
  }

  checarConflito(turmaNova: any, nomeDisciplinaAtual: string) {
    for (const disc of this.selecionadas) {
      // REGRA CHAVE: Se for a mesma disciplina, pula a verificação de conflito
      if (!disc.selectedTurmaId || disc.nome === nomeDisciplinaAtual) {
        continue;
      }
      
      const turmaAtiva = disc.turmas.find((t: any) => t.id === disc.selectedTurmaId);
      if (!turmaAtiva) continue;

      // Compara os horários
      for (const hNova of turmaNova.horario) {
        for (const hAtiva of turmaAtiva.horario) {
          if (hNova.dia === hAtiva.dia && hNova.hora_codigo === hAtiva.hora_codigo) {
            return { 
              disciplina: disc.nome, 
              professor: turmaAtiva.professor, 
              slot: hNova.hora_codigo 
            };
          }
        }
      }
    }
    return null;
  }

  abrirModalOtimizar() {
    this.menu3Aberto = false;
    this.exibirModalOtimizar = true;
  }

  executarOtimizacao() {
    if (this.abaAtiva === 'turnos') {
      console.log("Otimizando para Turno:", this.turnoSelecionado);
    } else {
      console.log("Otimizando para Grade Personalizada:", this.disponibilidade);
    }
    this.exibirModalOtimizar = false;
  }

  adicionarJanela(dia: string) {
    this.disponibilidade[dia].push({ inicio: '08:00', fim: '12:00' });
  }

  removerJanela(dia: string, index: number) {
    this.disponibilidade[dia].splice(index, 1);
  }

  // No seu método que fecha os menus, adicione:
  fecharMenus() {
    this.menu1Aberto = false;
    this.menu2Aberto = false;
    this.menu3Aberto = false;
    this.submenuPeriodoAberto = false; // Fecha o submenu também
  }

  preencherPorPeriodo(periodo: number) {
    this.cronogramaService.pegaPorPeriodo(periodo).subscribe(res => {

      for (const disc of res) {

        // 1️⃣ Evita duplicar disciplina
        const jaExiste = this.selecionadas.find(d => d.nome === disc.nome);
        if (jaExiste) continue;

        // 2️⃣ Seleciona a turma padrão (primeira)
        const turmaPadrao = disc.turmas?.[0];
        if (!turmaPadrao) continue;

        // 3️⃣ Verifica conflito com as já selecionadas
        const conflito = this.checarConflito(turmaPadrao, disc.nome);

        if (conflito) {
          // 4️⃣ Se houver conflito, abre modal e PARA
          this.conflitoInfo = {
            turmaNova: {
              nome: disc.nome,
              professor: turmaPadrao.professor,
              horario: turmaPadrao.horario
            },
            turmaExistente: conflito
          };

          this.exibirModalConflito = true;
          break; // ⛔ Para no primeiro conflito
        }

        // 5️⃣ Se não houver conflito, adiciona
        this.selecionadas.push({
          ...disc,
          selectedTurmaId: turmaPadrao.id,
          expandida: false,
          cor: this.gerarCorHex(disc.nome)
        });
      }

      // UX
      this.submenuPeriodoAberto = false;
      this.menu3Aberto = false;

      console.log("Disciplinas após preenchimento por período:", this.selecionadas);
    });
  }

  abrirModalResumo() {
    this.exibirModalResumo = true;
  }

  fecharModalResumo() {
    this.exibirModalResumo = false;
  }



  // Método auxiliar para dar cores automáticas às matérias
  private gerarCorHex(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }
}