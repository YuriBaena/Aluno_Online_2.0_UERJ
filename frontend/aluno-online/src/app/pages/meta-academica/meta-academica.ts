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

  isEditing = false;

  info = false;
  infoMessage = '';
  infoType: 'success' | 'warning' | 'info' = 'info';
  private infoTimeout: any;

  showModal = false;
  currentGPA = 0;
  totalCreditosHistorico = 0;
  selectedCourse: any = null;
  currentSemester = '';

  currentSort = 'data'; // Campo inicial
  currentDir = 'desc';  // Direção inicial
  
  // Lista de disciplinas vinda do endpoint /dados
  courses: (ResumoDisciplina & { active?: boolean, colorClass: string })[] = [];
  
  // Lista de avaliações vinda do endpoint principal
  assessments: AvaliacaoDTO[] = [];


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
        this.totalCreditosHistorico = dados.creditosFeitos;
        this.courses = dados.disciplinas.map((d) => ({
          ...d,
          active: false,
          colorClass: this.getCourseStyle(d.nome).color
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

  calculateCRImpact(): number {
    if (this.totalCreditosHistorico === 0) return 0;

    if (this.isViewingAll) {
      // SOMA DO IMPACTO DE TODAS AS DISCIPLINAS
      return this.courses.reduce((acc, course) => {
        const mediaMateria = this.calculateAverageByCourse(course.codigo);
        const diferenca = mediaMateria - this.currentGPA;
        const impactoMateria = (diferenca * course.creditos) / this.totalCreditosHistorico;
        return acc + impactoMateria;
      }, 0);
    } else {
      // IMPACTO DE APENAS UMA DISCIPLINA (Lógica que você já tinha)
      if (!this.selectedCourse) return 0;
      const mediaAtualMateria = this.calculateCurrentAverage();
      const diferenca = mediaAtualMateria - this.currentGPA;
      return (diferenca * this.selectedCourse.creditos) / this.totalCreditosHistorico;
    }
  }

  getGoalCalculations(): { toPass: number; toCR: number; toRecuperacao: number } | null {
    // 1. Validações iniciais
    if (this.isViewingAll || !this.selectedCourse) return null;

    // 2. Filtra avaliações da disciplina selecionada
    const courseAssessments = this.assessments.filter(
      a => a.codigo_disciplina === this.selectedCourse?.codigo
    );

    const pending = courseAssessments.filter(a => a.nota === null);
    const totalRemainingWeight = pending.reduce((acc, a) => acc + a.peso, 0);
    
    // 3. Calcula pontos já conquistados (Nota * Peso proporcional)
    const currentPoints = courseAssessments
      .filter(a => a.nota !== null)
      .reduce((acc, a) => acc + (a.nota! * (a.peso / 100)), 0);

    // Se não houver peso sobrando, não há o que calcular
    if (totalRemainingWeight <= 0) return null;

    // 4. Função auxiliar de cálculo (Retorna sempre NUMBER)
    const calcTarget = (target: number): number => {
      const pesoProporcionalRestante = totalRemainingWeight / 100;
      const needed = (target - currentPoints) / pesoProporcionalRestante;
      
      // Retornamos o valor real, mesmo que seja > 10. 
      // Se for negativo, retornamos 0 (já atingiu a meta).
      return needed < 0 ? 0 : needed;
    };

    return {
      toPass: calcTarget(7.0),
      toCR: calcTarget(this.currentGPA),
      toRecuperacao: calcTarget(4.0)
    };
  }

  getStatusMessage(): string {
    const avg = this.calculateCurrentAverage();
    if (avg >= 7) return 'Seguro';
    if (avg >= 5) return 'Atenção';
    return 'Risco';
  }

  // Salva e edita
  saveAssessment() {
    // 1. Validação de campos obrigatórios
    if (!this.newAssessment.codigo_disciplina || !this.newAssessment.nome) {
      this.showInfo('Preencha a disciplina e o nome da avaliação.', 'warning');
      return;
    }

    // 2. Validação do intervalo da nota (NOVO)
    // Verificamos se a nota não é nula e se está fora do range 0-10
    if (this.newAssessment.nota !== null && (this.newAssessment.nota < 0 || this.newAssessment.nota > 10)) {
      this.showInfo('A nota deve estar entre 0 e 10.', 'warning');
      return;
    }

    // 3. Validação do Peso (Opcional, mas recomendado)
    if (this.newAssessment.peso < 0 || this.newAssessment.peso > 100) {
      this.showInfo('O peso deve estar entre 0% e 100%.', 'warning');
      return;
    }

    // Se passou nas validações, prossegue com o payload e a requisição...
    const payload: AvaliacaoDTO = {
      id: this.isEditing ? this.newAssessment.id : undefined,
      codigo_disciplina: this.newAssessment.codigo_disciplina,
      nome: this.newAssessment.nome,
      tipo: this.newAssessment.tipo,
      peso: this.newAssessment.peso,
      nota: this.newAssessment.nota,
      data: this.newAssessment.data 
    };

    const request = this.isEditing 
      ? this.objetivoService.atualizar(payload.id!, payload) 
      : this.objetivoService.criar(payload);

    request.subscribe({
      next: (res) => {
        const codigoFiltro = this.isViewingAll ? undefined : this.selectedCourse?.codigo;
        this.listarAvaliacoesComSort(codigoFiltro);
        this.showInfo(`Avaliação ${this.isEditing ? 'atualizada' : 'salva'}!`, 'success');
        this.toggleModal();
        this.resetForm();
      },
      error: (err) => this.showInfo('Erro ao processar operação.', 'warning')
    });
  }

  viewAll() {
    this.isViewingAll = true;
    this.courses.forEach(c => c.active = false);
    this.listarAvaliacoes(); // Chama o service sem o ID da disciplina
  }

  selectCourse(course: any) {
    this.isViewingAll = false;
    this.selectedCourse = course;
    this.courses.forEach(c => c.active = false);
    course.active = true;
    this.listarAvaliacoes(course.codigo);
  }

  private getCourseNameByCode(codigo: string): string {
    const course = this.courses.find(c => c.codigo === codigo);
    return course ? course.nome : 'Disciplina não encontrada';
  }

  toggleModal() {
    this.showModal = !this.showModal;
    if (!this.showModal) {
      this.resetForm();
    }
  }

  resetForm() {
    this.isEditing = false;
    this.newAssessment = {
      codigo_disciplina: '',
      nome: '',
      tipo: 'Prova',
      peso: 0,
      nota: null,
      data: ''
    };
  }

  editAssessment(assessment: any) {
    this.isEditing = true;
    // Clona o objeto para não alterar a tabela antes de salvar
    this.newAssessment = { ...assessment }; 
    this.showModal = true;
  }

  deleteAssessment(id: number) {
    // Para deleção, o confirm nativo ainda é seguro, mas o feedback de sucesso será o Toast
    this.objetivoService.excluir(id).subscribe({
      next: () => {
        this.listarAvaliacoesComSort();
        this.showInfo('Avaliação removida com sucesso.', 'info');
      },
      error: () => this.showInfo('Erro ao excluir avaliação.', 'warning')
    });
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

  ordenar(coluna: string) {
    // Se clicar na mesma coluna, inverte a direção
    if (this.currentSort === coluna) {
      this.currentDir = this.currentDir === 'asc' ? 'desc' : 'asc';
    } else {
      // Se clicar em coluna nova, reseta para descendente
      this.currentSort = coluna;
      this.currentDir = 'desc';
    }

    // Define qual disciplina filtrar (se houver uma selecionada)
    const codigo = this.isViewingAll ? undefined : this.courses.find(c => c.active)?.codigo;
    
    // Chama o serviço passando os novos parâmetros de sort
    this.listarAvaliacoesComSort(codigo);
  }

  // Método auxiliar para atualizar a lista
  listarAvaliacoesComSort(codigoDisciplina?: string) {
    this.objetivoService.listarAvaliacoes(codigoDisciplina, this.currentSort, this.currentDir).subscribe({
      next: (res) => {
        this.assessments = res;
      }
    });
  }

  // Para mostrar a setinha no HTML
  getSortIcon(coluna: string): string {
    if (this.currentSort !== coluna) return '';
    return this.currentDir === 'asc' ? '▲' : '▼';
  }

  getDateUrgencyClass(dateString: string): string {
    if (!dateString) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera as horas para comparação justa
    const assessmentDate = new Date(dateString);
    assessmentDate.setHours(0, 0, 0, 0);

    // Se a data já passou, retorna sem classe de cor
    if (assessmentDate < today) return '';

    const diffInTime = assessmentDate.getTime() - today.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

    if (diffInDays < 14) {
      return 'urgent-critical'; // Menos de 2 semanas (Vermelho)
    } else if (diffInDays <= 30) {
      return 'urgent-warning';  // Entre 2 semanas e 1 mês (Laranja)
    } else {
      return 'urgent-safe';     // Mais de 1 mês (Verde)
    }
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

  // Método centralizado para mostrar o toast
  showInfo(message: string, type: 'success' | 'warning' | 'info' = 'info') {
    this.infoMessage = message;
    this.infoType = type;
    this.info = true;

    // Limpa timeout anterior se houver
    if (this.infoTimeout) clearTimeout(this.infoTimeout);

    // Fecha automaticamente após 4 segundos
    this.infoTimeout = setTimeout(() => {
      this.info = false;
    }, 4000);
  }
}