import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { Subscription } from 'rxjs';
import {
  BackendService,
  Zona,
  User,
  newUser,
} from '../../services/backend.service';
import { ZonaService, ZonaInfo } from '../../services/zona.service';
import { AuthService } from '../../services/auth';
import { DialogModule } from 'primeng/dialog';
import { User as us } from '../productos/productos';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    InputTextModule,
    CheckboxModule,
    DialogModule,
  ],
  templateUrl: './usuarios.html',
})
export class UsuariosComponent implements OnInit, OnDestroy {
  @Input() currentUser: us = {
    id: '',
    nombre: '',
    email: '',
    rol: '',
    ultimoAcceso: new Date(),
  };
  // Ubicación actual (sincronizada con ZonaService)
  selectedLocation = '';
  selectedZonaId: string | number = '';

  // Datos de usuarios
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  isLoadingUsers = false;

  // Filtros y búsqueda
  searchTerm = '';
  selectedRoles: string[] = [];
  roleOptions = [
    { label: 'Administrador', value: 'administrador' },
    { label: 'Usuario', value: 'usuario' },
    { label: 'Operador', value: 'operador' },
  ];

  newUser: newUser = {
    nombre: '',
    correo: '',
    password: '',
    rol: ''
  };

  // Selección múltiple
  selectedUsers: (string | number)[] = [];

  // Suscripciones
  private zonaSubscription: Subscription = new Subscription();

  constructor(
    private backendService: BackendService,
    private zonaService: ZonaService,
    private authService: AuthService
  ) {
    console.log('🏗️ USUARIOS COMPONENT - Constructor ejecutado');
  }

  ngOnInit() {
    this.subscribeToZonaChanges();
    this.loadUsers();
    this.getCurrentUser();
  }

  ngOnDestroy() {
    this.zonaSubscription.unsubscribe();
  }

