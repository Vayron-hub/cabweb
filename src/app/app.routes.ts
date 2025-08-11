import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { AuthGuard } from './guards/auth.guard';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './components/dashboard/dashboard';

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
    path: 'app',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'estadisticas', loadComponent: () => import('./components/estadisticas/estadisticas.js').then(m => m.EstadisticasComponent) },
      { path: 'usuarios', loadComponent: () => import('./components/usuarios/usuarios.js').then(m => m.UsuariosComponent) },
      { path: 'zonas', loadComponent: () => import('./components/zonas/zonas.js').then(m => m.ZonasComponent) },
      { path: 'clasificadores', loadComponent: () => import('./components/clasificadores/clasificadores.js').then(m => m.ClasificadoresComponent) }
    ]
  },
  { path: 'dashboard', redirectTo: 'app/dashboard', pathMatch: 'full' },
  
  { path: '**', redirectTo: '' }
];