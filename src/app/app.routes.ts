import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AuthGuard } from './guards/auth.guard';
import { ClienteDashboard } from './components/cliente-dashboard/cliente-dashboard';
import { ClienteLayout } from './components/cliente-layout/cliente-layout';
import { SuperadminLayout } from './components/superadmin-layout/superadmin-layout';
import { SuperadminDashboard } from './components/superadmin-dashboard/superadmin-dashboard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'login/:type', component: Login },
  { path: 'registro', component: Registro },
  {
    path: 'cotizacion',
    loadComponent: () => import('./components/cotizacion/cotizacion.component').then(m => m.CotizacionComponent)
  },
  
  { 
    path: 'dashboard', 
    redirectTo: '/admin/dashboard',
    pathMatch: 'full',
  },
  { 
    path: 'clientedashboard', 
    redirectTo: '/cliente/dashboard',
    pathMatch: 'full',
  },
  { 
    path: 'superadmindashboard', 
    redirectTo: '/superadmin/dashboard',
    pathMatch: 'full',
  },
  { 
    path: 'dashboard/:type',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full'
  },
  
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'Admin' }, // Especificar rol requerido
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      {
        path: 'estadisticas',
        loadComponent: () => import('./components/estadisticas/estadisticas.js').then(m => m.EstadisticasComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./components/usuarios/usuarios.js').then(m => m.UsuariosComponent)
      },
      {
        path: 'zonas',
        loadComponent: () => import('./components/zonas/zonas.js').then(m => m.ZonasComponent)
      },
      {
        path: 'clasificadores',
        loadComponent: () => import('./components/clasificadores/clasificadores.js').then(m => m.ClasificadoresComponent)
      }
    ]
  },
  
  { 
    path: 'cliente', 
    component: ClienteLayout, 
    canActivate: [AuthGuard],
    data: { role: 'Cliente' }, // Especificar rol requerido
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ClienteDashboard }
    ]
  },
  
  {
    path: 'superadmin',
    component: SuperadminLayout,
    canActivate: [AuthGuard],
    data: { role: 'SuperAdmin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: SuperadminDashboard // o crear SuperAdminDashboardComponent
      },
      // Rutas específicas de superadmin
      {
        path: 'usuarios',
        loadComponent: () => import('./components/usuarios/usuarios.js').then(m => m.UsuariosComponent)
      },
    ]
  },
  
  { path: '**', redirectTo: '' }
];