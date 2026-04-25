import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const forgeRoutes: Routes = [
  {
    path: ':characterId',
    canActivate: [authGuard],
    loadComponent: () => import('./forge.component').then(m => m.ForgeComponent),
  },
];
