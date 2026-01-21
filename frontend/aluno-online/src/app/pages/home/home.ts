import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuSuperior } from '../../components/menu-superior/menu-superior';
import { MenuLateral } from '../../components/menu-lateral/menu-lateral';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-home',
  standalone: true, // Certifique-se de que é standalone se estiver usando imports diretos
  imports: [CommonModule, MenuSuperior, MenuLateral, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home{
  menuAbertoLateral = false;

  toggleMenu() {
    this.menuAbertoLateral = !this.menuAbertoLateral;
  }
}