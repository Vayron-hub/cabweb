import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent, User } from '../shared/navbar/navbar';
import { BackendService, Zona } from '../../services/backend.service';
import { ZonaService } from '../../services/zona.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, FormsModule, NavbarComponent],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css']
})
export class AdminLayoutComponent implements OnInit {
  
  selectedLocation: string = 'Edificio D';
  locations: string[] = [];
  zonas: Zona[] = [];
  isLoadingZonas = false;
  showAccountModal = false;
  
  currentUser: User = {
    id: '',
    nombre: '',
    email: '',
    rol: '',
    ultimoAcceso: new Date()
  };

  constructor(
    private backendService: BackendService,
    private zonaService: ZonaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.getCurrentUser(); // Add this line
    this.loadZonas();
  }

  loadZonas() {
    this.isLoadingZonas = true;
    console.log('🔄 Cargando zonas del backend...');
    
    this.backendService.getZonas().subscribe({
      next: (zonas) => {
        console.log('✅ Zonas cargadas:', zonas);
        this.zonas = zonas;
        this.locations = zonas.map(zona => zona.nombre);
        
        if (this.zonas.length > 0) {
          // Usar la primera zona disponible
          const primeraZona = this.zonas[0];
          this.selectedLocation = primeraZona.nombre;
          
          // Actualizar el ZonaService con la primera zona
          this.zonaService.setSelectedZona({
            id: primeraZona.id,
            nombre: primeraZona.nombre
          });
          
          console.log('🎯 Zona inicial establecida:', primeraZona);
        }
        
        this.isLoadingZonas = false;
      },
      error: (error) => {
        console.error('❌ Error cargando zonas:', error);
        this.isLoadingZonas = false;
      }
    });
  }

  onLocationChange(newLocation: string) {
    console.log('📍 Ubicación cambiada a:', newLocation);
    
    // Actualizar la ubicación seleccionada
    this.selectedLocation = newLocation;
    
    // Encontrar la zona seleccionada por nombre
    const zonaSeleccionada = this.zonas.find(zona => zona.nombre === newLocation);
    
    if (zonaSeleccionada) {
      console.log('🔄 Actualizando ZonaService con:', zonaSeleccionada);
      
      // Actualizar el ZonaService
      this.zonaService.setSelectedZona({
        id: zonaSeleccionada.id,
        nombre: zonaSeleccionada.nombre
      });
    } else {
      console.warn('⚠️ No se encontró la zona:', newLocation);
    }
  }

  onLogout() {
    console.log('👋 Iniciando proceso de cierre de sesión...');
    
    // Confirmar la acción con el usuario
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      try {
        // Limpiar datos de autenticación usando BackendService
        this.backendService.logout();
        
        // Limpiar datos de zona
        this.zonaService.clearSelectedZona();
        
        console.log('✅ Sesión cerrada correctamente');
        
        // Redirigir a la página de login
        this.router.navigate(['/login']).then(() => {
          console.log('🔄 Redirigido a login');
        }).catch(error => {
          console.error('❌ Error al redirigir:', error);
          // Fallback: recargar la página
          window.location.href = '/login';
        });
      } catch (error) {
        console.error('❌ Error durante el logout:', error);
        // Aún así intentar redirigir
        window.location.href = '/login';
      }
    } else {
      console.log('🚫 Logout cancelado por el usuario');
    }
  }

  onViewMyAccount() {
    console.log('👤 Ver mi cuenta');
    this.showAccountModal = true;
  }

  closeAccountModal() {
    this.showAccountModal = false;
  }

  getCurrentUser() {
    const user = this.backendService.getCurrentUser();
    if (user) {
      // Ensure all required fields are present and have the correct types
      this.currentUser = {
        id: user.id || '',
        nombre: user.nombre || '',
        email: user.correo || '', // Handle undefined email
        rol:'Admin',
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

  formatAccountDate(date: Date | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
