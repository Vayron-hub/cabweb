import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { BackendService, LoginRequest, User } from './backend.service';
import { catchError, tap, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Flag para determinar si usar datos simulados o backend real
  private useBackend = true; // ¡HABILITADO! Cambia a false si quieres volver a datos simulados

  constructor(
    private router: Router,
    private backendService: BackendService
  ) {}

  login(username: string, password: string): Observable<boolean> {
    if (this.useBackend) {
      const correo = username.includes('@') ? username : `${username}@utleon.edu.mx`;
      const credentials: LoginRequest = { correo, password };
      return this.backendService.login(credentials).pipe(
        tap(response => {
          console.log('Login exitoso:', response.usuario);
          this.currentUserSubject.next(response.usuario);
        }),
        map(() => true),
        catchError(error => {
          console.error('Error en login:', error);
          return of(false);
        })
      );
    } else {
      // Modo simulado
      return of(false);
    }
  }

  register(userData: {nombre: string, correo: string, password: string}): Observable<boolean> {
    if (this.useBackend) {
      return this.backendService.registrarUsuario(userData).pipe(
        tap(response => {
          console.log('✅ Registro exitoso:', response);
        }),
        map(() => true),
        catchError(error => {
          console.error('❌ Error en registro:', error);
          return of(false);
        })
      );
    } else {
      // Modo simulado
      console.log('Registro simulado para:', userData);
      return of(true);
    }
  }

  registerAndLogin(userData: {nombre: string, correo: string, password: string}): Observable<boolean> {
    if (this.useBackend) {
      return this.register(userData).pipe(
        switchMap(registerSuccess => {
          if (registerSuccess) {
            console.log('✅ Registro exitoso, iniciando sesión automática...');
            // Después del registro exitoso, hacer login automático
            return this.login(userData.correo, userData.password);
          } else {
            console.error('❌ Fallo en el registro');
            return of(false);
          }
        }),
        catchError(error => {
          console.error('❌ Error en registro y login:', error);
          return of(false);
        })
      );
    } else {
      // Modo simulado
      return of(true);
    }
  }

  logout(): void {
    if (this.useBackend && this.isAuthenticated()) {
      this.backendService.logout().subscribe({
        next: (response) => {
          console.log('✅ Logout completado:', response.message);
          this.clearLocalAuthData();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('❌ Error en logout:', error);
          // Aunque el backend falle, limpiamos los datos locales
          this.clearLocalAuthData();
          this.router.navigate(['/login']);
        }
      });
    } else {
      // Logout con datos simulados
      this.clearLocalAuthData();
      this.router.navigate(['/login']);
    }
  }

  private clearLocalAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberedCredentials');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    if (this.useBackend) {
      return this.backendService.isAuthenticated();
    } else {
      // Verificación con datos simulados
      const token = localStorage.getItem('authToken');
      return !!token;
    }
  }

  // Mantener compatibilidad con método anterior
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getCurrentUser(): User | null {
    if (this.useBackend) {
      return this.backendService.getCurrentUser();
    } else {
      // Obtener usuario con datos simulados
      return this.currentUserSubject.value;
    }
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }


  // === MÉTODOS PARA EL COMPONENTE (mantener compatibilidad) ===
  
  getAllUsers(): User[] {
    // Método de compatibilidad - ahora debería usar ApiService
    if (this.useBackend) {
      // En modo backend, este método debería hacer una petición HTTP
      console.warn('getAllUsers() en modo backend - usar ApiService.getUsers() en su lugar');
      return [];
    } else {
      // Datos simulados para desarrollo
      return [
        { id: 'ADM001', nombre: 'Juan Administrador', correo: 'admin@cab.com', password: '', estado: 'Activo', ultimoAcceso: new Date() },
        { id: 'USR001', nombre: 'José García', correo: 'jose@cab.com', password: '', estado: 'Activo', ultimoAcceso: new Date() },
        { id: 'USR002', nombre: 'María López', correo: 'maria@cab.com', password: '', estado: 'Activo', ultimoAcceso: new Date() },
        { id: 'PRV001', nombre: 'Usuario Privado', correo: 'priv@cab.com', password: '', estado: 'Activo', ultimoAcceso: new Date() }
      ];
    }
  }

  // === MÉTODOS PARA ACTIVAR/DESACTIVAR BACKEND ===
  
  enableBackend(): void {
    this.useBackend = true;
    console.log('Backend habilitado - usando API real');
  }

  disableBackend(): void {
    this.useBackend = false;
    console.log('Backend deshabilitado - usando datos simulados');
  }

  isUsingBackend(): boolean {
    return this.useBackend;
  }

  // === MÉTODO PARA VERIFICAR CONECTIVIDAD CON BACKEND ===
  
  async checkBackendConnection(): Promise<boolean> {
    try {
      return await this.backendService.checkConnection();
    } catch (error) {
      console.warn('Backend no disponible:', error);
      return false;
    }
  }

  // === MÉTODO PARA CONFIGURACIÓN INICIAL ===
  
  async initializeAuth(): Promise<void> {
    console.log('Inicializando servicio de autenticación...');
    
    if (this.useBackend) {
      const isConnected = await this.checkBackendConnection();
      if (!isConnected) {
        console.warn('Backend no disponible, cambiando a modo simulado');
        this.useBackend = false;
      } else {
        console.log('Backend conectado correctamente');
      }
    }
    
    console.log(`Modo actual: ${this.useBackend ? 'Backend Real' : 'Datos Simulados'}`);
  }
}
