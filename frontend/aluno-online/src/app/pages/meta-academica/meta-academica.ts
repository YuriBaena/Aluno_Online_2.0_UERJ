import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObjetivoService, AvaliacaoDTO, ResumoDisciplina } from '../../services/objetivo';

@Component({
  selector: 'app-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meta-academica.html',
  styleUrls: ['./meta-academica.scss']
})
export class MetaAcademica implements OnInit {
  private objetivoService = inject(ObjetivoService);

  isViewingAll = false;

  showModal = false;
  currentGPA = 0;
  currentSemester = '';
  
  // Lista de disciplinas vinda do endpoint /dados
  courses: (ResumoDisciplina & { active?: boolean, colorClass: string })[] = [];
  
  // Lista de avaliações vinda do endpoint principal
  assessments: AvaliacaoDTO[] = [];

  // Cores para rotacionar nas disciplinas
  private colorPalette = ['green', 'blue', 'purple', 'orange'];

  newAssessment: any = {
    codigo_disciplina: '',
    nome: '',
    tipo: 'Prova',
    peso: 0,
    nota: null,
    data: ''
  };

  ngOnInit() {
    this.definirSemestreAtual();
    this.carregarDadosIniciais();
  }

  private definirSemestreAtual() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const semestre = agora.getMonth() <= 5 ? '1' : '2';
    this.currentSemester = `${ano}.${semestre}`;
  }

  carregarDadosIniciais() {
    // 1. Carrega Disciplinas e CR
    this.objetivoService.getDadosIniciais().subscribe({
      next: (dados) => {
        this.currentGPA = dados.cr;
        this.courses = dados.disciplinas.map((d, index) => ({
          ...d,
          active: false,
          colorClass: this.colorPalette[index % this.colorPalette.length]
        }));
        
        // Opcional: Carregar avaliações da primeira disciplina automaticamente
        if (this.courses.length > 0) {
          this.selectCourse(this.courses[0]);
        } else {
          this.listarAvaliacoes(); // Traz todas se não houver disciplinas
        }
      }
    });
  }

  listarAvaliacoes(codigoDisciplina?: string) {
    this.objetivoService.listarAvaliacoes(codigoDisciplina).subscribe({
      next: (res) => {
        this.assessments = res;
      },
      error: (err) => console.error('Erro ao carregar avaliações', err)
    });
  }

  toggleModal() {
    this.showModal = !this.showModal;
  }

  // Calcula a média ponderada das notas que já foram dadas
  calculateCurrentAverage(): number {
    const graded = this.assessments.filter(a => a.nota !== null);
    if (graded.length === 0) return 0;
    
    const totalWeight = graded.reduce((acc, a) => acc + a.peso, 0);
    const sum = graded.reduce((acc, a) => acc + (a.nota! * (a.peso / 100)), 0);
    
    // Normaliza para escala 0-10 caso o peso total ainda não seja 100
    return (sum / totalWeight) * 100;
  }

  // Calcula a média de uma única disciplina (baseado em pesos de provas)
  calculateAverageByCourse(codigo: string): number {
    const courseAssessments = this.assessments.filter(a => a.codigo_disciplina === codigo);
    if (courseAssessments.length === 0) return 0;

    const totalWeighted = courseAssessments.reduce((acc, curr) => acc + (curr.nota || 0) * (curr.peso / 100), 0);
    const totalWeight = courseAssessments.reduce((acc, curr) => acc + (curr.peso / 100), 0);

    return totalWeight > 0 ? totalWeighted / totalWeight : 0;
  }

  // Calcula o CR Global Ponderado (Média das Médias * Créditos)
  calculateGlobalAverage(): number {
    if (this.courses.length === 0) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    this.courses.forEach(course => {
      const mediaDisciplina = this.calculateAverageByCourse(course.codigo);
      totalPoints += mediaDisciplina * course.creditos;
      totalCredits += course.creditos;
    });

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  }

  getTotalCredits(): number {
    return this.courses.reduce((acc, course) => acc + (course.creditos || 0), 0);
  }

  // Função para o HTML decidir qual média exibir
  getMainDisplayAverage(): number {
    return this.isViewingAll ? this.calculateGlobalAverage() : this.calculateCurrentAverage();
  }

  // Calcula quanto do peso total (100%) já foi avaliado
  calculateProgress(): number {
    return this.assessments
      .filter(a => a.nota !== null)
      .reduce((acc, a) => acc + a.peso, 0);
  }

  getStatusMessage(): string {
    const avg = this.calculateCurrentAverage();
    if (avg >= 7) return 'Seguro';
    if (avg >= 5) return 'Atenção';
    return 'Risco';
  }

  saveAssessment() {
    if (!this.newAssessment.codigo_disciplina || !this.newAssessment.nome) {
      alert('Por favor, preencha a disciplina e o nome da avaliação.');
      return;
    }

    // Mapeando para o formato que o backend espera (AvaliacaoDTO)
    const payload: AvaliacaoDTO = {
      codigo_disciplina: this.newAssessment.codigo_disciplina,
      nome: this.newAssessment.nome,
      tipo: this.newAssessment.tipo,
      peso: this.newAssessment.peso,
      nota: this.newAssessment.nota,
      data: this.newAssessment.data // Ajuste de nome de campo
    };

    this.objetivoService.criar(payload).subscribe({
      next: (res) => {
        this.assessments.push(res); 
        
        this.toggleModal();
        this.resetForm();
        
        // Opcional: Recalcular a média ou recarregar a lista do servidor
        // this.listarAvaliacoes(payload.codigo_disciplina);
      },
      error: (err) => {
        console.error('Erro ao salvar avaliação:', err);
        alert('Erro ao salvar. Verifique o console.');
      }
    });
  }

  resetForm() {
    this.newAssessment = {
      codigo_disciplina: '',
      nome: '',
      tipo: 'Prova',
      peso: 0,
      nota: null,
      data: ''
    };
  }

  viewAll() {
    this.isViewingAll = true;
    this.courses.forEach(c => c.active = false);
    this.listarAvaliacoes(); // Chama o service sem o ID da disciplina
  }

  selectCourse(course: any) {
    this.isViewingAll = false;
    this.courses.forEach(c => c.active = false);
    course.active = true;
    this.listarAvaliacoes(course.codigo);
  }

  private getCourseNameByCode(codigo: string): string {
    const course = this.courses.find(c => c.codigo === codigo);
    return course ? course.nome : 'Disciplina não encontrada';
  }

  pegaIniciais(codigo: string): string {
    const nome = this.getCourseNameByCode(codigo);
    if (!nome || nome === 'Disciplina não encontrada') return '';

    const partes = nome.trim().split(/\s+/);
    const regexRomano = /^(X|IX|IV|V?I{0,3})$/i;

    const iniciais = partes
      .map((palavra, index) => {
        // 1. Sempre pega a primeira letra da primeira palavra
        if (index === 0) return palavra[0].toUpperCase();

        // 2. Se for numeral romano, retorna ele com um espaço (ex: " II")
        // Mas sem o ponto manual, deixaremos o join tratar isso
        if (regexRomano.test(palavra)) {
          return ' ' + palavra.toUpperCase();
        }

        // 3. Ignora conectores (de, e, do, da, os)
        if (palavra.length <= 2 && index !== partes.length - 1) {
          return null;
        }

        // 4. Pega inicial de palavras importantes
        return palavra[0].toUpperCase();
      })
      .filter(item => item !== null); // Remove os conectores ignorados

    // Junta com ponto. O resultado de ["E", "D", " II"] vira "E.D. II"
    return iniciais.join('.').trim();
  }

  // Gera um objeto com cor de fundo (clara) e cor de texto (escura) baseada no nome
  getCourseStyle(nome: string) {
    let hash = 0;
    for (let i = 0; i < nome.length; i++) {
      hash = nome.charCodeAt(i) + ((hash << 5) - hash);
    }

    // H: Matiz (0-360) baseada no hash
    const h = Math.abs(hash % 360);
    
    // Retornamos um objeto de estilo para usar no [ngStyle]
    return {
      'background-color': `hsl(${h}, 70%, 95%)`, // Fundo bem clarinho (Pastel)
      'border-left-color': `hsl(${h}, 60%, 50%)`, // Borda mais viva
      'color': `hsl(${h}, 70%, 25%)`              // Texto bem escuro para contraste
    };
  }
}