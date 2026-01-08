import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.scss',
})
export class MenuLateral {
  aba_aberta: string = 'dashboard';
  private _isOpen: boolean = false;

  @Output() onClose = new EventEmitter<void>();

  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  constructor(private router: Router) {
    // Sempre que a navegação terminar, verificamos a URL
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.atualizarAbaAtiva(event.url);
    });
  }

  atualizarAbaAtiva(url: string) {
    if (url.includes('dashboard')) this.aba_aberta = 'dashboard';
    if (url.includes('disciplinas-curso')) this.aba_aberta = 'disciplinas-curso';
    if (url.includes('disciplinas-realizadas')) this.aba_aberta = 'disciplinas-realizadas';
    if (url.includes('historico')) this.aba_aberta = 'hitorico';
    if (url.includes('grade-horaria')) this.aba_aberta = 'grade-horaria';
    if (url.includes('my-cronograma')) this.aba_aberta = 'monte seu cronograma';
  }
  
  fechar() {
    this.onClose.emit();
  }

    get isOpen(): boolean {
    return this._isOpen;
  }

}