import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onCardClick(cardType: string) {
    if (cardType === 'login') {
      // Si es el botón de login, ir al login
      this.router.navigate(['/login']);
    } else {
      // Para cualquier otra tarjeta, ir directamente al admin dashboard
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/admin'], { queryParams: { type: cardType } });
      } else {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/admin', type: cardType } });
      }
    }
  }
}
