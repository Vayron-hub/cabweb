import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface User {
  id: string | number;
  nombre: string;
  email: string;
  rol: string;
  ultimoAcceso?: Date;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  @Input() selectedLocation: string = '';
  @Input() locations: string[] = [];
  @Input() isLoadingZonas: boolean = false;
  @Input() currentUser: User = {
    id: 1,
    nombre: 'Administrador',
    email: 'admin@utleon.edu.mx',
    rol: 'Administrador'
  };
  
  @Output() locationChange = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  @Output() viewMyAccount = new EventEmitter<void>();
  
  userMenuOpen = false;

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  onLocationChange() {
    console.log('🔄 Navbar - Cambio de ubicación a:', this.selectedLocation);
    this.locationChange.emit(this.selectedLocation);
  }

  onLogout() {
    this.logout.emit();
  }

  onViewMyAccount() {
    this.viewMyAccount.emit();
  }

  formatAccountDate(date: Date | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
