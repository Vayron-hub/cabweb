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
    private authService: AuthService,
    private backendService: BackendService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log('🛡️ ClienteGuard - Verificando acceso a:', state.url);
    
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
    console.log('🎭 Rol del usuario:', currentUser.rol);

    // 3. Si el usuario ya tiene rol en el objeto, usarlo directamente
    if (currentUser.rol) {
      console.log('🔍 Rol encontrado en usuario:', currentUser.rol);
      return of(this.handleRoleLogic(currentUser.rol));
    }

    // 4. Si no tiene rol, obtenerlo del backend
    return this.backendService.getRole(Number(currentUser.id)).pipe(
      map((role: string) => {
        console.log('🔍 ClienteGuard - Rol obtenido del backend:', role);
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

  private handleRoleLogic(role: string): boolean {
    const roleNormalized = role.toLowerCase();
    
    console.log('🎭 Procesando rol para Cliente:', roleNormalized);

    // Verificar si es Cliente (múltiples variantes posibles)
    if (this.isCliente(roleNormalized)) {
      console.log('✅ Acceso permitido para Cliente');
      return true;
    }

    // Si no es Cliente, redirigir según el rol
    console.log('❌ No es Cliente, redirigiendo según rol');
    this.redirectBasedOnRole(roleNormalized);
    return false;
  }

  private isCliente(role: string): boolean {
    const clienteRoles = [
      'cliente',
      'client',
      'usuario',
      'user',
      'guest'
    ];
    
    return clienteRoles.includes(role);
  }

  private redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'superadmin':
      case 'super_admin':
      case 'super-admin':
        console.log('🔀 Redirigiendo a superadmin dashboard');
        this.router.navigate(['/superadmin/dashboard']);
        break;
        
      case 'admin':
      case 'administrador':
        console.log('🔀 Redirigiendo a admin dashboard');
        this.router.navigate(['/admin/dashboard']);
        break;
        
      default:
        console.log('🔀 Rol no reconocido, redirigiendo a login');
        this.router.navigate(['/login']);
        break;
    }
  }
}