import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      
      // Lógica de Admin: Verifique se o campo role é 'ROLE_ADMIN'
      // ou se o e-mail pertence ao domínio de administração
      if (decoded.role === 'ROLE_ADMIN') { 
        return true; 
      }
    } catch (e) {
      console.error('Token inválido');
    }
  }

  // Redireciona se não for admin
  router.navigate(['/home']);
  return false;
};