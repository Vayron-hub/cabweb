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
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadZonas();
  }
  ngOnDestroy(): void {}

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
        this.zonas = zonas;
        this.locations = zonas.map((z) => z.nombre);
        if (zonas.length > 0) {
          const primera = zonas[0];
          this.selectedLocation = primera.nombre;
          this.zonaService.setSelectedZona({
            id: primera.id,
            nombre: primera.nombre,
          });
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
    this.backendService
      .verifyCurrentPassword(
        this.currentUser.id,
        this.changePasswordData.currentPassword
      )
      .subscribe({
        next: (res: any) => {
          if (!res.isValid) {
            this.isSavingPassword = false;
            alert('Contraseña actual incorrecta');
            return;
          }
          this.backendService
            .updateUsuario(this.currentUser.id, {
              nombre: this.currentUser.nombre,
              email: this.currentUser.email,
              password: this.changePasswordData.newPassword,
            })
            .subscribe({
              next: () => {
                this.isSavingPassword = false;
                this.isChangingPassword = false;
                alert('Contraseña cambiada');
              },
              error: () => {
                this.isSavingPassword = false;
                alert('Error al cambiar contraseña');
              },
            });
        },
        error: () => {
          this.isSavingPassword = false;
          alert('Error verificación contraseña');
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