  getCurrentUser() {
    const user = this.backendService.getCurrentUser();
    if (user) {
      this.currentUser = {
        id: user.id || '',
        nombre: user.nombre || '',
        email: (user as any).correo || (user as any).email || '',
        rol: (user as any).rol || '',
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

  subscribeToZonaChanges() {
    this.zonaSubscription = this.zonaService.selectedZona$.subscribe({
      next: (zonaInfo: ZonaInfo) => {
        console.log('🔄 Cambio de zona detectado en usuarios:', zonaInfo);

        if (zonaInfo.id) {
          this.selectedLocation = zonaInfo.nombre;
          this.selectedZonaId = zonaInfo.id;
          console.log(
            '📍 Zona actualizada en usuarios:',
            this.selectedLocation
          );
        }
      },
    });
  }

  loadUsers() {
    console.log('🔍 CARGANDO USUARIOS DEL BACKEND...');
    this.isLoadingUsers = true;

    this.backendService.getUsuarios().subscribe({
      next: (usuarios) => {
        console.log('✅ USUARIOS RECIBIDOS:', usuarios);
        this.allUsers = usuarios;
        this.filteredUsers = [...this.allUsers];
        this.isLoadingUsers = false;
        console.log('🔄 Total usuarios cargados:', this.allUsers.length);
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR USUARIOS:', error);
        // Fallback a datos de AuthService solo si hay error
        console.log('🔄 Usando fallback de AuthService...');
        this.allUsers = this.authService.getAllUsers();
        this.filteredUsers = [...this.allUsers];
        this.isLoadingUsers = false;
      },
    });
  }

  postUser() {
    if (
      !this.newUser.nombre ||
      !this.newUser.correo ||
      !this.newUser.password
    ) {
      alert('Por favor, completa todos los campos del formulario.');
      return;
    } else if (this.newUser.password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    } else if (!this.newUser.nombre.trim()) {
      alert('El nombre no puede estar vacío.');
      return;
    } else if (!this.newUser.correo.trim()) {
      alert('El correo no puede estar vacío.');
      return;
    } else if (!this.newUser.password.trim()) {
      alert('La contraseña no puede estar vacía.');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.newUser.correo)) {
      alert('Por favor, ingresa un correo electrónico válido.');
      return;
    } else if (
      this.allUsers.some((user) => user.correo === this.newUser.correo)
    ) {
      alert('Ya existe un usuario con este correo electrónico.');
      return;
    } else {
      console.log('📤 Enviando nuevo usuario al backend:', this.newUser);
      this.backendService.postUsuarios(this.newUser).subscribe({
        next: (response) => {
          console.log('✅ Usuario creado exitosamente:', response);
          this.loadUsers();
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          alert('Error al crear el usuario. Por favor, inténtalo de nuevo.');
        },
      });
    }
  }

  filterUsers() {
    this.filteredUsers = this.allUsers.filter((user) => {
      const matchesSearch =
        user.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.correo.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesSearch;
    });
  }

  onRoleFilterChange(event: any) {
    const role = event.target.value;
    if (event.target.checked) {
      this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter((r) => r !== role);
    }
    this.filterUsers();
  }

  // Métodos de estadísticas
  getActiveUsersCount(): number {
    return this.allUsers.filter((user) => user.estado === 'Activo').length;
  }

  getInactiveUsersCount(): number {
    return this.allUsers.filter((user) => user.estado !== 'Activo').length;
  }

  getTotalUsersCount(): number {
    return this.allUsers.length;
  }

  // Métodos de selección
  toggleUserSelection(userId: string | number, event: any) {
    if (event.target.checked) {
      this.selectedUsers.push(userId);
    } else {
      this.selectedUsers = this.selectedUsers.filter((id) => id !== userId);
    }
  }

  selectAllUsers(event: any) {
    if (event.target.checked) {
      this.selectedUsers = [...this.filteredUsers.map((user) => user.id)];
    } else {
      this.selectedUsers = [];
    }
  }

  allUsersSelected(): boolean {
    return (
      this.selectedUsers.length === this.filteredUsers.length &&
      this.filteredUsers.length > 0
    );
  }

  // Métodos de acción
  addNewUser() {
    console.log('Agregar nuevo usuario');
    // TODO: Implementar modal o navegación para agregar usuario
  }

  editUser(user: User) {
    console.log('Editar usuario:', user);
    // TODO: Implementar modal o navegación para editar usuario
  }

  deleteUser(user: User) {
    if (
      confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.nombre}?`)
    ) {
      console.log('🗑️ Eliminando usuario:', user.nombre);

      this.backendService.deleteUsuario(user.id).subscribe({
        next: () => {
          console.log('✅ Usuario eliminado exitosamente');
          // Recargar la lista de usuarios
          this.loadUsers();
        },
        error: (error) => {
          console.error('❌ Error al eliminar usuario:', error);
          alert('Error al eliminar el usuario. Por favor, inténtalo de nuevo.');
        },
      });
    }
  }

  toggleUserStatus(user: User) {
    const currentStatus = user.estado || 'Inactivo';
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';

    console.log(`🔄 Cambiando estado de ${user.nombre} a ${newStatus}`);

    // Actualizar el estado (asumiendo que el backend maneja 'activo' como boolean)
    const updateData = {
      ...user,
      activo: newStatus === 'Activo',
    };

    this.backendService.updateUsuario(user.id, updateData).subscribe({
      next: (updatedUser) => {
        console.log('✅ Estado de usuario actualizado exitosamente');
        // Actualizar el usuario en la lista local
        const userIndex = this.allUsers.findIndex((u) => u.id === user.id);
        if (userIndex !== -1) {
          this.allUsers[userIndex] = updatedUser;
          this.filterUsers();
        }
      },
      error: (error) => {
        console.error('❌ Error al actualizar estado del usuario:', error);
        alert(
          'Error al cambiar el estado del usuario. Por favor, inténtalo de nuevo.'
        );
      },
    });
  }

  // Acciones masivas
  bulkActivateUsers() {
    if (this.selectedUsers.length === 0) {
      alert('Por favor, selecciona usuarios para activar.');
      return;
    }

    console.log('🔄 Activando usuarios seleccionados:', this.selectedUsers);

    // Procesar cada usuario seleccionado
    const updatePromises = this.selectedUsers
      .map((userId) => {
        const user = this.allUsers.find((u) => u.id === userId);
        if (user) {
          const updateData = { ...user, activo: true };
          return this.backendService
            .updateUsuario(userId, updateData)
            .toPromise();
        }
        return null;
      })
      .filter((promise) => promise !== null);

    Promise.all(updatePromises)
      .then(() => {
        console.log('✅ Usuarios activados exitosamente');
        this.selectedUsers = [];
        this.loadUsers();
      })
      .catch((error) => {
        console.error('❌ Error al activar usuarios:', error);
        alert(
          'Error al activar algunos usuarios. Por favor, inténtalo de nuevo.'
        );
      });
  }

  bulkDeactivateUsers() {
    if (this.selectedUsers.length === 0) {
      alert('Por favor, selecciona usuarios para desactivar.');
      return;
    }

    console.log('🔄 Desactivando usuarios seleccionados:', this.selectedUsers);

    // Procesar cada usuario seleccionado
    const updatePromises = this.selectedUsers
      .map((userId) => {
        const user = this.allUsers.find((u) => u.id === userId);
        if (user) {
          const updateData = { ...user, activo: false };
          return this.backendService
            .updateUsuario(userId, updateData)
            .toPromise();
        }
        return null;
      })
      .filter((promise) => promise !== null);

    Promise.all(updatePromises)
      .then(() => {
        console.log('✅ Usuarios desactivados exitosamente');
        this.selectedUsers = [];
        this.loadUsers();
      })
      .catch((error) => {
        console.error('❌ Error al desactivar usuarios:', error);
        alert(
          'Error al desactivar algunos usuarios. Por favor, inténtalo de nuevo.'
        );
      });
  }

  bulkDeleteUsers() {
    if (this.selectedUsers.length === 0) {
      alert('Por favor, selecciona usuarios para eliminar.');
      return;
    }

    if (
      confirm(
        `¿Estás seguro de que deseas eliminar ${this.selectedUsers.length} usuarios?`
      )
    ) {
      console.log('🗑️ Eliminando usuarios seleccionados:', this.selectedUsers);

      // Usar lastValueFrom en lugar de toPromise()
      const deletePromises = this.selectedUsers.map((userId) =>
        lastValueFrom(this.backendService.deleteUsuario(userId))
      );

      Promise.all(deletePromises)
        .then((responses) => {
          console.log('✅ Respuestas del servidor:', responses);
          console.log('✅ Usuarios eliminados exitosamente');
          this.selectedUsers = [];
          this.loadUsers();
        })
        .catch((error) => {
          console.error('❌ Error al eliminar usuarios:', error);
          alert(
            'Error al eliminar algunos usuarios. Por favor, inténtalo de nuevo.'
          );
        });
    }
  }

  formatDate(fecha: Date | string | undefined): string {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  trackByUserId(index: number, user: User): string | number {
    return user.id;
  }

  canDeleteUser(): boolean {
    // Primero verificar que haya usuarios seleccionados
    if (this.selectedUsers.length === 0) {
      return false;
    }

    const currentUser = this.authService.getCurrentUser();
    // No permitir eliminar si el usuario actual está en la selección
    if (currentUser && this.selectedUsers.includes(currentUser.id)) {
      return false;
    }

    return true; // Solo permite eliminar si hay usuarios seleccionados Y no incluye el usuario actual
  }

  visible: boolean = false;

  showDialog() {
    this.visible = true;
  }
  hideDialog() {
    this.newUser = {
      nombre: '',
      correo: '',
      password: '',
      rol: ''
    };
    this.visible = false;
  }
}
