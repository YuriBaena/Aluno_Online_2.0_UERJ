import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Home } from './pages/home/home';
import { NotFound } from './pages/not-found/not-found';

// Importação dos Guardiões de Rota
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  /**
   * ROTA DE REGISTRO
   * Proteção Dupla: 
   * 1. authGuard: Garante que o usuário está logado.
   * 2. adminGuard: Garante que o usuário logado possui nível de ADMIN.
   */
  { 
    path: 'registrar', 
    component: Register, 
    canActivate: [authGuard, adminGuard] 
  },
  
  /** * ROTAS PÚBLICAS 
   * Acessíveis por qualquer pessoa (mesmo sem token).
   */
  { path: '', component: Login },
  { path: 'login', component: Login },
  
  /**
   * GRUPO DE ROTAS PROTEGIDAS (ALUNOS/USUÁRIOS)
   * O 'canActivateChild' aplica o authGuard em todas as rotas filhas.
   * Basta estar logado para acessar o que estiver dentro deste children.
   */
  {
    path: '', 
    canActivateChild: [authGuard], 
    children: [
      { path: 'home', component: Home },
      // Adicione outras rotas de usuários logados aqui
    ]
  },

  /**
   * ROTA CURINGA (404)
   * Captura qualquer URL que não coincida com as rotas acima.
   * Deve ser sempre a ÚLTIMA rota do array.
   */
  { path: '**', component: NotFound }
];