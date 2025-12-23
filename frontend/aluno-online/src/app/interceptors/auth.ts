import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Pega o token do LocalStorage
  const token = localStorage.getItem('token');

  // 2. Se tiver token, "carimba" a requisição
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  // 3. Se não tiver, segue viagem normal (ex: tela de login)
  return next(req);
};