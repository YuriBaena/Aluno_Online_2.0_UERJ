import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { CronogramaService } from '../../services/cronograma';

// Interfaces sincronizadas com os Records do Java
export interface Horario {
  dia: string;
  codigo_horario: string[];
}

export interface CronPart {
  codigo_disc: string;
  nome_disc: string;
  nome_prof: string;
  horarios: Horario[];
}

export interface CronRequest {
  nome_cronograma: string;
  disciplinas: CronPart[];
}

@Component({
  selector: 'app-cronograma',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cronograma.html',
  styleUrl: './cronograma.scss',
})
export class Cronograma implements OnInit {
  private cronService = inject(CronogramaService);

  nomesCronogramas: string[] = []; 
  exibirModalDetalhes = false;
  disciplinaSelecionada: CronPart | null = null;
  cronogramaAtivo: CronRequest | null = null;

  // Definições fixas
  horariosLabels = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'N1', 'N2', 'N3', 'N4', 'N5'];
  diasSemana = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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

  ngOnInit() {
    this.carregarListaNomes();
  }

  // --- FILTROS DE INTERFACE ---

  /**
   * Retorna apenas as labels (M1, T1...) que possuem disciplina no cronograma atual
   */
  get labelsFiltradas() {
    if (!this.cronogramaAtivo) return [];
    return this.horariosLabels.filter(label => 
      this.diasSemana.some(dia => !!this.getDisciplinaNoHorario(dia, label))
    );
  }

  carregarListaNomes() {
    this.cronService.listNomesCronogramas().subscribe({
      next: (nomes) => {
        this.nomesCronogramas = nomes;
        if (nomes.length > 0 && !this.cronogramaAtivo) {
          this.selecionarCronograma(nomes[0]);
        }
      },
      error: (err) => console.error('Erro ao listar cronogramas', err)
    });
  }

  selecionarCronograma(nome: string) {
    this.cronService.getCronByNome(nome).subscribe((res: any) => {
      if (res && res.disciplinas) {
        res.disciplinas.forEach((d: any) => {
          d.horarios = d.horarios || [];
          d.horarios.forEach((h: any) => {
            h.codigo_horario = h.codigo_horario || [];
          });
        });
      }
      this.cronogramaAtivo = res;
    });
  }

  excluirCronograma(nome: string) {
    if (confirm(`Deseja realmente excluir o cronograma "${nome}"?`)) {
      this.cronService.deleteCron(nome).subscribe(() => {
        // Se o excluído for o ativo, limpamos a visualização
        if (this.cronogramaAtivo?.nome_cronograma === nome) {
          this.cronogramaAtivo = null;
        }
        this.carregarListaNomes();
      });
    }
  }

  abrirDetalhes(disc: CronPart) {
    this.disciplinaSelecionada = disc;
    this.exibirModalDetalhes = true;
  }

  fecharModal() {
    this.exibirModalDetalhes = false;
    this.disciplinaSelecionada = null;
  }

  getDisciplinaNoHorario(dia: string, horario: string): CronPart | null {
    if (!this.cronogramaAtivo) return null;
    
    // Normalização básica para bater com o banco (Terca/Sábado)
    const diaBusca = dia === 'Sábado' ? 'Sabado' : dia;

    return this.cronogramaAtivo.disciplinas.find(d => 
      d.horarios.some(h => 
        (h.dia === diaBusca || h.dia === dia) && 
        h.codigo_horario.includes(horario)
      )
    ) || null;
  }

  getIntervaloPorCodigo(codigo: string): string {
    const horario = this.listaHorariosDefinidos.find(h => h.codigo === codigo);
    return horario ? horario.intervalo : '--:--';
  }

  getEstiloDisciplina(disc: CronPart) {
    if (!this.cronogramaAtivo || !disc) return {};
    
    const index = this.cronogramaAtivo.disciplinas.findIndex(d => d.codigo_disc === disc.codigo_disc);
    const total = this.cronogramaAtivo.disciplinas.length || 1;
    const hue = (index * (360 / total)) % 360; 
    
    return { 
      'background-color': `hsl(${hue}, 70%, 88%)`, 
      'color': '#1e293b',
      'border-left': `4px solid hsl(${hue}, 70%, 40%)`
    };
  }
}