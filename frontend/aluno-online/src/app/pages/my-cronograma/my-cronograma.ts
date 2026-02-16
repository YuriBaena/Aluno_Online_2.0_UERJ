import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MyCronogramaService } from '../../services/my-cronograma'; // Ajuste o caminho conforme seu projeto
import { Subject, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { CronogramaService } from '../../services/cronograma';
import { CronPart, CronRequest } from '../cronograma/cronograma';

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
  private cronService = inject(CronogramaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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

  info: boolean = false;
  infoMessage: string = '';
  infoType: 'success' | 'warning' | 'info' = 'info';

  // Estados
  menu1Aberto = false;
  menu2Aberto = false;
  menu3Aberto = false;
  exibirModal = false;
  exibirModalResumo = false;
  exibirModalSlot = false;

  diaSelecionadoNome = '';
  horaSelecionadaCodigo = '';

  submenuPeriodoAberto = false;

  exibirModalConflito = false;
  conflitoInfo: any = null;

  modalSalvarAberto = false;
  nomeCronograma = '';

  editing = false;

  exibirModalOtimizar = false;
  abaAtiva: 'turnos' | 'personalizado' = 'turnos';

  // Configuração de Turno
  turnoSelecionado: 'Manha' | 'Tarde' | 'Noite' | null = null;

  // Estrutura flexível: cada dia pode ter N janelas de tempo
  disponibilidade: any = {
    'Segunda': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'Terca': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'Quarta': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'Quinta': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'Sexta': [{ inicio: '07:30', fim: '11:00' }, { inicio: '19:00', fim: '22:00' }],
    'Sabado': []
  };

  diasSemana = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

  turmaSelecionadaDetalhe: any = null;
  disiplinaSelecionada: any = null;

  // Dados
  listaDisciplinasDisponiveis: any[] = [];
  selecionadas: any[] = [];
  possiveisSlot: any[] = [];
  termoBusca: string = '';

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  ngOnInit() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((termo:any) => this.executarBusca(termo));
    this.cronogramaService.pegaNumPeriodos().subscribe((res:any) => {
      this.periodos = [];
      const total = res || 12;
      for (let i = 1; i <= total; i++) {
        this.periodos.push(i);
      }
    });
    const nomeUrl = this.route.snapshot.paramMap.get('nome');
    if (nomeUrl) {
      this.nomeCronograma = nomeUrl;
      this.editing = true;
      this.carregarDadosParaEdicao(nomeUrl);
    }
    else this.executarBusca("");
  }

  ngOnDestroy() { this.searchSub?.unsubscribe(); }

  onSearchChange(v: string) { this.searchSubject.next(v); }

  executarBusca(termo: string) {
    this.cronogramaService.buscar(termo).subscribe((res:any) => this.listaDisciplinasDisponiveis = res);
  }

  selecionarDisciplina(disc: any) {
    if (!this.selecionadas.find(d => d.nome === disc.nome)) {
      this.selecionadas.push({ 
        ...disc, 
        expandida: true,
        cor: this.gerarCorHex(disc.nome) 
      });
      
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
            const aula = {
              nome: disc.nome,
              professor: turmaAtiva.professor,
              turma: turmaAtiva.id,
              cor: this.gerarCorHex(disc.nome)
            };
            return aula;
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
      this.cronogramaService.pegaPorTurno(this.turnoSelecionado).subscribe((resp: any) => {
          for (const disc of resp) {

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
      });
    } else {
      this.cronogramaService.pegaPorDisponibilidade(this.disponibilidade).subscribe((resp: any) => {
          for (const disc of resp) {

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
      });
    }
    this.exibirModalOtimizar = false;
  }

  adicionarJanela(dia: string) {
    this.disponibilidade[dia].push({ inicio: '08:00', fim: '12:00' });
  }

  removerJanela(dia: string, index: number) {
    this.disponibilidade[dia].splice(index, 1);
  }

  fecharMenus() {
    this.menu1Aberto = false;
    this.menu2Aberto = false;
    this.menu3Aberto = false;
    this.submenuPeriodoAberto = false; // Fecha o submenu também
  }

  preencherPorPeriodo(periodo: number) {
    this.cronogramaService.pegaPorPeriodo(periodo).subscribe((res:Disciplina[]) => {

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

      if(res.length == 0){
        this.mostrarMensagem("Todas matérias do " + periodo + "° período já foram realizadas.", "info");
      }

      // UX
      this.submenuPeriodoAberto = false;
      this.menu3Aberto = false;
    });
  }

  onSlotClick(dia: string, hora_codigo: string) {
    this.diaSelecionadoNome = dia;
    this.horaSelecionadaCodigo = hora_codigo;
    
    // Mapeamento para o serviço (se necessário)
    const diaMap: any = { 'SEG': 'Segunda', 'TER': 'Terca', 'QUA': 'Quarta', 'QUI': 'Quinta', 'SEX': 'Sexta', 'SAB': 'Sabado' };
    const diaBusca = diaMap[dia] || dia;

    this.cronogramaService.pegaPorSlot(diaBusca, hora_codigo).subscribe(
      (resp: Disciplina[]) => {
        // Processamos cada disciplina para verificar se ela "pode" ser escolhida
        this.possiveisSlot = resp.map(disc => {
          // Mapeia as turmas da disciplina injetando a informação de conflito
          const turmasProcessadas = disc.turmas.map(t => {
            const conflito = this.checarConflito(t, disc.nome);
            return {
              ...t,
              conflito: conflito // null se livre, objeto com detalhes se ocupado
            };
          });

          return {
            ...disc,
            turmas: turmasProcessadas,
            podeAdicionar: turmasProcessadas.some(t => !t.conflito) // Ao menos uma turma livre
          };
        });
        
        this.exibirModalSlot = true;
      }
    );
  }

  adicionarPeloSlot(disc: any, turma: any) {
    // Se houver conflito, em vez de apenas retornar, abrimos o modal de conflito
    if (turma.conflito) {
      this.conflitoInfo = {
        turmaNova: { 
          nome: disc.nome, 
          professor: turma.professor, 
          horario: turma.horario 
        },
        turmaExistente: turma.conflito // O objeto de conflito já foi calculado no onSlotClick
      };
      
      this.exibirModalSlot = false;
      this.exibirModalConflito = true;
      return; 
    }

    // Lógica normal de adição caso NÃO haja conflito
    let discExistente = this.selecionadas.find(d => d.nome === disc.nome);

    if (!discExistente) {
      discExistente = { 
        ...disc, 
        expandida: false, 
        cor: this.gerarCorHex(disc.nome) 
      };
      this.selecionadas.push(discExistente);
    }

    discExistente.selectedTurmaId = turma.id;
    this.exibirModalSlot = false; // Fecha o seletor de slots
  }

  abrirModalResumo() {
    this.exibirModalResumo = true;
  }

  fecharModalResumo() {
    this.exibirModalResumo = false;
  }

  abrirModalSalvar() {
    if(this.selecionadas.length >= 3){
      if(this.nomeCronograma){
        this.cronService.deleteCron(this.nomeCronograma).subscribe({
          next: () => this.modalSalvarAberto = true,
          error: () => this.mostrarMensagem("Erro ao excluir cronograma (" + this.nomeCronograma + ").", "warning")
        });
      }
      this.modalSalvarAberto = true;
    }
    else this.mostrarMensagem("Para salvar é preciso escolher no minímo 3 turmas.", "warning")
  }

  fecharSalvar(){
    if(this.editing){
      this.modalSalvarAberto = false;
    }
    else{
      this.modalSalvarAberto = false;
      this.nomeCronograma = '';
    }
  }

  confirmarSalvamento() {
    const disciplinasParaSalvar: CronPart[] = this.selecionadas.map(s => {
      const turma = s.turmas.find((t: any) => t.id === s.selectedTurmaId);
      
      // Usamos o seu método getHorariosAgrupados aqui
      const agrupados = this.getHorariosAgrupados(turma?.horario);

      return {
        codigo_disc: s.codigo || 'S/C',
        nome_disc: s.nome,
        nome_prof: turma?.professor || 'A Definir',
        // Mapeamos o seu "codigos" para "codigo_horario" que o Java exige
        horarios: agrupados.map(item => ({
          dia: item.dia,
          codigo_horario: item.codigos // Transforma 'codigos' em 'codigo_horario'
        }))
      };
    });

    const request: CronRequest = {
      nome_cronograma: this.nomeCronograma,
      disciplinas: disciplinasParaSalvar
    };

    // Primeiro exclui se existir e depois salva
    this.cronService.deleteCron(this.nomeCronograma).subscribe({
      next: () => {
        this.cronService.saveCron(request).subscribe({
          next: () => {
            this.modalSalvarAberto = false;
            this.router.navigate(['/home/cronogramas']);
          },
          error: () => this.mostrarMensagem("Erro ao salvar cronograma (" + this.nomeCronograma + ").", "warning")
        })
      },
      error: () => this.mostrarMensagem("Erro ao excluir cronograma (" + this.nomeCronograma + ").", "warning")
    }
    );

    
  }

  carregarDadosParaEdicao(nome: string) {
    this.nomeCronograma = nome;
    this.selecionadas = [];

    this.cronService.getCronByNome(nome).subscribe({
      next: (cron: CronRequest) => {
        this.mostrarMensagem(`Editando cronograma: ${cron.nome_cronograma}`, 'info');

        cron.disciplinas.forEach(part => {
          this.cronogramaService.buscar(part.codigo_disc).subscribe({
            next: (res: any) => {
              // Garante que pegamos a disciplina correta da resposta da busca
              const discCompleta = Array.isArray(res) 
                ? res.find((d: any) => d.codigo === part.codigo_disc)
                : res;
              
              if (discCompleta) {
                // --- VALIDAÇÃO TRIPLA: Código, Professor e Assinatura de Horário ---
                const turmaIdentica = discCompleta.turmas.find((t: any) => {
                  // 1. Validar Professor (ignorando espaços extras e case sensitive)
                  const profBate = t.professor.trim().toLowerCase() === part.nome_prof.trim().toLowerCase();
                  if (!profBate) return false;

                  // 2. Agrupar horários da turma da API para comparar com o formato salvo
                  const horariosTurmaAPI = this.getHorariosAgrupados(t.horario);
                  
                  // 3. Validar Assinatura de Horário (Quantidade de dias)
                  if (horariosTurmaAPI.length !== part.horarios.length) return false;

                  // 4. Validar cada slot de horário
                  return part.horarios.every(hSalvo => {
                    const correspondente = horariosTurmaAPI.find(hAPI => hAPI.dia === hSalvo.dia);
                    if (!correspondente) return false;
                    
                    // Compara os arrays de códigos ordenados (ex: ['M1', 'M2'])
                    return JSON.stringify(correspondente.codigos.sort()) === 
                          JSON.stringify(hSalvo.codigo_horario.sort());
                  });
                });

                this.selecionadas.push({
                  ...discCompleta,
                  // Se a tríade bateu, temos o ID correto da turma deste semestre
                  selectedTurmaId: turmaIdentica ? turmaIdentica.id : null,
                  expandida: false,
                  cor: this.gerarCorHex(discCompleta.nome)
                });

                if (!turmaIdentica) {
                  console.warn(`Turma de ${part.nome_disc} não encontrada com a mesma configuração. Pode ter havido troca de professor ou horário no semestre atual.`);
                }
              }
            }
          });
        });
      }
    });
  }

  pararEdicao(){
    this.nomeCronograma = '';
    this.router.navigate(['/home/my-cronograma']);
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

  private mostrarMensagem(msg: string, tipo: 'success' | 'warning' | 'info' = 'info') {
    this.infoMessage = msg;
    this.infoType = tipo;
    this.info = true;

    // Auto-hide após 10 segundos
    setTimeout(() => {
      this.info = false;
    }, 10000);
  }
}