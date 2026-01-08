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
  // Injeção de Dependência
  private cronogramaService = inject(MyCronogramaService);

  // Estados da Interface
  menu1Aberto = false;
  menu2Aberto = false;
  exibirModal = false;
  turmaSelecionadaDetalhe: Turma | null = null;

  // Gerenciamento de Dados
  listaDisciplinasDisponiveis: Disciplina[] = [];
  selecionadas: Disciplina[] = [];
  
  // Controle de Busca reativa
  termoBusca: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    // Configura o observador de busca
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),        // Aguarda 400ms após o último clique
      distinctUntilChanged()    // Só busca se o texto for diferente do anterior
    ).subscribe(termo => {
      this.executarBusca(termo);
    });
  }

  ngOnDestroy(): void {
    // Limpa a inscrição para evitar vazamento de memória
    this.searchSubscription?.unsubscribe();
  }

  // --- Lógica de Busca ---
  onSearchChange(valor: string) {
    this.searchSubject.next(valor);
  }

  executarBusca(termo: string) {
    if (!termo || termo.length < 3) {
      this.listaDisciplinasDisponiveis = [];
      return;
    }

    this.cronogramaService.buscar(termo).subscribe({
      next: (dados) => {
        this.listaDisciplinasDisponiveis = dados;
      },
      error: (err) => {
        console.error('Erro ao buscar disciplinas no banco:', err);
        this.listaDisciplinasDisponiveis = [];
      }
    });
  }

  // --- Lógica de Seleção ---
  selecionarDisciplina(disc: Disciplina) {
    const existe = this.selecionadas.find(item => item.nome === disc.nome);
    if (!existe) {
      // Faz uma cópia para evitar que a seleção de turma em um lugar afete o outro
      this.selecionadas.push({ ...disc });
      this.menu1Aberto = false;
      this.menu2Aberto = true;
    }
  }

  removerDisciplina(disc: Disciplina) {
    this.selecionadas = this.selecionadas.filter(item => item.nome !== disc.nome);
  }

  // --- Utilitários ---
  getHorariosAgrupados(horarios: Horario[] | undefined) {
    if (!horarios) return [];

    return horarios.reduce((acc: any[], curr) => {
      const diaExistente = acc.find((item: any) => item.dia === curr.dia);
      if (diaExistente) {
        diaExistente.codigos.push(curr.hora_codigo);
      } else {
        acc.push({ dia: curr.dia, codigos: [curr.hora_codigo] });
      }
      return acc;
    }, []);
  }

  // --- Modal ---
  abrirModal(turma: Turma) {
    this.turmaSelecionadaDetalhe = turma;
    this.exibirModal = true;
    document.body.style.overflow = 'hidden';
  }

  fecharModal() {
    this.exibirModal = false;
    this.turmaSelecionadaDetalhe = null;
    document.body.style.overflow = 'auto';
  }
}