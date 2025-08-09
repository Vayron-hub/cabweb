import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AuthGuard } from './guards/auth.guard';
import { ClienteDashboard } from './components/cliente-dashboard/cliente-dashboard';
import { ClienteLayout } from './components/cliente-layout/cliente-layout';
import { ClienteGuard } from './guards/cliente.guard';
import { AdminGuard } from './guards/admin.guard';
import { SuperAdminGuard } from './guards/superadmin.guard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'login/:type', component: Login },
  { path: 'registro', component: Registro },
  {
    path: 'cotizacion',
    loadComponent: () => import('./components/cotizacion/cotizacion.component').then(m => m.CotizacionComponent)
  },
  
  // Redirecciones de rutas antiguas
  { 
    path: 'dashboard', 
    redirectTo: '/admin/dashboard',
    pathMatch: 'full',
  },
  { 
    path: 'clientedashboard', 
    redirectTo: '/guest/dashboard',
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
  
  // RUTAS ADMIN
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
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
  
  // RUTAS CLIENTE
  {
    path: 'guest',
    canActivate: [AuthGuard, ClienteGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: ClienteDashboard
      }
    ]
  },
  
  // RUTAS CLIENTE (ruta alternativa)
  { 
    path: 'cliente', 
    component: ClienteLayout, 
    canActivate: [AuthGuard, ClienteGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ClienteDashboard }
    ]
  },
  
  // RUTAS SUPERADMIN
  {
    path: 'superadmin',
    component: AdminLayoutComponent, // o crear un SuperAdminLayoutComponent
    canActivate: [AuthGuard, SuperAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: AdminDashboardComponent // o crear SuperAdminDashboardComponent
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