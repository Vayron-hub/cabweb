import { Component, OnInit, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-test-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    InputTextModule,
    ChartModule
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class TestAdminDashboard implements OnInit {
  activeTab = 'dashboard';
  currentZoneType: string = '';
  selectedLocation = 'Edificio D';
  
  locations = [
    'Edificio D',
    'Zona Norte', 
    'Zona Sur',
    'Zona Este',
    'Zona Oeste',
    'Centro'
  ];

  // Estadísticas por zona
  dashboardStats: any = {
    'Edificio D': {
      active: 8,
      processing: 2,
      totalReports: 43,
      totalUsers: 15,
      thisMonth: 35,
      totalClassifiers: 3,
      totalDetections: 43,
      activeUsers: 8
    },
    'Zona Norte': {
      active: 12,
      processing: 5,
      totalReports: 20,
      totalUsers: 18,
      thisMonth: 15,
      totalClassifiers: 2,
      totalDetections: 20,
      activeUsers: 12
    },
    'Zona Sur': {
      active: 15,
      processing: 8,
      totalReports: 35,
      totalUsers: 22,
      thisMonth: 28,
      totalClassifiers: 2,
      totalDetections: 35,
      activeUsers: 15
    },
    'Zona Este': {
      active: 10,
      processing: 3,
      totalReports: 18,
      totalUsers: 14,
      thisMonth: 12,
      totalClassifiers: 2,
      totalDetections: 18,
      activeUsers: 10
    },
    'Zona Oeste': {
      active: 6,
      processing: 2,
      totalReports: 12,
      totalUsers: 10,
      thisMonth: 8,
      totalClassifiers: 1,
      totalDetections: 12,
      activeUsers: 6
    },
    'Centro': {
      active: 20,
      processing: 12,
      totalReports: 50,
      totalUsers: 30,
      thisMonth: 45,
      totalClassifiers: 4,
      totalDetections: 50,
      activeUsers: 20
    }
  };

  // Clasificadores por zona
  classifiersByZone: any = {
    'Edificio D': [
      {
        id: 'M-16',
        name: 'Entrada Principal',
        count: 16,
        activeCount: 1,
        inactiveCount: 1,
        pendingCount: 1,
        detections: 16
      },
      {
        id: 'PF-SUP',
        name: 'Pasillo Superior',
        count: 15,
        activeCount: 4,
        inactiveCount: 2,
        pendingCount: 5,
        detections: 15
      },
      {
        id: 'PF-INF',
        name: 'Pasillo Inferior',
        count: 12,
        activeCount: 7,
        inactiveCount: 0,
        pendingCount: 12,
        detections: 12
      }
    ],
    'Zona Norte': [
      {
        id: 'ZN-01',
        name: 'Clasificador Norte A',
        count: 8,
        activeCount: 3,
        inactiveCount: 2,
        pendingCount: 3,
        detections: 8
      },
      {
        id: 'ZN-02',
        name: 'Clasificador Norte B',
        count: 12,
        activeCount: 5,
        inactiveCount: 4,
        pendingCount: 3,
        detections: 12
      }
    ],
    'Zona Sur': [
      {
        id: 'ZS-01',
        name: 'Clasificador Sur A',
        count: 20,
        activeCount: 8,
        inactiveCount: 7,
        pendingCount: 5,
        detections: 20
      },
      {
        id: 'ZS-02',
        name: 'Clasificador Sur B',
        count: 15,
        activeCount: 6,
        inactiveCount: 5,
        pendingCount: 4,
        detections: 15
      }
    ]
  };

  users = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan.perez@email.com',
      rol: 'Administrador',
      estado: 'Activo',
      fechaCreacion: '2024-01-15',
      ultimoAcceso: '2024-01-20'
    },
    {
      id: 2,
      nombre: 'María García',
      email: 'maria.garcia@email.com',
      rol: 'Usuario',
      estado: 'Inactivo',
      fechaCreacion: '2024-01-10',
      ultimoAcceso: '2024-01-18'
    },
    {
      id: 3,
      nombre: 'Carlos López',
      email: 'carlos.lopez@email.com',
      rol: 'Moderador',
      estado: 'Activo',
      fechaCreacion: '2024-01-12',
      ultimoAcceso: '2024-01-19'
    }
  ];

  filteredUsers = [...this.users];
  selectedUsers: number[] = [];
  searchTerm = '';
  selectedRoles: string[] = [];
  roleOptions = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Usuario', value: 'Usuario' },
    { label: 'Moderador', value: 'Moderador' }
  ];
  
  // Propiedades para clasificadores
  classifierSearchTerm = '';
  filteredClassifiers = [...this.getCurrentClassifiers()];

  // === PROPIEDADES PARA MENÚ DE USUARIO ===
  userMenuOpen = false;
  showAccountModal = false;
  currentUser = {
    nombre: 'Juan Administrador',
    rol: 'Administrador',
    email: 'admin@cab.com',
    id: 'ADM001',
    ultimoAcceso: new Date()
  };
  
  chartData: any;
  chartOptions: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.currentZoneType = params['type'] || '';
      if (this.currentZoneType) {
        this.mapZoneTypeToLocation(this.currentZoneType);
      }
    });
    
    this.initChart();
    this.updateFilteredClassifiers();
  }

  initChart() {
    this.chartData = {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      datasets: [
        {
          label: 'Reportes',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Estadísticas Mensuales'
        }
      }
    };
  }

  mapZoneTypeToLocation(zoneType: string) {
    const zoneMapping: any = {
      'edificio': 'Edificio D',
      'norte': 'Zona Norte',
      'sur': 'Zona Sur',
      'este': 'Zona Este',
      'oeste': 'Zona Oeste',
      'centro': 'Centro'
    };
    
    if (zoneMapping[zoneType]) {
      this.selectedLocation = zoneMapping[zoneType];
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onLocationChange() {
    console.log('Location changed to:', this.selectedLocation);
    this.initChart();
    this.updateFilteredClassifiers();
  }

  // Método para obtener clasificadores de la zona actual
  getCurrentClassifiers() {
    return this.classifiersByZone[this.selectedLocation] || [];
  }

  // Método para obtener estadísticas de la zona actual
  getCurrentStats() {
    return this.dashboardStats[this.selectedLocation] || {
      active: 0,
      processing: 0,
      totalReports: 0,
      totalUsers: 0,
      thisMonth: 0,
      totalClassifiers: 0,
      totalDetections: 0,
      activeUsers: 0
    };
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.selectedRoles.length === 0 || this.selectedRoles.includes(user.rol);
      return matchesSearch && matchesRole;
    });
  }

  // Métodos para gestión de usuarios
  exportUsersData() {
    console.log('Exportando datos de usuarios');
    // Implementar exportación
  }

  addNewUser() {
    console.log('Agregando nuevo usuario');
    // Implementar modal o navegación para agregar usuario
  }

  onRoleFilterChange(event: any) {
    const value = event.target.value;
    const checked = event.target.checked;
    
    if (checked) {
      this.selectedRoles.push(value);
    } else {
      this.selectedRoles = this.selectedRoles.filter(role => role !== value);
    }
    
    this.filterUsers();
  }

  getActiveUsersCount(): number {
    return this.users.filter(user => user.estado === 'Activo').length;
  }

  getInactiveUsersCount(): number {
    return this.users.filter(user => user.estado === 'Inactivo').length;
  }

  getTotalUsersCount(): number {
    return this.users.length;
  }

  selectAllUsers(event: any) {
    if (event.target.checked) {
      this.selectedUsers = this.filteredUsers.map(user => user.id);
    } else {
      this.selectedUsers = [];
    }
  }

  allUsersSelected(): boolean {
    return this.filteredUsers.length > 0 && 
           this.selectedUsers.length === this.filteredUsers.length;
  }

  trackByUserId(index: number, user: any): number {
    return user.id;
  }

  toggleUserSelection(userId: number, event: any) {
    if (event.target.checked) {
      this.selectedUsers.push(userId);
    } else {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    }
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'Administrador':
        return 'role-admin';
      case 'Moderador':
        return 'role-moderator';
      case 'Usuario':
        return 'role-user';
      default:
        return 'role-default';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Activo':
        return 'status-active';
      case 'Inactivo':
        return 'status-inactive';
      case 'Pendiente':
        return 'status-pending';
      default:
        return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Activo':
        return 'pi-check-circle';
      case 'Inactivo':
        return 'pi-times-circle';
      case 'Pendiente':
        return 'pi-clock';
      default:
        return 'pi-question-circle';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  canEditUser(): boolean {
    // Solo el administrador puede editar usuarios
    return this.getCurrentUserRole() === 'Administrador';
  }

  canDeleteUser(user: any): boolean {
    // Solo el administrador puede eliminar, y no puede eliminarse a sí mismo
    const currentUserRole = this.getCurrentUserRole();
    const currentUserId = this.getCurrentUserId();
    return currentUserRole === 'Administrador' && user.id !== currentUserId;
  }

  getCurrentUserRole(): string {
    // Simular obtener el rol del usuario actual
    // En una app real, esto vendría del servicio de autenticación
    return 'Administrador';
  }

  getCurrentUserId(): number {
    // Simular obtener el ID del usuario actual
    // En una app real, esto vendría del servicio de autenticación
    return 1;
  }

  toggleUserStatus(user: any) {
    if (!this.canEditUser()) return;
    
    user.estado = user.estado === 'Activo' ? 'Inactivo' : 'Activo';
    console.log(`Usuario ${user.nombre} ${user.estado.toLowerCase()}`);
  }

  bulkDeactivateUsers() {
    if (!this.canEditUser()) return;
    
    this.users.forEach(user => {
      if (this.selectedUsers.includes(user.id)) {
        user.estado = 'Inactivo';
      }
    });
    console.log('Usuarios desactivados:', this.selectedUsers);
    this.selectedUsers = [];
  }

  bulkActivateUsers() {
    if (!this.canEditUser()) return;
    
    this.users.forEach(user => {
      if (this.selectedUsers.includes(user.id)) {
        user.estado = 'Activo';
      }
    });
    console.log('Usuarios activados:', this.selectedUsers);
    this.selectedUsers = [];
  }

  bulkDeleteUsers() {
    if (!this.canEditUser()) return;
    
    // Confirmar antes de eliminar
    if (confirm(`¿Estás seguro de que quieres eliminar ${this.selectedUsers.length} usuario(s)?`)) {
      this.users = this.users.filter(user => !this.selectedUsers.includes(user.id));
      this.filterUsers();
      console.log('Usuarios eliminados:', this.selectedUsers);
      this.selectedUsers = [];
    }
  }

  // === MÉTODOS PARA CLASIFICADORES ===

  exportClassifiersData() {
    console.log('Exportando datos de clasificadores');
    // Implementar exportación de clasificadores
  }

  filterClassifiers() {
    this.filteredClassifiers = this.getCurrentClassifiers().filter((classifier: any) => 
      classifier.name.toLowerCase().includes(this.classifierSearchTerm.toLowerCase()) ||
      classifier.id.toLowerCase().includes(this.classifierSearchTerm.toLowerCase())
    );
  }

  getActiveClassifiersCount(): number {
    return this.getCurrentClassifiers().reduce((count: number, classifier: any) => count + classifier.activeCount, 0);
  }

  getInactiveClassifiersCount(): number {
    return this.getCurrentClassifiers().reduce((count: number, classifier: any) => count + classifier.inactiveCount, 0);
  }

  getPendingClassifiersCount(): number {
    return this.getCurrentClassifiers().reduce((count: number, classifier: any) => count + classifier.pendingCount, 0);
  }

  getTotalClassifiersCount(): number {
    return this.getCurrentClassifiers().length;
  }

  getClassifierStatusClass(classifier: any): string {
    const activeRatio = classifier.activeCount / (classifier.activeCount + classifier.inactiveCount + classifier.pendingCount);
    
    if (activeRatio > 0.7) {
      return 'status-active';
    } else if (activeRatio > 0.3) {
      return 'status-warning';
    } else {
      return 'status-inactive';
    }
  }

  getClassifierStatusIcon(classifier: any): string {
    const activeRatio = classifier.activeCount / (classifier.activeCount + classifier.inactiveCount + classifier.pendingCount);
    
    if (activeRatio > 0.7) {
      return 'pi-check-circle';
    } else if (activeRatio > 0.3) {
      return 'pi-exclamation-triangle';
    } else {
      return 'pi-times-circle';
    }
  }

  getLastActivity(classifier: any): string {
    // Simular última actividad basada en el ID
    const hours = Math.floor(Math.random() * 24) + 1;
    return `Hace ${hours}h`;
  }

  getAccuracy(classifier: any): number {
    // Simular precisión basada en los datos del clasificador
    const baseAccuracy = 85;
    const variance = (classifier.activeCount / (classifier.activeCount + classifier.inactiveCount + classifier.pendingCount)) * 15;
    return Math.round(baseAccuracy + variance);
  }

  getEfficiency(classifier: any): number {
    // Calcular eficiencia basada en la proporción de activos vs total
    const total = classifier.activeCount + classifier.inactiveCount + classifier.pendingCount;
    if (total === 0) return 0;
    return Math.round((classifier.activeCount / total) * 100);
  }

  getActivePercentage(): number {
    const total = this.getActiveClassifiersCount() + this.getInactiveClassifiersCount() + this.getPendingClassifiersCount();
    if (total === 0) return 0;
    return Math.round((this.getActiveClassifiersCount() / total) * 100);
  }

  getInactivePercentage(): number {
    const total = this.getActiveClassifiersCount() + this.getInactiveClassifiersCount() + this.getPendingClassifiersCount();
    if (total === 0) return 0;
    return Math.round((this.getInactiveClassifiersCount() / total) * 100);
  }

  getPendingPercentage(): number {
    const total = this.getActiveClassifiersCount() + this.getInactiveClassifiersCount() + this.getPendingClassifiersCount();
    if (total === 0) return 0;
    return Math.round((this.getPendingClassifiersCount() / total) * 100);
  }

  getAverageDetections(): number {
    const classifiers = this.getCurrentClassifiers();
    if (classifiers.length === 0) return 0;
    const totalDetections = classifiers.reduce((sum: number, classifier: any) => sum + classifier.detections, 0);
    return Math.round(totalDetections / classifiers.length);
  }

  getAverageAccuracy(): number {
    const classifiers = this.getCurrentClassifiers();
    if (classifiers.length === 0) return 0;
    const totalAccuracy = classifiers.reduce((sum: number, classifier: any) => sum + this.getAccuracy(classifier), 0);
    return Math.round(totalAccuracy / classifiers.length);
  }

  getAverageResponseTime(): number {
    // Simular tiempo de respuesta promedio
    return Math.round(120 + Math.random() * 80); // Entre 120-200ms
  }

  updateFilteredClassifiers() {
    this.filteredClassifiers = [...this.getCurrentClassifiers()];
  }

  // === MÉTODOS PARA ESTADÍSTICAS ===
  exportStatisticsData() {
    console.log('Exportando datos de estadísticas');
    // Implementar exportación de estadísticas
  }

  refreshStatistics() {
    console.log('Actualizando estadísticas');
    // Implementar actualización de estadísticas
  }

  // === MÉTODOS PARA MENÚ DE USUARIO ===
  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu() {
    this.userMenuOpen = false;
  }

  viewMyAccount() {
    console.log('Abriendo modal de mi cuenta');
    this.closeUserMenu();
    this.showAccountModal = true;
  }

  logout() {
    console.log('Cerrando sesión');
    this.closeUserMenu();
    
    // Confirmar logout
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Limpiar datos de sesión
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      
      // Mensaje de confirmación
      console.log('Sesión cerrada exitosamente');
      
      // Navegar a la página principal o login
      // Como no tenemos ruta de login definida, navegamos al landing
      this.router.navigate(['/landing']).then(() => {
        // Opcional: recargar la página para limpiar completamente el estado
        window.location.reload();
      });
    }
  }

  // Listener para cerrar el menú cuando se hace clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const userMenuContainer = target.closest('.user-menu-container');
    
    if (!userMenuContainer && this.userMenuOpen) {
      this.closeUserMenu();
    }
  }

  getSeverity(status: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'Activo':
        return 'success';
      case 'Inactivo':
        return 'danger';
      case 'Pendiente':
        return 'warning';
      case 'Administrador':
        return 'info';
      case 'Usuario':
        return 'secondary';
      case 'Moderador':
        return 'warning';
      default:
        return 'info';
    }
  }

  editUser(user: any) {
    console.log('Editando usuario:', user);
  }

  deleteUser(user: any) {
    console.log('Eliminando usuario:', user);
  }

  // === MÉTODOS PARA MODAL DE CUENTA ===
  closeAccountModal() {
    this.showAccountModal = false;
  }

  formatAccountDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  editProfile() {
    console.log('Editar perfil');
    alert('Función de editar perfil - Por implementar');
  }

  changePassword() {
    console.log('Cambiar contraseña');
    alert('Función de cambio de contraseña - Por implementar');
  }

  goBack() {
    this.router.navigate(['/landing']);
  }
}
