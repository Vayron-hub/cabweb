import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendService } from '../services/backend.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token del localStorage
    const token = localStorage.getItem('authToken');
    
    // Si hay token, agregar el header Authorization
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }
    
    // Si no hay token, enviar la petición original
    return next.handle(req);
  }
}
