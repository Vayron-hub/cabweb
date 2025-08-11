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

    const requiredRole = route.data['role'] as string;
    
    if (!requiredRole) {
      console.log('✅ Usuario autenticado - sin restricciones de rol');
      return of(true);
    }

    const userId = currentUser.id;
    return this.backendService.getRole(Number(userId)).pipe(
      map((userRole: string) => {
        if (userRole === requiredRole) {
          return true;
        }

        this.redirectByRole(userRole);
        return false;
      }),
      catchError(error => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
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
    switch (userRole) {
      case 'Cliente':
        this.router.navigate(['/cliente/dashboard']);
        break;
      case 'Admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'SuperAdmin':
        this.router.navigate(['/superadmin/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
