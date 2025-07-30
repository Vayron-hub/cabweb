import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces para el backend
export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  ultimoAcceso: Date;
  zona?: string;
}

export interface Classifier {
  id: string;
  name: string;
  activeCount: number;
  inactiveCount: number;
  pendingCount: number;
  zona: string;
  estado: string;
}

export interface DashboardStats {
  active: number;
  processing: number;
  totalReports: number;
  totalUsers: number;
  thisMonth: number;
  totalClassifiers: number;
  totalDetections: number;
  activeUsers: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  // === MÉTODOS DE AUTENTICACIÓN ===
  
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.setToken(response.data.token);
            this.setUser(response.data.user);
            return response.data;
          } else {
            throw new Error(response.error || 'Error en el login');
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          this.clearAuthData();
        }),
        catchError(this.handleError)
      );
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/auth/refresh`, {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          this.setToken(response.data.token);
          return response.data;
        } else {
          throw new Error(response.error || 'Error al renovar token');
        }
      }),
      catchError(this.handleError)
    );
  }

  // === MÉTODOS PARA USUARIOS ===
  
  getUsers(zona?: string): Observable<User[]> {
    const params = zona ? `?zona=${zona}` : '';
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users${params}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => response.success ? response.data : []),
      catchError(this.handleError)
    );
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users`, user, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Error al crear usuario');
        }
      }),
      catchError(this.handleError)
    );
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${id}`, user, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Error al actualizar usuario');
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteUser(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/users/${id}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => response.success),
      catchError(this.handleError)
    );
  }

  // === MÉTODOS PARA CLASIFICADORES ===
  
  getClassifiers(zona?: string): Observable<Classifier[]> {
    const params = zona ? `?zona=${zona}` : '';
    return this.http.get<ApiResponse<Classifier[]>>(`${this.baseUrl}/classifiers${params}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => response.success ? response.data : []),
      catchError(this.handleError)
    );
  }

  updateClassifier(id: string, classifier: Partial<Classifier>): Observable<Classifier> {
    return this.http.put<ApiResponse<Classifier>>(`${this.baseUrl}/classifiers/${id}`, classifier, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Error al actualizar clasificador');
        }
      }),
      catchError(this.handleError)
    );
  }

  // === MÉTODOS PARA ESTADÍSTICAS ===
  
  getDashboardStats(zona?: string): Observable<DashboardStats> {
    const params = zona ? `?zona=${zona}` : '';
    return this.http.get<ApiResponse<DashboardStats>>(`${this.baseUrl}/dashboard/stats${params}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Error al obtener estadísticas');
        }
      }),
      catchError(this.handleError)
    );
  }

  getStatistics(zona?: string, dateRange?: { from: Date, to: Date }): Observable<any> {
    let params = zona ? `?zona=${zona}` : '?';
    if (dateRange) {
      params += `&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`;
    }
    
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/statistics${params}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => response.success ? response.data : {}),
      catchError(this.handleError)
    );
  }

  // === MÉTODOS PARA DETECCIONES ===
  
  getRecentDetections(zona?: string, limit: number = 10): Observable<any[]> {
    const params = `?limit=${limit}${zona ? `&zona=${zona}` : ''}`;
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/detections/recent${params}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => response.success ? response.data : []),
      catchError(this.handleError)
    );
  }

  // === MÉTODOS AUXILIARES ===
  
  private getAuthHeaders(): HttpHeaders {
    const token = this.getStoredToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private setToken(token: string): void {
    localStorage.setItem('authToken', token);
    this.tokenSubject.next(token);
  }

  private setUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  private clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.tokenSubject.next(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || `Error ${error.status}: ${error.message}`;
    }
    
    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // === MÉTODOS PÚBLICOS PARA OBTENER DATOS ALMACENADOS ===
  
  getCurrentUser(): User | null {
    return this.getStoredUser();
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.rol === role : false;
  }

  isAdmin(): boolean {
    return this.hasRole('Administrador');
  }
}
