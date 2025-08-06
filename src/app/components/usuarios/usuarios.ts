import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { Subscription } from 'rxjs';
import { BackendService, Zona, User } from '../../services/backend.service';
import { ZonaService, ZonaInfo } from '../../services/zona.service';
import { AuthService } from '../../services/auth';
import { DialogModule } from 'primeng/dialog';

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
    DialogModule
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosComponent implements OnInit, OnDestroy {
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
    { label: 'Operador', value: 'operador' }
  ];

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
    console.log('🚀 USUARIOS COMPONENT - ngOnInit iniciado');
    this.subscribeToZonaChanges();
    this.loadUsers();
    console.log('🚀 USUARIOS COMPONENT - ngOnInit completado');
  }

  ngOnDestroy() {
    this.zonaSubscription.unsubscribe();
  }

  subscribeToZonaChanges() {
    this.zonaSubscription = this.zonaService.selectedZona$.subscribe({
      next: (zonaInfo: ZonaInfo) => {
        console.log('🔄 Cambio de zona detectado en usuarios:', zonaInfo);

        if (zonaInfo.id) {
          this.selectedLocation = zonaInfo.nombre;
          this.selectedZonaId = zonaInfo.id;
          console.log('📍 Zona actualizada en usuarios:', this.selectedLocation);
        }
      }
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
      }
    });
  }

  filterUsers() {
    this.filteredUsers = this.allUsers.filter(user => {
      const matchesSearch = user.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.correo.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = this.selectedRoles.length === 0 ||
        this.selectedRoles.includes(user.rol || '');

      return matchesSearch && matchesRole;
    });
  }

  onRoleFilterChange(event: any) {
    const role = event.target.value;
    if (event.target.checked) {
      this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter(r => r !== role);
    }
    this.filterUsers();
  }

  // Métodos de estadísticas
  getActiveUsersCount(): number {
    return this.allUsers.filter(user => user.estado === 'Activo').length;
  }

  getInactiveUsersCount(): number {
    return this.allUsers.filter(user => user.estado !== 'Activo').length;
  }

  getTotalUsersCount(): number {
    return this.allUsers.length;
  }

  // Métodos de selección
  toggleUserSelection(userId: string | number, event: any) {
    if (event.target.checked) {
      this.selectedUsers.push(userId);
    } else {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    }
  }

  selectAllUsers(event: any) {
    if (event.target.checked) {
      this.selectedUsers = [...this.filteredUsers.map(user => user.id)];
    } else {
      this.selectedUsers = [];
    }
  }

  allUsersSelected(): boolean {
    return this.selectedUsers.length === this.filteredUsers.length && this.filteredUsers.length > 0;
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
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.nombre}?`)) {
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
        }
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
      activo: newStatus === 'Activo'
    };

    this.backendService.updateUsuario(user.id, updateData).subscribe({
      next: (updatedUser) => {
        console.log('✅ Estado de usuario actualizado exitosamente');
        // Actualizar el usuario en la lista local
        const userIndex = this.allUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          this.allUsers[userIndex] = updatedUser;
          this.filterUsers();
        }
      },
      error: (error) => {
        console.error('❌ Error al actualizar estado del usuario:', error);
        alert('Error al cambiar el estado del usuario. Por favor, inténtalo de nuevo.');
      }
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
    const updatePromises = this.selectedUsers.map(userId => {
      const user = this.allUsers.find(u => u.id === userId);
      if (user) {
        const updateData = { ...user, activo: true };
        return this.backendService.updateUsuario(userId, updateData).toPromise();
      }
      return null;
    }).filter(promise => promise !== null);

    Promise.all(updatePromises).then(() => {
      console.log('✅ Usuarios activados exitosamente');
      this.selectedUsers = [];
      this.loadUsers();
    }).catch(error => {
      console.error('❌ Error al activar usuarios:', error);
      alert('Error al activar algunos usuarios. Por favor, inténtalo de nuevo.');
    });
  }

  bulkDeactivateUsers() {
    if (this.selectedUsers.length === 0) {
      alert('Por favor, selecciona usuarios para desactivar.');
      return;
    }

    console.log('🔄 Desactivando usuarios seleccionados:', this.selectedUsers);

    // Procesar cada usuario seleccionado
    const updatePromises = this.selectedUsers.map(userId => {
      const user = this.allUsers.find(u => u.id === userId);
      if (user) {
        const updateData = { ...user, activo: false };
        return this.backendService.updateUsuario(userId, updateData).toPromise();
      }
      return null;
    }).filter(promise => promise !== null);

    Promise.all(updatePromises).then(() => {
      console.log('✅ Usuarios desactivados exitosamente');
      this.selectedUsers = [];
      this.loadUsers();
    }).catch(error => {
      console.error('❌ Error al desactivar usuarios:', error);
      alert('Error al desactivar algunos usuarios. Por favor, inténtalo de nuevo.');
    });
  }

  bulkDeleteUsers() {
    if (this.selectedUsers.length === 0) {
      alert('Por favor, selecciona usuarios para eliminar.');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar ${this.selectedUsers.length} usuarios?`)) {
      console.log('🗑️ Eliminando usuarios seleccionados:', this.selectedUsers);

      // Procesar cada usuario seleccionado
      const deletePromises = this.selectedUsers.map(userId =>
        this.backendService.deleteUsuario(userId).toPromise()
      );

      Promise.all(deletePromises).then(() => {
        console.log('✅ Usuarios eliminados exitosamente');
        this.selectedUsers = [];
        this.loadUsers();
      }).catch(error => {
        console.error('❌ Error al eliminar usuarios:', error);
        alert('Error al eliminar algunos usuarios. Por favor, inténtalo de nuevo.');
      });
    }
  }

  exportUsersData() {
    console.log('📊 Exportando datos de usuarios...');

    if (this.filteredUsers.length === 0) {
      alert('No hay usuarios para exportar.');
      return;
    }

    // Crear datos CSV
    const csvHeaders = ['ID', 'Nombre', 'Correo', 'Rol', 'Estado', 'Fecha Creación', 'Último Acceso'];
    const csvData = this.filteredUsers.map(user => [
      user.id,
      user.nombre,
      user.correo,
      user.rol || 'Usuario',
      user.estado || 'Inactivo',
      this.formatDate(user.fechaCreacion),
      this.formatDate(user.ultimoAcceso)
    ]);

    // Convertir a CSV
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ Datos exportados exitosamente');
  }

  // Métodos de utilidad
  getRoleClass(rol: string | undefined): string {
    if (!rol) return 'role-user';
    switch (rol.toLowerCase()) {
      case 'administrador': return 'role-admin';
      case 'operador': return 'role-moderator';
      case 'usuario': return 'role-user';
      default: return 'role-user';
    }
  }

  getStatusClass(estado: string | undefined): string {
    if (!estado) return 'status-inactive';
    return estado === 'Activo' ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(estado: string | undefined): string {
    if (!estado) return 'pi-times-circle';
    return estado === 'Activo' ? 'pi-check-circle' : 'pi-times-circle';
  }

  formatDate(fecha: Date | string | undefined): string {
    if (!fecha) return 'Nunca';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  trackByUserId(index: number, user: User): string | number {
    return user.id;
  }

  canEditUser(): boolean {
    return this.authService.canEditUsers();
  }

  canDeleteUser(user: User): boolean {
    const currentUser = this.authService.getCurrentUser();
    // No permitir eliminar el propio usuario
    return this.canEditUser() && currentUser?.id !== user.id;
  }

  visible: boolean = false;

  showDialog() {
    this.visible = true;
  }
}
