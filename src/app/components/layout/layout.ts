import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent, User as NavbarUser } from '../shared/navbar/navbar';
import { BackendService, Zona } from '../../services/backend.service';
import { ZonaService } from '../../services/zona.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    FormsModule,
    NavbarComponent,
  ],
  templateUrl: './layout.html',
})
export class LayoutComponent implements OnInit, OnDestroy {
  selectedLocation: string = '';
  locations: string[] = [];
  zonas: Zona[] = [];
  isLoadingZonas = false;
  showAccountModal = false;

  currentUser: NavbarUser = {
    id: '',
    nombre: '',
    email: '',
    rol: '',
    ultimoAcceso: new Date(),
  };

  isEditingProfile = false;
  isSavingProfile = false;
  editProfileData = { nombre: '', email: '' };

  isChangingPassword = false;
  isSavingPassword = false;
  changePasswordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  constructor(
    private backendService: BackendService,
    private zonaService: ZonaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getCurrentUser();
    this.zonaService.selectedZona$.subscribe((z) => {
      if (z && z.nombre && z.nombre !== this.selectedLocation) {
        this.selectedLocation = z.nombre;
      }
    });
    this.loadZonas();
  }
  ngOnDestroy(): void { }

  private getCurrentUser(): void {
    const user = this.backendService.getCurrentUser();
    if (user) {
      this.currentUser = {
        id: user.id || '',
        nombre: user.nombre || '',
        email: (user as any).correo || (user as any).email || '',
        rol: (user as any).rol || '',
        ultimoAcceso: this.convertToDate((user as any).fechaUltimoAcceso),
      };
    }
  }

  private convertToDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  }

  loadZonas(): void {
    this.isLoadingZonas = true;
    this.backendService.getZonas().subscribe({
      next: (zonas) => {
        console.log(zonas);
        this.zonas = zonas;
        this.locations = zonas.map((z) => z.nombre);
        if (zonas.length > 0) {
          // Intentar restaurar zona persistida
          const stored = this.zonaService.getCurrentZona();
          let zonaAUsar = zonas[0];
          if (stored && stored.id) {
            const match = zonas.find(
              (z) => z.id == stored.id || z.nombre === stored.nombre
            );
            if (match) zonaAUsar = match;
          }
          this.selectedLocation = zonaAUsar.nombre;
          this.zonaService.setSelectedZona({
            id: zonaAUsar.id,
            nombre: zonaAUsar.nombre,
          });
          console.log('Zona seleccionada (restaurada o primera):', zonaAUsar);
        } else {
          // Si no hay zonas limpiar selección
          this.zonaService.clearSelectedZona();
        }
        this.isLoadingZonas = false;
      },
      error: () => {
        this.isLoadingZonas = false;
      },
    });
  }

  onLocationChange(location: string): void {
    this.selectedLocation = location;
    const zona = this.zonas.find((z) => z.nombre === location);
    if (zona)
      this.zonaService.setSelectedZona({ id: zona.id, nombre: zona.nombre });
  }

  onViewMyAccount(): void {
    this.showAccountModal = true;
  }
  closeAccountModal(): void {
    this.showAccountModal = false;
    if (this.isEditingProfile) this.cancelEditingProfile();
    if (this.isChangingPassword) this.cancelChangingPassword();
  }

  startEditingProfile(): void {
    this.isEditingProfile = true;
    this.editProfileData = {
      nombre: this.currentUser.nombre,
      email: this.currentUser.email,
    };
  }
  cancelEditingProfile(): void {
    this.isEditingProfile = false;
    this.editProfileData = { nombre: '', email: '' };
  }
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  canSaveProfile(): boolean {
    const changed =
      this.editProfileData.nombre !== this.currentUser.nombre ||
      this.editProfileData.email !== this.currentUser.email;
    return (
      changed &&
      this.isValidEmail(this.editProfileData.email) &&
      !!this.currentUser.id
    );
  }
  saveProfileChanges(): void {
    if (!this.canSaveProfile()) return;
    this.isSavingProfile = true;
    this.backendService
      .updateUsuario(this.currentUser.id, {
        nombre: this.editProfileData.nombre.trim(),
        email: this.editProfileData.email.trim(),
      })
      .subscribe({
        next: () => {
          this.currentUser = {
            ...this.currentUser,
            nombre: this.editProfileData.nombre,
            email: this.editProfileData.email,
          };
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          this.isSavingProfile = false;
          this.isEditingProfile = false;
          alert('Perfil actualizado');
        },
        error: () => {
          this.isSavingProfile = false;
          alert('Error al actualizar perfil');
        },
      });
  }

  startChangingPassword(): void {
    this.isChangingPassword = true;
    this.changePasswordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  }
  cancelChangingPassword(): void {
    this.isChangingPassword = false;
    this.changePasswordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  }
  isStrongPassword(p: string): boolean {
    return (
      /[A-Z]/.test(p) &&
      /[a-z]/.test(p) &&
      /\d/.test(p) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(p) &&
      p.length >= 8
    );
  }
  getPasswordValidation(p: string) {
    return {
      minLength: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasLower: /[a-z]/.test(p),
      hasNumber: /\d/.test(p),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(p),
      hasContent: p.length > 0,
    };
  }
  canSavePassword(): boolean {
    const d = this.changePasswordData;
    return !!(
      d.currentPassword &&
      d.newPassword &&
      d.confirmPassword &&
      d.newPassword === d.confirmPassword &&
      d.newPassword !== d.currentPassword &&
      this.isStrongPassword(d.newPassword)
    );
  }
  savePasswordChanges(): void {
    if (!this.canSavePassword()) return;
    this.isSavingPassword = true;
    
    console.log('Verificando contraseña para:', this.currentUser.email);
    
    this.backendService
      .verifyCurrentPassword(
        this.currentUser.email,
        this.changePasswordData.currentPassword
      )
      .subscribe({
        next: (isValid: boolean) => {
          if (!isValid) {
            this.isSavingPassword = false;
            alert('Contraseña actual incorrecta');
            return;
          }
          
          // Usar el nuevo método específico para cambio de contraseña
          const userData = {
            nombre: this.currentUser.nombre,
            correo: this.currentUser.email,
            rol: this.currentUser.rol
          };
          
          this.backendService
            .updateUsuarioPassword(
              this.currentUser.id, 
              this.changePasswordData.newPassword,
              userData
            )
            .subscribe({
              next: () => {
                this.isSavingPassword = false;
                this.isChangingPassword = false;
                alert('Contraseña cambiada exitosamente');
                this.changePasswordData = {
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                };
              },
              error: (error) => {
                console.error('Error al cambiar contraseña:', error);
                this.isSavingPassword = false;
                
                // Manejar errores específicos
                if (error.status === 400) {
                  alert('Error: Datos inválidos. Verifica que todos los campos estén correctos.');
                } else if (error.status === 403) {
                  alert('Error: No tienes permisos para realizar esta acción.');
                } else {
                  alert('Error al cambiar contraseña. Intenta nuevamente.');
                }
              },
            });
        },
        error: (error) => {
          console.error('Error al verificar contraseña:', error);
          this.isSavingPassword = false;
          alert('Error al verificar la contraseña actual');
        },
      });
  }

  onLogout(): void {
    this.backendService.logout().subscribe({
      next: () => {
        this.zonaService.clearSelectedZona();
        this.router.navigate(['/login']);
      },
      error: () => {
        localStorage.clear();
        this.zonaService.clearSelectedZona();
        this.router.navigate(['/login']);
      },
    });
  }

  formatAccountDate(date: Date | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
