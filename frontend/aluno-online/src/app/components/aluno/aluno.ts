import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UsuarioToken } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-aluno',
  imports: [CommonModule],
  templateUrl: './aluno.html',
  styleUrl: './aluno.scss',
})
export class Aluno implements OnInit {

  usuario: UsuarioToken | null = null;
  isDropdownOpen = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.usuario = this.auth.getUsuario();
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) return '';

    const names = fullName.trim().split(' ');
    
    if (names.length === 1) {
      return names[0][0].toUpperCase();
    }

    const firstInitial = names[0][0];
    const lastInitial = names[names.length - 1][0];

    return (firstInitial + lastInitial).toUpperCase();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
