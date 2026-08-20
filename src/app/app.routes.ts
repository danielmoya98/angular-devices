import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@pages/dashboard/dashboard.component').then(m => m.DashboardPageComponent)
      },
      {
        path: 'devices',
        loadComponent: () => import('@pages/devices/devices-page.component').then(m => m.DevicesPageComponent)
      },
      {
        path: 'locations',
        loadComponent: () => import('@pages/blocks-classrooms/blocks-classrooms.component').then(m => m.BlocksClassroomsPageComponent)
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('@pages/users/users-page.component').then(m => m.UsersPageComponent)
      },
      {
        path: 'replacements',
        loadComponent: () => import('@pages/replacements/replacements-page.component').then(m => m.ReplacementsPageComponent)
      },
      {
        path: 'inspections',
        loadComponent: () => import('@pages/inspections/inspections-page.component').then(m => m.InspectionsPageComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('@pages/settings/settings-page.component').then(m => m.SettingsPageComponent)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
