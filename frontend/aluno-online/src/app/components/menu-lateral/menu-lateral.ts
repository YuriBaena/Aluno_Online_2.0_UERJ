import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.scss',
})
export class MenuLateral {
  @Input() set isOpen(value: boolean) {
    console.log('3. Menu Lateral recebeu o valor:', value);
    this._isOpen = value;
  }
  
  get isOpen(): boolean {
    return this._isOpen;
  }

  private _isOpen: boolean = false;

  @Output() onClose = new EventEmitter<void>();

  fechar() {
    console.log('Log: Fechando o menu lateral...');
    this.onClose.emit();
  }
}