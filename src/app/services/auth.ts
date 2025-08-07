import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { BackendService, LoginRequest, User } from './backend.service';
import { catchError, tap, map } from 'rxjs/operators';

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
      // Usar backend real - convertir username a correo si es necesario
      const correo = username.includes('@') ? username : `${username}@utleon.edu.mx`;
      return this.loginWithBackend(correo, password);
    } else {
      // Usar datos simulados (comportamiento actual)
      return of(this.loginWithMockData(username, password));
    }
  }

  private loginWithBackend(correo: string, password: string): Observable<boolean> {
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
  }

  private loginWithMockData(username: string, password: string): boolean {
    // Datos simulados actuales (mantener mientras no esté el backend)
    const validCredentials = [
      { username: 'admin', password: '123456', user: { id: 'ADM001', nombre: 'Juan Administrador', rol: 'administrador', email: 'admin@cab.com', estado: 'Activo' }},
      { username: 'jose', password: '123456', user: { id: 'USR001', nombre: 'José García', rol: 'usuario', email: 'jose@cab.com', estado: 'Activo' }},
      { username: 'maria', password: '123456', user: { id: 'USR002', nombre: 'María López', rol: 'usuario', email: 'maria@cab.com', estado: 'Activo' }},
      { username: 'priv', password: '123456', user: { id: 'PRV001', nombre: 'Usuario Privado', rol: 'usuario', email: 'priv@cab.com', estado: 'Activo' }}
    ];

    const credential = validCredentials.find(cred => 
      cred.username === username && cred.password === password
    );

    if (credential) {
      const user: User = {
        id: credential.user.id,
        nombre: credential.user.nombre,
        password: '',
        correo: (credential.user as any).correo || (credential.user as any).email, // Convertir email a correo si es necesario
        estado: credential.user.estado,
        ultimoAcceso: new Date(),
      };
      
      // Simular el guardado de datos como lo haría el backend
      localStorage.setItem('authToken', 'mock-jwt-token-' + Date.now());
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      return true;
    }

    return false;
  }

  logout(): void {
    if (this.useBackend && this.isAuthenticated()) {
      this.backendService.logout();
      this.clearLocalAuthData();
    } else {
      // Logout con datos simulados
      this.clearLocalAuthData();
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
