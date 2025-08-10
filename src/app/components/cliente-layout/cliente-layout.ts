import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackendService, Zona } from '../../services/backend.service';
import { ZonaService } from '../../services/zona.service';
import { AuthService } from '../../services/auth';
import { NavbarCliente, User } from "../shared/navbar-cliente/navbar-cliente";

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    FormsModule,
    NavbarCliente
],
  templateUrl: './cliente-layout.html',
})
export class ClienteLayout implements OnInit, OnDestroy {
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
    ultimoAcceso: new Date(),
  };

  // Nuevas propiedades para edición de perfil
  isEditingProfile: boolean = false;
  isSavingProfile: boolean = false;
  editProfileData: {
    nombre: string;
    email: string;
  } = {
    nombre: '',
    email: '',
  };

  isChangingPassword: boolean = false;
  isSavingPassword: boolean = false;
  changePasswordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  } = {
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

  ngOnInit() {
    this.getCurrentUser(); // Add this line
    this.loadZonas();
  }

  ngOnDestroy() {
    // Cleanup de suscripciones si las tienes
    console.log('🧹 Limpiando AdminLayoutComponent');
  }

  loadZonas() {
    this.isLoadingZonas = true;
    console.log('🔄 Cargando zonas del backend...');

    this.backendService.getZonas().subscribe({
      next: (zonas) => {
        console.log('✅ Zonas cargadas:', zonas);
        this.zonas = zonas;
        this.locations = zonas.map((zona) => zona.nombre);

        if (this.zonas.length > 0) {
          // Usar la primera zona disponible
          const primeraZona = this.zonas[0];
          this.selectedLocation = primeraZona.nombre;

          // Actualizar el ZonaService con la primera zona
          this.zonaService.setSelectedZona({
            id: primeraZona.id,
            nombre: primeraZona.nombre,
          });

          console.log('🎯 Zona inicial establecida:', primeraZona);
        }

        this.isLoadingZonas = false;
      },
      error: (error) => {
        console.error('❌ Error cargando zonas:', error);
        this.isLoadingZonas = false;
      },
    });
  }

  onLocationChange(newLocation: string) {
    console.log('📍 Ubicación cambiada a:', newLocation);

    // Actualizar la ubicación seleccionada
    this.selectedLocation = newLocation;

    // Encontrar la zona seleccionada por nombre
    const zonaSeleccionada = this.zonas.find(
      (zona) => zona.nombre === newLocation
    );

    if (zonaSeleccionada) {
      console.log('🔄 Actualizando ZonaService con:', zonaSeleccionada);

      // Actualizar el ZonaService
      this.zonaService.setSelectedZona({
        id: zonaSeleccionada.id,
        nombre: zonaSeleccionada.nombre,
      });
    } else {
      console.warn('⚠️ No se encontró la zona:', newLocation);
    }
  }

  onLogout() {
    console.log('👋 Iniciando proceso de cierre de sesión...');

    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.backendService.logout().subscribe({
        next: (response) => {
          this.zonaService.clearSelectedZona();
          this.router
            .navigate(['/login'])
            .then(() => {})
            .catch((error) => {
              window.location.href = '/login';
            });
        },
        error: (error) => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          this.zonaService.clearSelectedZona();
          this.router
            .navigate(['/login'])
            .then(() => {
              console.log('🔄 Redirigido a login después del error');
            })
            .catch((routeError) => {
              window.location.href = '/login';
            });
        },
      });
    } 
  }

  onViewMyAccount() {
    console.log('👤 Ver mi cuenta');
    this.showAccountModal = true;
  }

  closeAccountModal() {
    this.showAccountModal = false;
    if (this.isEditingProfile) {
      this.cancelEditingProfile();
    }
    if (this.isChangingPassword) {
      this.cancelChangingPassword();
    }
  }

  getCurrentUser() {
    const user = this.backendService.getCurrentUser();
    if (user) {
      this.currentUser = {
        id: user.id || '',
        nombre: user.nombre || '',
        email: user.correo || '', // Handle undefined email
        rol: 'Admin',
        ultimoAcceso: this.convertToDate(user.fechaUltimoAcceso),
      };
    } else {
      console.warn('Usuario no encontrado');
    }
  }

  private convertToDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date();
    }

    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }

    return new Date();
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

  // Nuevos métodos para edición de perfil
  startEditingProfile() {
    this.isEditingProfile = true;
    // Copiar datos actuales al formulario de edición
    this.editProfileData = {
      nombre: this.currentUser.nombre || '',
      email: this.currentUser.email || '',
    };
  }

  cancelEditingProfile() {
    this.isEditingProfile = false;
    // Limpiar datos de edición
    this.editProfileData = {
      nombre: '',
      email: '',
    };
  }

  canSaveProfile(): boolean {
    // Validar datos
    const hasValidData =
      this.editProfileData.nombre.trim() !== '' &&
      this.editProfileData.email.trim() !== '' &&
      this.isValidEmail(this.editProfileData.email);

    // Validar cambios
    const hasChanges =
      this.editProfileData.nombre !== this.currentUser.nombre ||
      this.editProfileData.email !== this.currentUser.email;

    // Validar usuario - más explícito
    const hasValidUser =
      this.currentUser?.id != null && this.currentUser.id !== '';

    console.log('🔍 Validación de guardado:', {
      hasValidData,
      hasChanges,
      hasValidUser,
      currentUserID: this.currentUser?.id,
    });

    return hasValidData && hasChanges && hasValidUser;
  }

  isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Cambiar el método saveProfileChanges:
  saveProfileChanges() {
    if (!this.canSaveProfile()) {
      return;
    }

    this.isSavingProfile = true;

    // Preparar datos en el formato correcto para el backend
    const updateData = {
      nombre: this.editProfileData.nombre.trim(),
      email: this.editProfileData.email.trim(),
      // NO incluir password a menos que se cambie
    };

    console.log('🔄 Actualizando perfil con datos:', updateData);
    console.log('🔄 Usuario ID:', this.currentUser.id);

    // Llamar al servicio backend para actualizar
    this.backendService
      .updateUsuario(this.currentUser.id, updateData)
      .subscribe({
        next: (response) => {
          console.log('✅ Perfil actualizado exitosamente:', response);

          // Actualizar el usuario actual en memoria
          this.currentUser = {
            ...this.currentUser,
            nombre: updateData.nombre,
            email: updateData.email,
          };

          // Actualizar en localStorage
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

          // Salir del modo edición
          this.isEditingProfile = false;
          this.isSavingProfile = false;

          // Mostrar mensaje de éxito
          alert('Perfil actualizado exitosamente');
        },
        error: (error) => {
          console.error('❌ Error completo:', error);
          console.error('❌ Status:', error.status);
          console.error('❌ Message:', error.message);

          this.isSavingProfile = false;

          // Manejo específico de errores
          if (error.status === 400) {
            alert(
              'Error: El email ya está registrado por otro usuario o los datos son inválidos.'
            );
          } else {
            alert(
              'Error al actualizar el perfil. Por favor, inténtalo de nuevo.'
            );
          }
        },
      });
  }

  // Agregar estos métodos después de saveProfileChanges():

  startChangingPassword() {
    this.isChangingPassword = true;
    // Limpiar formulario
    this.changePasswordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  }

  cancelChangingPassword() {
    this.isChangingPassword = false;
    // Limpiar datos
    this.changePasswordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  }

  canSavePassword(): boolean {
    const hasAllFields =
      this.changePasswordData.currentPassword.trim() !== '' &&
      this.changePasswordData.newPassword.trim() !== '' &&
      this.changePasswordData.confirmPassword.trim() !== '';

    const passwordsMatch =
      this.changePasswordData.newPassword ===
      this.changePasswordData.confirmPassword;

    const isValidNewPassword = this.isStrongPassword(
      this.changePasswordData.newPassword
    );

    const isNotSamePassword =
      this.changePasswordData.currentPassword !==
      this.changePasswordData.newPassword;

    console.log('🔍 Validación de contraseña:', {
      hasAllFields,
      passwordsMatch,
      isValidNewPassword,
      isNotSamePassword,
    });

    return (
      hasAllFields && passwordsMatch && isValidNewPassword && isNotSamePassword
    );
  }

  isStrongPassword(password: string): boolean {
    if (password.length < 8) return false;

    // Al menos una mayúscula
    if (!/[A-Z]/.test(password)) return false;

    // Al menos una minúscula
    if (!/[a-z]/.test(password)) return false;

    // Al menos un número
    if (!/\d/.test(password)) return false;

    // Al menos un carácter especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

    return true;
  }

  // Método para obtener mensaje de validación de contraseña
  getPasswordValidationMessage(password: string): string {
    if (password.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Debe incluir al menos una mayúscula';
    if (!/[a-z]/.test(password)) return 'Debe incluir al menos una minúscula';
    if (!/\d/.test(password)) return 'Debe incluir al menos un número';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return 'Debe incluir al menos un carácter especial';
    return '';
  }

  // Reemplazar el método savePasswordChanges:
  savePasswordChanges() {
    if (!this.canSavePassword()) {
      return;
    }

    this.isSavingPassword = true;

    // Primero verificar la contraseña actual
    console.log('🔍 Verificando contraseña actual...');

    this.backendService
      .verifyCurrentPassword(
        this.currentUser.id,
        this.changePasswordData.currentPassword
      )
      .subscribe({
        next: (verifyResponse) => {
          if (!verifyResponse.isValid) {
            console.error('❌ Contraseña actual incorrecta');
            this.isSavingPassword = false;
            alert('Error: La contraseña actual es incorrecta.');
            return;
          }

          console.log(
            '✅ Contraseña actual verificada, procediendo con el cambio...'
          );

          // Si la contraseña actual es correcta, proceder con el cambio
          const updateData = {
            nombre: this.currentUser.nombre,
            email: this.currentUser.email,
            password: this.changePasswordData.newPassword,
          };

          this.backendService
            .updateUsuario(this.currentUser.id, updateData)
            .subscribe({
              next: (response) => {
                console.log('✅ Contraseña cambiada exitosamente:', response);

                this.isChangingPassword = false;
                this.isSavingPassword = false;
                this.cancelChangingPassword();

                alert('Contraseña cambiada exitosamente');
              },
              error: (error) => {
                console.error('❌ Error al cambiar contraseña:', error);
                this.isSavingPassword = false;
                alert(
                  'Error al cambiar la contraseña. Por favor, inténtalo de nuevo.'
                );
              },
            });
        },
        error: (error) => {
          console.error('❌ Error al verificar contraseña actual:', error);
          this.isSavingPassword = false;

          if (error.status === 403) {
            alert('Error: No tienes permisos para cambiar esta contraseña.');
          } else {
            alert(
              'Error al verificar la contraseña actual. Por favor, inténtalo de nuevo.'
            );
          }
        },
      });
  }

  // Alternativa: Un método que devuelve todas las validaciones

  getPasswordValidation(password: string) {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasContent: password.length > 0,
    };
  }
}
