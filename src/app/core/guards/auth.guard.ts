import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, first } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    first(),
    map(user => (user ? true : router.createUrlTree(['/login']))),
  );
};
