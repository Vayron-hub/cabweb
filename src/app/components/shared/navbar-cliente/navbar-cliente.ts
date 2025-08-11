import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BackendService, Zona } from '../../../services/backend.service';

export interface User {
  id: string | number;
  nombre: string;
  email: string;
  rol: string;
  ultimoAcceso?: Date;
}

@Component({
  selector: 'app-navbar-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar-cliente.html',
})
export class NavbarCliente {
  @Input() selectedLocation: string = '';
  @Input() locations: string[] = [];
  @Input() isLoadingZonas: boolean = false;
  @Input() currentUser: User = {
    id: '',
    nombre: '',
    email: '',
    rol: '',
    ultimoAcceso: new Date()
  };

  @Output() locationChange = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  @Output() viewMyAccount = new EventEmitter<void>();

  userMenuOpen = false;

  constructor(
    private backendService: BackendService,
  ) { }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }


  getCurrentUser() {
    const user = this.backendService.getCurrentUser();
    if (user) {
      // Ensure all required fields are present and have the correct types
      this.currentUser = {
        id: user.id || '',
        nombre: user.nombre || '',
        email: user.correo || '', // Handle undefined email
        rol:  'Admin',
        ultimoAcceso: this.convertToDate(user.fechaUltimoAcceso)
      };
    } else {
      // Handle the case when user is null
      console.warn('Usuario no encontrado');
      // Keep the existing default user or redirect to login
    }
  }

  private convertToDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date();
    }

    if (dateValue instanceof Date) {
      return dateValue;
    }

    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }

    // Fallback to current date
    return new Date();
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
