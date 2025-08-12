import { Routes } from '@angular/router';
import { Landing } from './components/landing/landing';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { AuthGuard } from './guards/auth.guard';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { CotizacionComponent } from './components/cotizacion/cotizacion';
import { EstadisticasComponent } from './components/estadisticas/estadisticas';
import { UsuariosComponent } from './components/usuarios/usuarios';
import { ZonasComponent } from './components/zonas/zonas';
import { ClasificadoresComponent } from './components/clasificadores/clasificadores';
import { ProductosComponent } from './components/productos/productos';
import { ProveedoresComponent } from './components/proveedores/proveedores';
import { MateriasPrimasComponent } from './components/materiasprimas/materiasprimas';
import { ComprasComponent } from './components/compras/compras';
import { CotizacionesComponent } from './components/cotizaciones/cotizaciones';
import { InventarioComponent } from './components/inventario/inventario';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'login/:type', component: Login },
  { path: 'registro', component: Registro },
  {
    path: 'cotizacion',
    component: CotizacionComponent,
  },

  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'estadisticas',
        component: EstadisticasComponent,
      },
      {
        path: 'zonas',
        component: ZonasComponent,
      },
      {
        path: 'clasificadores',
        component: ClasificadoresComponent,
      },
      {
        path: 'productos',
        component: ProductosComponent,
      },
      {
        path: 'proveedores',
        component: ProveedoresComponent,
      },
      {
        path: 'materiasprimas',
        component: MateriasPrimasComponent,
      },
      {
        path: 'compras',
        component: ComprasComponent,
      },
      {
        path: 'cotizaciones',
        component: CotizacionesComponent,
      },
      {
        path: 'inventario',
        component: InventarioComponent,
      },
      {
        path: 'producto',
        component: InventarioComponent,
      },
      {
        path: 'usuarios',
        component: UsuariosComponent,
      },
    ],
  },
  { path: 'dashboard', redirectTo: 'app/dashboard', pathMatch: 'full' },

  { path: '**', redirectTo: '' },
];