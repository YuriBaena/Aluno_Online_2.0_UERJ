import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx-js-style';
import { Router, RouterModule } from '@angular/router';
import { CronInfo, CronogramaService } from '../../services/cronograma';

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
  private router = inject(Router);

  periodoAtual: string = '';

  nomesCronogramas: CronInfo[] = []; 
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
    const agora = new Date();
    const ano = agora.getFullYear();
    const semestre = agora.getMonth() <= 5 ? '1' : '2'; //
    this.periodoAtual = `${ano}/${semestre}`;
    this.carregarListaNomes();
  }

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
          this.selecionarCronograma(nomes[0]?.nome);
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
    this.cronService.deleteCron(nome).subscribe(() => {
      // Se o excluído for o ativo, limpamos a visualização
      if (this.cronogramaAtivo?.nome_cronograma === nome) {
        this.cronogramaAtivo = null;
      }
      this.carregarListaNomes();
    });
  }

  podeEditar(criadoEm: string): boolean {
    return criadoEm === this.periodoAtual;
  }

  editarCronograma(nome: string) {
    this.router.navigate(['/home/my-cronograma', nome]);
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

  exportarParaExcel(nome: string) {
    this.cronService.getCronByNome(nome).subscribe({
      next: (cron: CronRequest) => {
        this.gerarArquivoExcel(cron);
      },
      error: (err) => console.error('Erro ao buscar dados para exportação', err)
    });
  }

  private gerarArquivoExcel(cron: CronRequest) {
    const worksheet: XLSX.WorkSheet = {};
    
    // 1. Filtrar horários: apenas os que possuem pelo menos uma aula na semana
    const horariosComAula = this.listaHorariosDefinidos.filter(hDef =>
      this.diasSemana.some(dia => !!this.buscarDisciplinaParaExport(cron, dia, hDef.codigo))
    );

    // 2. Mapear cores das disciplinas (mesma lógica do seu CSS)
    const mapaCores = new Map<string, string>();
    cron.disciplinas.forEach((d, i) => {
      const hue = (i * (360 / cron.disciplinas.length)) % 360;
      mapaCores.set(d.codigo_disc, this.hslToHex(hue, 70, 85)); // Fundo pastel
    });

    // Função interna para facilitar a inserção de células
    const setCell = (r: number, c: number, value: any, style: any = {}) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      worksheet[cellRef] = { v: value, t: 's', s: style };
    };

    // 3. Estilo do Cabeçalho
    const headStyle = {
      fill: { fgColor: { rgb: "334155" } }, // Slate 700
      font: { color: { rgb: "FFFFFF" }, bold: true },
      alignment: { horizontal: "center" },
      border: { bottom: { style: 'thin', color: { rgb: "000000" } } }
    };

    // Montar Cabeçalho
    setCell(0, 0, 'Horário', headStyle);
    setCell(0, 1, 'Intervalo', headStyle);
    this.diasSemana.forEach((dia, i) => setCell(0, i + 2, dia, headStyle));

    // 4. Montar Grade Horária
    horariosComAula.forEach((hDef, rIdx) => {
      const row = rIdx + 1;
      
      // Colunas de tempo
      setCell(row, 0, hDef.codigo, { font: { bold: true }, alignment: { horizontal: "center" } });
      setCell(row, 1, hDef.intervalo, { alignment: { horizontal: "center" } });

      // Colunas dos dias
      this.diasSemana.forEach((dia, cIdx) => {
        const col = cIdx + 2;
        const disc = this.buscarDisciplinaParaExport(cron, dia, hDef.codigo);
        
        if (disc) {
          const corHex = mapaCores.get(disc.codigo_disc);
          setCell(row, col, " ", { // Espaço vazio, mas colorido
            fill: { fgColor: { rgb: corHex } },
            border: { 
              top: { style: 'thin', color: { rgb: "CBD5E1" } },
              bottom: { style: 'thin', color: { rgb: "CBD5E1" } },
              left: { style: 'thin', color: { rgb: "CBD5E1" } },
              right: { style: 'thin', color: { rgb: "CBD5E1" } }
            }
          });
        } else {
          setCell(row, col, "", { fill: { fgColor: { rgb: "F8FAFC" } } });
        }
      });
    });

    // 5. Montar LEGENDA (à direita da grade)
    const colLegenda = this.diasSemana.length + 4;
    setCell(0, colLegenda, "LEGENDA", { font: { bold: true, size: 12 } });

    cron.disciplinas.forEach((d, i) => {
      const row = i + 1;
      const corHex = mapaCores.get(d.codigo_disc);

      // Quadradinho da cor
      setCell(row, colLegenda, " ", { fill: { fgColor: { rgb: corHex } } });
      // Informação da disciplina
      setCell(row, colLegenda + 1, `${d.nome_disc} (${d.nome_prof})`, { font: { bold: true } });
    });

    // 6. Configurações Finais (Ref, Largura Colunas)
    const totalRows = horariosComAula.length + 1;
    const totalCols = colLegenda + 2;
    worksheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows, c: totalCols } });
    
    worksheet['!cols'] = [
      { wch: 10 }, { wch: 15 }, // Horário e Intervalo
      ...this.diasSemana.map(() => ({ wch: 10 })), // Dias (curtos pois só tem cor)
      { wch: 5 }, // Espaçador
      { wch: 4 },
      { wch: 4 }, // cor
      { wch: 25 } // nome - professor
    ];

    // 7. Salvar
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Meu Cronograma');
    XLSX.writeFile(workbook, `Cronograma_${cron.nome_cronograma}.xlsx`);
  }

  // Helper: Converte seu HSL dinâmico para HEX que o Excel entende
  private hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `${f(0)}${f(8)}${f(4)}`.toUpperCase();
  }

  // Função auxiliar para busca específica de exportação
  private buscarDisciplinaParaExport(cron: CronRequest, dia: string, horario: string): CronPart | null {
    const diaBusca = dia === 'Sábado' ? 'Sabado' : dia;
    return cron.disciplinas.find(d => 
      d.horarios.some(h => 
        (h.dia === diaBusca || h.dia === dia) && 
        h.codigo_horario.includes(horario)
      )
    ) || null;
  }
}