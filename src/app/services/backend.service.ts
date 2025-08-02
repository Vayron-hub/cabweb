import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces que coinciden con tu backend
export interface User {
  id: string | number;
  nombre: string;
  correo: string; // Tu backend usa 'correo', no 'email'
  fechaCreacion?: string;
  fechaUltimoAcceso?: string | null; // Puede ser null
  enLinea?: boolean; // Estado online/offline
  activo?: boolean; // Tu backend usa boolean, no string
  rol?: string; // Tu backend puede no tener rol por ahora
  zona?: string;
  
  // Propiedades calculadas para compatibilidad con el frontend
  email?: string; // Mapeado desde 'correo'
  estado?: string; // Mapeado desde 'activo'
  ultimoAcceso?: Date | string; // Mapeado desde 'fechaUltimoAcceso'
}

export interface LoginRequest {
  correo: string; // Tu backend usa 'correo', no 'email'
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: User; // Tu backend devuelve 'usuario', no 'user'
}

// Interfaces para otros endpoints
export interface Deteccion {
  id: string | number;
  fecha?: Date;
  fechaHora?: string; // Campo real del backend
  ubicacion?: string;
  tipo: string;
  estado?: string;
  usuario?: User;
  zona?: string;
  zonaId?: string | number;
  clasificadorId?: string | number; // Campo real del backend
  latitud?: number;
  longitud?: number;
  imagen?: string;
  confirmada?: boolean;
}

export interface Clasificador {
  id: string | number;
  nombre: string;
  descripcion: string;
  tipo: string;
  estado: string;
  fechaCreacion: Date;
  usuarioCreador?: User;
  zona?: string;
  zonaId?: string | number;
  latitud?: number;
  longitud?: number;
  capacidad?: number;
  nivelLlenado?: number;
}

export interface Zona {
  id: string | number;
  nombre: string;
  descripcion: string;
  coordenadas?: string;
  estado: string;
  latitud?: number;
  longitud?: number;
  area?: number;
}

export interface Reporte {
  id: string | number;
  titulo: string;
  descripcion: string;
  fechaCreacion: Date;
  fechaInicio: Date;
  fechaFin: Date;
  usuario: User;
  tipo: string;
  estado: string;
}

// Interfaces para estadísticas
export interface EstadisticasGenerales {
  totalDetecciones: number;
  totalUsuarios: number;
  totalClasificadores: number;
  totalZonas: number;
  deteccionesHoy: number;
  deteccionesEsteMes: number;
  usuariosActivos: number;
}

export interface EstadisticasZonas {
  id: number;
  nombre: string;
  totalClasificadores: number;
  totalDetecciones: number;
  deteccionesHoy: number;
  ultimaActividad: string | null;
  tipoMasComun: string | null;
}

export interface EstadisticasTipos {
  tipo: string;
  cantidad: number;
  porcentaje: number;
}

export interface EstadisticasHorarios {
  hora: number;
  cantidad: number;
  porcentaje: number;
}

export interface DashboardData {
  estadisticasGenerales: EstadisticasGenerales;
  deteccionesRecientes: Deteccion[];
  zonasPopulares: EstadisticasZonas[];
  tiposPopulares: EstadisticasTipos[];
  horariosRecurrentes: EstadisticasHorarios[];
}

// Interfaces para contenido
export interface Tip {
  id: string | number;
  titulo: string;
  descripcion: string;
  tipo: string;
  imagen?: string;
}

