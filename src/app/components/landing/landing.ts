import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { BackendService } from '../../services/backend.service';
import { Comentario } from '../productos/productos';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './landing.html',
})
export class Landing implements OnInit{
  
  constructor(
    private backendService: BackendService,
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
      this.loadComentarios();
  }

  comentarios: Comentario[] = [];

  onCardClick(cardType: string) {
    if (cardType === 'login') {
      this.router.navigate(['/login']);
    } else if (cardType === 'cotizacion') {
      this.router.navigate(['/cotizacion']);
    } else if (cardType === 'app') {
      this.router.navigate(['/app/dashboard']);
    } else {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/app/dashboard'], { queryParams: { type: cardType } });
      } else {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/app/dashboard', type: cardType } });
      }
    }
  }

  loadComentarios() {
    this.backendService.getComentarios().subscribe(
      comentarios => {
        this.comentarios = comentarios.slice(0, 5);
      },
      error => {
        console.error('Error al cargar los comentarios:', error);
      }
    );
  }
}