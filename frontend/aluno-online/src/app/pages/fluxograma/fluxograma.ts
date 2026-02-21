import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FluxogramaService, DisciplinaFluxogramaDTO } from '../../services/fluxograma-service';

interface DisciplinaUI extends DisciplinaFluxogramaDTO {
  periodoDisplay: number;
}

@Component({
  selector: 'app-fluxograma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fluxograma.html',
  styleUrl: './fluxograma.scss',
})
export class Fluxograma implements OnInit, OnDestroy {
  private fluxogramaService = inject(FluxogramaService);
  
  // Dados fundamentais
  disciplinas = signal<DisciplinaUI[]>([]);
  periodosOrdenados = signal<number[]>([]);
  paths = signal<string[]>([]);

  // Estado de Interatividade (Click em vez de Hover)
  activeId = signal<string | null>(null);
  highlightedIds = signal<Set<string>>(new Set());

  // Listeners para limpeza posterior
  private resizeListener = () => this.desenharSetas();
  private scrollContainers: HTMLElement[] = [];

  ngOnInit() {
    this.fluxogramaService.getFluxograma().subscribe(data => {
      const listaProcessada: DisciplinaUI[] = data.map(d => ({
        ...d,
        periodoDisplay: d.periodo === 0 ? 99 : d.periodo 
      }));
      
      this.disciplinas.set(listaProcessada);

      const p = [...new Set(listaProcessada.map(d => d.periodoDisplay))].sort((a, b) => a - b);
      this.periodosOrdenados.set(p);

      // Aguarda renderização para calcular posições e scroll
      setTimeout(() => {
        this.desenharSetas();
        this.setupScrollListeners();
      }, 600);

      window.addEventListener('resize', this.resizeListener);
    });
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
    this.scrollContainers.forEach(container => {
      container.removeEventListener('scroll', this.resizeListener);
    });
  }

  private setupScrollListeners() {
    const containers = document.querySelectorAll('.cards-stack');
    containers.forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.addEventListener('scroll', this.resizeListener);
      this.scrollContainers.push(htmlEl);
    });
  }

  // --- Lógica de Interação (Toggle Click) ---

  onDisciplinaClick(codigo: string) {
    if (this.activeId() === codigo) {
      this.limparDestaque();
      return;
    }

    this.activeId.set(codigo);
    const chain = new Set<string>();
    this.calcularCadeiaRequisitos(codigo, chain);
    this.highlightedIds.set(chain);

    // --- NOVA LÓGICA: SCROLL AUTOMÁTICO ---
    // Aguarda um pequeno frame para o Angular aplicar as classes de destaque
    requestAnimationFrame(() => {
      chain.forEach(reqId => {
        // Não fazemos scroll no que acabamos de clicar, apenas nos seus requisitos
        if (reqId === codigo) return;

        const element = document.getElementById(reqId);
        if (element) {
          // block: 'nearest' faz com que ele só dê scroll se o item estiver fora da visão
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      });
      
      // Como o scroll mudou a posição dos cards, precisamos redesenhar as setas
      // O seu listener de scroll já deve tratar isso, mas um trigger manual garante a precisão
      setTimeout(() => this.desenharSetas(), 300); 
    });
  }

  limparDestaque() {
    this.activeId.set(null);
    this.highlightedIds.set(new Set());
  }

  private calcularCadeiaRequisitos(codigo: string, chain: Set<string>) {
    if (chain.has(codigo)) return;
    chain.add(codigo);

    const disc = this.disciplinas().find(d => d.codigo === codigo);
    if (disc?.grupos_requisitos) {
      disc.grupos_requisitos.forEach(grupo => {
        grupo.disciplinas.forEach(preReqCodigo => {
          this.calcularCadeiaRequisitos(preReqCodigo, chain);
        });
      });
    }
  }

  isDimmed(codigo: string): boolean {
    if (!this.activeId()) return false;
    return !this.highlightedIds().has(codigo);
  }

  // --- Lógica de Layout e Setas ---

  getDisciplinasPorPeriodo(p: number) {
    return this.disciplinas().filter(d => d.periodoDisplay === p);
  }

  desenharSetas() {
    requestAnimationFrame(() => {
      const novasSetas: string[] = [];
      const container = document.querySelector('.fluxograma-content') as HTMLElement;
      if (!container) return;

      const rectContainer = container.getBoundingClientRect();

      this.disciplinas().forEach(target => {
        target.grupos_requisitos?.forEach(grupo => {
          grupo.disciplinas.forEach(preReqCodigo => {
            const elFrom = document.getElementById(preReqCodigo);
            const elTo = document.getElementById(target.codigo);

            if (elFrom && elTo) {
              const rFrom = elFrom.getBoundingClientRect();
              const rTo = elTo.getBoundingClientRect();

              // Coordenadas relativas ao container principal
              const x1 = rFrom.right - rectContainer.left;
              const y1 = rFrom.top + rFrom.height / 2 - rectContainer.top;
              const x2 = rTo.left - rectContainer.left;
              const y2 = rTo.top + rTo.height / 2 - rectContainer.top;

              const midX = x1 + (x2 - x1) / 2;
              const path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
              novasSetas.push(path);
            }
          });
        });
      });
      this.paths.set(novasSetas);
    });
  }
}