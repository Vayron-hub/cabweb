import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { BackendService } from '../services/backend.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authservice: AuthService,
    private backendService: BackendService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (!this.authservice.isLoggedIn()) {
      console.log('❌ Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return of(false);
    }

    const currentUser = this.backendService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.log('❌ No hay usuario actual, redirigiendo a login');
      this.router.navigate(['/login']);
      return of(false);
    }

  // En el nuevo esquema permitimos acceso si está logueado; el filtrado de vistas se hace en el frontend
  return of(true);
  }

  /**
   * Normaliza los nombres de roles para comparación consistente
   */
  private normalizeRole(role: string): string {
    return role.toLowerCase().trim();
  }

  /**
   * Redirige al usuario a su dashboard correspondiente según su rol
   */
  private redirectByRole(userRole: string): void {
  // Todos los roles usan ahora el mismo dashboard
  this.router.navigate(['/app/dashboard']);
  }
}
