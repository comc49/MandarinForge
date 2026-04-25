import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'forge',
    loadChildren: () => import('./features/forge/forge.routes').then(m => m.forgeRoutes),
  },
];
