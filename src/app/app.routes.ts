import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AuthGuard } from './guards/auth.guard';
import { ClienteComentarios } from './components/cliente-comentarios/cliente-comentarios';
import { ClienteLayout } from './components/cliente-layout/cliente-layout';
import { ClienteGuard } from './guards/cliente.guard';
import { AdminGuard } from './guards/admin.guard';
import { SuperAdminGuard } from './guards/superadmin.guard';
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
  
  // Redirecciones de rutas antiguas
  { 
    path: 'dashboard', 
    redirectTo: '/admin/dashboard',
    pathMatch: 'full',
  },
  { 
    path: 'comentarios', 
    redirectTo: '/cliente/comentarios',
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
        loadComponent: () => import('./components/estadisticas/estadisticas').then(m => m.EstadisticasComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./components/usuarios/usuarios').then(m => m.UsuariosComponent)
      },
      {
        path: 'zonas',
        loadComponent: () => import('./components/zonas/zonas').then(m => m.ZonasComponent)
      },
      {
        path: 'clasificadores',
        loadComponent: () => import('./components/clasificadores/clasificadores').then(m => m.ClasificadoresComponent)
      }
    ]
  },
  
  // RUTAS CLIENTE (ruta alternativa)
  { 
    path: 'cliente', 
    component: ClienteLayout, 
    canActivate: [AuthGuard, ClienteGuard],
    children: [
      { path: '', redirectTo: 'comentarios', pathMatch: 'full' },
      { path: 'comentarios', component: ClienteComentarios },
      {
        path: 'comprar',
        loadComponent: () => import('./components/cliente-comprar/comprar').then(m => m.ClienteComprar)
      },
      {
        path: 'inventario',
        loadComponent: () => import('./components/cliente-inventario/inventario').then(m => m.ClienteInventario)
      },
    ]
  },
  
  // RUTAS SUPERADMIN
  {
    path: 'superadmin',
    component: SuperadminLayout, // o crear un SuperAdminLayoutComponent
    canActivate: [AuthGuard, SuperAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: SuperadminDashboard // o crear SuperAdminDashboardComponent
      },
      // Rutas específicas de superadmin
      {
        path: 'usuarios',
        loadComponent: () => import('./components/usuarios/usuarios').then(m => m.UsuariosComponent)
      },
    ]
  },
  
  { path: '**', redirectTo: '' }
];