import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';

export const authGuard: CanActivateChildFn = (childRoute, state) => {
  const router = inject(Router);

  // Verificamos se existe um token (ou qualquer sinal de login) no navegador
  const isAuthenticated = !!localStorage.getItem('token');

  if (isAuthenticated) {
    return true; // Se está logado, permite acessar as rotas filhas
  } else {
    // Se não está logado, redireciona para a tela de login
    return router.parseUrl('/login');
  }
};