import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'forge/1',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'forge',
    loadChildren: () => import('./features/forge/forge.routes').then(m => m.forgeRoutes),
  },
  {
    path: 'dashboard',
    redirectTo: 'forge/1',
    pathMatch: 'full',
  },
];
