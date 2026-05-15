import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/config/auth.guard';

export const routes: Routes = [
  {
    path: '404',
    loadComponent: () =>
      import('./shared/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/signup/signup.component').then(
        (m) => m.SignupComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    data: {
      expectedRoles: ['admin']
    },
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: '403',
    loadComponent: () =>
      import('./shared/access-denied/access-denied.component').then(
        (m) => m.AccessDeniedComponent,
      ),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: '404' },
];
