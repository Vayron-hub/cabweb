import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { BackendService } from '../services/backend.service';
import { map, Observable, of, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private backendService: BackendService, 
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log('🛡️ AdminGuard - Verificando acceso a:', state.url);
    
    // 1. Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      console.log('❌ Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    }

    // 2. Obtener el usuario actual
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('❌ No se pudo obtener el usuario actual');
      this.router.navigate(['/login']);
      return of(false);
    }

    console.log('👤 Usuario actual:', currentUser);

    // 3. Si el usuario ya tiene rol en el objeto, usarlo directamente
    if (currentUser.rol) {
      console.log('🔍 Rol encontrado en usuario:', currentUser.rol);
      return this.handleRoleRedirection(currentUser.rol);
    }

    // 4. Si no tiene rol, obtenerlo del backend
    return this.backendService.getRole(Number(currentUser.id)).pipe(
      map((role: string) => {
        console.log('🔍 AdminGuard - Rol obtenido del backend:', role);
        return this.handleRoleLogic(role);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo rol del backend:', error);
        // Si falla el backend, intentar usar el rol del usuario local
        if (currentUser.rol) {
          console.log('🔄 Usando rol local como fallback:', currentUser.rol);
          return of(this.handleRoleLogic(currentUser.rol));
        }
        console.log('❌ No se pudo determinar el rol, redirigiendo a login');
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  private handleRoleRedirection(role: string): Observable<boolean> {
    return of(this.handleRoleLogic(role));
  }

  private handleRoleLogic(role: string): boolean {
    const roleNormalized = role.toLowerCase();
    
    console.log('🎭 Procesando rol:', roleNormalized);

    switch (roleNormalized) {
      case 'admin':
      case 'administrador':
        console.log('✅ Acceso permitido para admin');
        return true;

      case 'superadmin':
      case 'super_admin':
        console.log('🔀 Redirigiendo a superadmin dashboard');
        // CORREGIDA: La ruta correcta según tu routing
        this.router.navigate(['/superadmin/dashboard']);
        return false;

      case 'client':
      case 'cliente':
      case 'usuario':
        console.log('🔀 Redirigiendo a cliente dashboard');
        this.router.navigate(['/cliente/dashboard']);
        return false;

      default:
        console.log('❌ Rol no reconocido:', role);
        this.router.navigate(['/login']);
        return false;
    }
  }
}