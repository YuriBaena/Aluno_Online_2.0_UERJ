import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Aluno } from '../aluno/aluno';

@Component({
  selector: 'app-menu-superior',
  standalone: true,
  imports: [CommonModule, Aluno],
  templateUrl: './menu-superior.html',
  styleUrl: './menu-superior.scss',
})
export class MenuSuperior {
  @Output() onSanduicheClick = new EventEmitter<void>();

  clicouNoMenu() {
    console.log('1. Clique detectado no Menu Superior');
    this.onSanduicheClick.emit();
  }
}