export interface Campana {
  id: string | number;
  titulo: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
  imagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario desde localStorage al inicializar
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  // === AUTENTICACIÓN ===
  
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/usuarios/ingresar`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.usuario));
            this.currentUserSubject.next(response.usuario);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return token !== null && token !== '';
  }

  // === USUARIOS ===
  
  getUsuarios(): Observable<User[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`)
      .pipe(
        map(usuarios => usuarios.map(usuario => this.transformUserFromBackend(usuario))),
        catchError(this.handleError)
      );
  }

  // Método helper para transformar usuarios del backend al formato del frontend
  private transformUserFromBackend(backendUser: any): User {
    return {
      ...backendUser,
      email: backendUser.correo, // Mapear correo -> email
      estado: backendUser.activo ? 'Activo' : 'Inactivo', // Mapear boolean -> string
      ultimoAcceso: backendUser.fechaUltimoAcceso || 'Nunca', // Manejar null
      rol: backendUser.rol || 'Usuario' // Rol por defecto si no existe
    };
  }

  getUsuario(id: string | number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/usuarios/${id}`)
      .pipe(catchError(this.handleError));
  }

  createUsuario(usuario: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/usuarios`, usuario)
      .pipe(catchError(this.handleError));
  }

  updateUsuario(id: string | number, usuario: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/usuarios/${id}`, usuario)
      .pipe(catchError(this.handleError));
  }

  deleteUsuario(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuarios/${id}`)
      .pipe(catchError(this.handleError));
  }

  // === DETECCIONES ===
  
  getDetecciones(): Observable<Deteccion[]> {
    return this.http.get<Deteccion[]>(`${this.apiUrl}/detecciones`)
      .pipe(catchError(this.handleError));
  }

  getDeteccion(id: string | number): Observable<Deteccion> {
    return this.http.get<Deteccion>(`${this.apiUrl}/detecciones/${id}`)
      .pipe(catchError(this.handleError));
  }

  createDeteccion(deteccion: Partial<Deteccion>): Observable<Deteccion> {
    return this.http.post<Deteccion>(`${this.apiUrl}/detecciones`, deteccion)
      .pipe(catchError(this.handleError));
  }

  updateDeteccion(id: string | number, deteccion: Partial<Deteccion>): Observable<Deteccion> {
    return this.http.put<Deteccion>(`${this.apiUrl}/detecciones/${id}`, deteccion)
      .pipe(catchError(this.handleError));
  }

  deleteDeteccion(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/detecciones/${id}`)
      .pipe(catchError(this.handleError));
  }

  // === CLASIFICADORES ===
  
  getClasificadores(): Observable<Clasificador[]> {
    return this.http.get<Clasificador[]>(`${this.apiUrl}/clasificadores`)
      .pipe(catchError(this.handleError));
  }

  getClasificador(id: string | number): Observable<Clasificador> {
    return this.http.get<Clasificador>(`${this.apiUrl}/clasificadores/${id}`)
      .pipe(catchError(this.handleError));
  }

  createClasificador(clasificador: Partial<Clasificador>): Observable<Clasificador> {
    return this.http.post<Clasificador>(`${this.apiUrl}/clasificadores`, clasificador)
      .pipe(catchError(this.handleError));
  }

  updateClasificador(id: string | number, clasificador: Partial<Clasificador>): Observable<Clasificador> {
    return this.http.put<Clasificador>(`${this.apiUrl}/clasificadores/${id}`, clasificador)
      .pipe(catchError(this.handleError));
  }

  deleteClasificador(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clasificadores/${id}`)
      .pipe(catchError(this.handleError));
  }

  // === ZONAS ===
  
  getZonas(): Observable<Zona[]> {
    return this.http.get<Zona[]>(`${this.apiUrl}/zonas`)
      .pipe(catchError(this.handleError));
  }

  getZona(id: string | number): Observable<Zona> {
    return this.http.get<Zona>(`${this.apiUrl}/zonas/${id}`)
      .pipe(catchError(this.handleError));
  }

  createZona(zona: Partial<Zona>): Observable<Zona> {
    return this.http.post<Zona>(`${this.apiUrl}/zonas`, zona)
      .pipe(catchError(this.handleError));
  }

  updateZona(id: string | number, zona: Partial<Zona>): Observable<Zona> {
    return this.http.put<Zona>(`${this.apiUrl}/zonas/${id}`, zona)
      .pipe(catchError(this.handleError));
  }

  deleteZona(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/zonas/${id}`)
      .pipe(catchError(this.handleError));
  }

  // === REPORTES ===
  
  getReportes(): Observable<Reporte[]> {
    return this.http.get<Reporte[]>(`${this.apiUrl}/reportes`)
      .pipe(catchError(this.handleError));
  }

  getReporte(id: string | number): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.apiUrl}/reportes/${id}`)
      .pipe(catchError(this.handleError));
  }

  createReporte(reporte: Partial<Reporte>): Observable<Reporte> {
    return this.http.post<Reporte>(`${this.apiUrl}/reportes`, reporte)
      .pipe(catchError(this.handleError));
  }

  updateReporte(id: string | number, reporte: Partial<Reporte>): Observable<Reporte> {
    return this.http.put<Reporte>(`${this.apiUrl}/reportes/${id}`, reporte)
      .pipe(catchError(this.handleError));
  }

  deleteReporte(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reportes/${id}`)
      .pipe(catchError(this.handleError));
  }

  // === ENDPOINTS ESPECÍFICOS DEL DASHBOARD ===
  
  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`)
      .pipe(catchError(this.handleError));
  }

  getEstadisticasGenerales(): Observable<EstadisticasGenerales> {
    return this.http.get<EstadisticasGenerales>(`${this.apiUrl}/estadisticas/generales`)
      .pipe(catchError(this.handleError));
  }

  getEstadisticasZonas(): Observable<EstadisticasZonas[]> {
    return this.http.get<EstadisticasZonas[]>(`${this.apiUrl}/zonas/estadisticas`)
      .pipe(catchError(this.handleError));
  }

  getEstadisticasTipos(): Observable<EstadisticasTipos[]> {
    return this.http.get<EstadisticasTipos[]>(`${this.apiUrl}/estadisticas/tipos`)
      .pipe(catchError(this.handleError));
  }

  getEstadisticasHorarios(): Observable<EstadisticasHorarios[]> {
    return this.http.get<EstadisticasHorarios[]>(`${this.apiUrl}/estadisticas/horarios`)
      .pipe(catchError(this.handleError));
  }

  // === ENDPOINTS ESPECÍFICOS DE DETECCIONES ===
  
  getDeteccionesPorZona(zonaId: string | number): Observable<Deteccion[]> {
    console.log('🔗 BackendService - getDeteccionesPorZona llamado con ID:', zonaId);
    const url = `${this.apiUrl}/detecciones/por-zona/${zonaId}`;
    console.log('🔗 URL construida para detecciones:', url);
    
    return this.http.get<Deteccion[]>(url)
      .pipe(catchError(this.handleError));
  }

  getDeteccionesPorUsuario(usuarioId: string | number): Observable<Deteccion[]> {
    return this.http.get<Deteccion[]>(`${this.apiUrl}/detecciones/usuario/${usuarioId}`)
      .pipe(catchError(this.handleError));
  }

  getDeteccionesRecientes(limite: number = 10): Observable<Deteccion[]> {
    return this.http.get<Deteccion[]>(`${this.apiUrl}/detecciones/recientes?limit=${limite}`)
      .pipe(catchError(this.handleError));
  }

  confirmarDeteccion(id: string | number): Observable<Deteccion> {
    return this.http.patch<Deteccion>(`${this.apiUrl}/detecciones/${id}/confirmar`, {})
      .pipe(catchError(this.handleError));
  }

  // === ENDPOINTS ESPECÍFICOS DE CLASIFICADORES ===
  
  getClasificadoresPorZona(zonaId: string | number): Observable<Clasificador[]> {
    console.log('🔗 BackendService - getClasificadoresPorZona llamado con ID:', zonaId);
    console.log('🔗 Tipo de zonaId:', typeof zonaId);
    const url = `${this.apiUrl}/clasificadores/por-zona/${zonaId}`;
    console.log('🔗 URL construida:', url);
    
    return this.http.get<Clasificador[]>(url)
      .pipe(catchError(this.handleError));
  }

  getClasificadoresPorTipo(tipo: string): Observable<Clasificador[]> {
    return this.http.get<Clasificador[]>(`${this.apiUrl}/clasificadores/tipo/${tipo}`)
      .pipe(catchError(this.handleError));
  }

  getEstadoClasificador(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clasificadores/${id}/estado`)
      .pipe(catchError(this.handleError));
  }

  getEstadisticasClasificadores(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clasificadores/estadisticas`)
      .pipe(catchError(this.handleError));
  }

  // === ENDPOINTS ESPECÍFICOS DE USUARIOS ===
  
  getUsuariosPorRol(rol: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/usuarios/rol/${rol}`)
      .pipe(catchError(this.handleError));
  }

  getPerfilUsuario(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/usuarios/perfil`)
      .pipe(catchError(this.handleError));
  }

  actualizarPerfil(datos: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/usuarios/perfil`, datos)
      .pipe(catchError(this.handleError));
  }

  cambiarPassword(passwordActual: string, passwordNuevo: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/usuarios/cambiar-password`, {
      passwordActual,
      passwordNuevo
    }).pipe(catchError(this.handleError));
  }

  // === ENDPOINTS DE CONTENIDO ===
  
  getTips(): Observable<Tip[]> {
    return this.http.get<Tip[]>(`${this.apiUrl}/contenido/tips`)
      .pipe(catchError(this.handleError));
  }

  getTip(id: string | number): Observable<Tip> {
    return this.http.get<Tip>(`${this.apiUrl}/contenido/tips/${id}`)
      .pipe(catchError(this.handleError));
  }

  createTip(tip: Partial<Tip>): Observable<Tip> {
    return this.http.post<Tip>(`${this.apiUrl}/contenido/tips`, tip)
      .pipe(catchError(this.handleError));
  }

  updateTip(id: string | number, tip: Partial<Tip>): Observable<Tip> {
    return this.http.put<Tip>(`${this.apiUrl}/contenido/tips/${id}`, tip)
      .pipe(catchError(this.handleError));
  }

  deleteTip(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/contenido/tips/${id}`)
      .pipe(catchError(this.handleError));
  }

  getCampanas(): Observable<Campana[]> {
    return this.http.get<Campana[]>(`${this.apiUrl}/contenido/campanas`)
      .pipe(catchError(this.handleError));
  }

  getCampana(id: string | number): Observable<Campana> {
    return this.http.get<Campana>(`${this.apiUrl}/contenido/campanas/${id}`)
      .pipe(catchError(this.handleError));
  }

  createCampana(campana: Partial<Campana>): Observable<Campana> {
    return this.http.post<Campana>(`${this.apiUrl}/contenido/campanas`, campana)
      .pipe(catchError(this.handleError));
  }

  updateCampana(id: string | number, campana: Partial<Campana>): Observable<Campana> {
    return this.http.put<Campana>(`${this.apiUrl}/contenido/campanas/${id}`, campana)
      .pipe(catchError(this.handleError));
  }

  deleteCampana(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/contenido/campanas/${id}`)
      .pipe(catchError(this.handleError));
  }

  // === MÉTODOS DE UTILIDAD ===
  
  // Método para verificar roles (si tu backend lo soporta)
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.rol === role : false;
  }

  // === MÉTODO PARA VERIFICAR CONECTIVIDAD ===
  
  async checkConnection(): Promise<boolean> {
    try {
      // Hacer una petición simple para verificar conectividad
      // Usamos el endpoint de login con datos vacíos solo para verificar que el servidor responde
      const response = await fetch(`${this.apiUrl}/usuarios/ingresar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: '', password: '' })
      });
      
      // Si llegamos aquí, el servidor está respondiendo
      // No importa si es 400, 401, etc. - lo importante es que responde
      console.log('✅ Servidor responde con status:', response.status);
      return true;
    } catch (error) {
      console.error('❌ Error de conectividad:', error);
      return false;
    }
  }

  // === MANEJO DE ERRORES ===
  
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // El backend devolvió un código de error
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    
    console.error('Error en BackendService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}