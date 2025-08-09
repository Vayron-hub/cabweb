import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AuthGuard } from './guards/auth.guard';

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
    // Redirigir dashboard viejo al nuevo admin layout
    path: 'dashboard', 
    redirectTo: '/admin',
    pathMatch: 'full'
  },
  { 
    // Redirigir dashboard viejo con tipo al nuevo admin layout
    path: 'dashboard/:type',
    redirectTo: '/admin',
    pathMatch: 'full'
  },
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
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
  { path: '**', redirectTo: '' }
];