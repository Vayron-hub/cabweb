import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { TestAdminDashboard } from './components/admin-dashboard/test-admin';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'login/:type', component: Login }, // Para recibir el tipo desde landing
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [AuthGuard]
  },
  { 
    path: 'dashboard/:type', // Para dashboard con tipo específico
    component: Dashboard,
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin', 
    component: TestAdminDashboard,
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin/:type', // Para admin con tipo específico de zona
    component: TestAdminDashboard,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];
