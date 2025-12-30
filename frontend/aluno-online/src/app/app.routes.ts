import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Home } from './pages/home/home';
import { NotFound } from './pages/not-found/not-found';
import { Dashboard } from './pages/dashboard/dashboard';

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
   * Usamos o componente 'Home' como base para o Menu Lateral e Superior.
   */
  {
    path: '', 
    canActivateChild: [authGuard], 
    children: [
      { 
        path: 'home', 
        component: Home,
        children: [
          /**
           * ROTA PADRÃO DO HOME (Dashboard)
           * Quando o usuário acessar '/home', o Angular verá este redirecionamento
           * e carregará o componente Dashboard dentro do router-outlet do Home.
           */
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          
          /**
           * COMPONENTE DASHBOARD
           * URL: /home/dashboard
           */
          { path: 'dashboard', component: Dashboard },

          /**
           * FUTURAS ROTAS FILHAS
           * Ex: { path: 'materias', component: Materias } -> URL: /home/materias
           */
        ]
      },
    ]
  },

  /**
   * ROTA CURINGA (404)
   * Captura qualquer URL que não coincida com as rotas acima.
   * Deve ser sempre a ÚLTIMA rota do array.
   */
  { path: '**', component: NotFound }
];