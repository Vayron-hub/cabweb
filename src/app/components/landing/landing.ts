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
})
export class Landing {
  
  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

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
}