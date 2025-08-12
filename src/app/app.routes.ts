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
    component: SuperadminLayout,
    canActivate: [AuthGuard, SuperAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: SuperadminDashboard
      },
      // Rutas específicas de superadmin como componentes separados si lo prefieres
      {
        path: 'productos',
        loadComponent: () => import('./components/productos/productos.component').then(m => m.ProductosComponent)
      },
      {
        path: 'materiasprimas',
        loadComponent: () => import('./components/materiasprimas/materiasprimas.component').then(m => m.MateriasPrimasComponent)
      },
      {
        path: 'proveedores', 
        loadComponent: () => import('./components/proveedores/proveedores.component').then(m => m.ProveedoresComponent)
      },
      {
        path: 'compras',
        loadComponent: () => import('./components/compras/compras.component').then(m => m.ComprasComponent)
      },
      {
        path: 'ventas',
        loadComponent: () => import('./components/ventas/ventas.component').then(m => m.VentasComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./components/usuarios/usuarios.js').then(m => m.UsuariosComponent)
      },
    ]
  },
  
  { path: '**', redirectTo: '' }
];