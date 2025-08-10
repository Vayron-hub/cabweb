import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { BackendService } from '../services/backend.service';
import { map, Observable, of, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  
  constructor(
    private authservice: AuthService,
    private backendservice: BackendService, 
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const userId = this.backendservice.getCurrentUser()?.id || route.params['id'];
    
    if (!this.authservice.isLoggedIn()) {
      console.log('❌ Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return of(false);
    }

    const currentUser = this.backendservice.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.log('❌ No hay usuario actual, redirigiendo a login');
      this.router.navigate(['/login']);
      return of(false);
    }

    return this.backendservice.getRole(userId).pipe(
      map((role: string) => {
        console.log('🔍 SuperAdminGuard - Rol obtenido:', role);
        
        if (role === 'superadmin') {
          console.log('✅ Usuario es superadmin, permitiendo acceso');
          return true;
        } else if (role === 'admin') {
          console.log('⚠️ Usuario es admin, redirigiendo a dashboard admin');
          this.router.navigate(['/admin/dashboard']);
          return false;
        } else if (role === 'client' || role === 'cliente') {
          console.log('⚠️ Usuario es cliente, redirigiendo a dashboard cliente');
          this.router.navigate(['/guest/dashboard']);
          return false;
        } else {
          console.log('❌ Rol desconocido, denegando acceso:', role);
          this.router.navigate(['/login']);
          return false;
        }
      }),
      catchError(error => {
        console.error('❌ Error en SuperAdminGuard:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}