import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { BackendService } from '../services/backend.service';
import { map, Observable, of, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClienteGuard implements CanActivate {
  
  constructor(
    private authservice: AuthService,
    private backendservice: BackendService, 
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
const userId = this.backendservice.getCurrentUser()?.id || route.params['id'];
    
    // Verificar primero si está autenticado
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
        console.log('🔍 ClientGuard - Rol obtenido:', role);
        if (role === 'client' || role === 'cliente') {
          return true;
        } else if (role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
          return false;
        } else if (role === 'superadmin') {
          this.router.navigate(['/superadmin/dashboard']);
          return false;
        } else {
          // Rol desconocido, asumir cliente por defecto
          console.log('⚠️ Rol desconocido, asumiendo cliente:', role);
          return true;
        }
      }),
      catchError(error => {
        console.error('❌ Error en ClientGuard:', error);
        // En caso de error, redirigir a login
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}