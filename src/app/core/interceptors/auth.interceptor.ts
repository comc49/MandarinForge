import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth, getIdToken } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);

  const auth = inject(Auth);
  const user = auth.currentUser;
  if (!user) return next(req);

  return from(getIdToken(user)).pipe(
    switchMap(token =>
      next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })),
    ),
  );
};
