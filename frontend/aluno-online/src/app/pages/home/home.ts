import { Component, OnInit } from '@angular/core'; // Importe OnInit
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MenuSuperior } from '../../components/menu-superior/menu-superior';

@Component({
  selector: 'app-home',
  standalone: true, // Certifique-se de que é standalone se estiver usando imports diretos
  imports: [CommonModule, MenuSuperior],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home{

}