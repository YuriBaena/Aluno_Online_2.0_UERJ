import { Routes } from '@angular/router';
import { Login } from './pages/login/login'
import { Register } from './pages/register/register'
import { Home } from './pages/home/home'
import { authGuard } from './guards/auth-guard'

export const routes: Routes = [
  { path: 'registrar', component: Register },
  { path: 'login', component: Login },
  {
    path: '', // Rota pai
    canActivateChild: [authGuard], // Seu guarda entra aqui!
    children: [
      {path: 'home', component: Home},
    ]
  }
];
