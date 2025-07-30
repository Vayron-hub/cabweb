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
import { AuthService } from '../../services/auth';
import { BackendService, Zona } from '../../services/backend.service';

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
  selectedLocation = '';
  selectedZonaId: string | number = '';
  
  // Zonas del backend
  zonas: Zona[] = [];
  locations: string[] = [];
  isLoadingZonas = false;
  
  // Clasificadores del backend
  clasificadores: any[] = [];
  clasificadoresPorZona: any[] = [];
  isLoadingClasificadores = false;
  
  // Estados de carga adicionales
  isLoadingStats = false;
  isLoadingUsers = false; // Nuevo estado de carga para usuarios
  
  // Datos para gráficos de estadísticas específicos
  deteccionesPorHora: number[] = [85, 65, 75, 90];
  clasificacionesExitosas: number[] = [92, 78, 88, 95];
  flujoTransporte: number[] = [70, 45, 60, 80];
  actividadUsuarios: number[] = [88, 72, 95, 63];
  
  // Últimas detecciones
  ultimasDetecciones: any[] = [];
  isLoadingDetecciones = false;
  
  // Mantener ubicación por defecto mientras carga
  defaultLocation = 'Edificio D';

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

  // Clasificadores por zona - Datos del backend real exactos
  classifiersByZone: any = {
    'Edificio D': [
      {
        id: 1,
        name: 'Entrada Principal',
        count: 1,
        activeCount: 1, // Orgánico (1 detección real en DB)
        inactiveCount: 0, // Valorizable/reciclable (0 detecciones)
        pendingCount: 0, // Desecho general (0 detecciones)
        detections: 1 // Total real de la DB
      },
      {
        id: 2,
        name: 'Pasillo',
        count: 1,
        activeCount: 0, // Orgánico (0 detecciones)
        inactiveCount: 1, // Valorizable/reciclable (1 detección real en DB - "Pasillo Inferior" mapeado)
        pendingCount: 0, // Desecho general (0 detecciones)
        detections: 1 // Total real de la DB
      },
      {
        id: 3,
        name: 'Pasillo Superior',
        count: 1,
        activeCount: 0, // Orgánico (0 detecciones)
        inactiveCount: 0, // Valorizable/reciclable (0 detecciones)
        pendingCount: 1, // Desecho general (1 detección real en DB)
        detections: 1 // Total real de la DB
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

  // Usuarios del backend - inicialmente vacío, se carga desde la API
  users: any[] = [];
  
  // Usuarios hardcodeados como fallback
  private fallbackUsers = [
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
  currentUser: any = null; // Se inicializará desde AuthService
  
  chartData: any;
  chartOptions: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private backendService: BackendService
  ) {}

  ngOnInit() {
    // Inicializar usuario actual desde AuthService
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      // Si no hay usuario logueado, redirigir al login/landing
      this.router.navigate(['/landing']);
      return;
    }

    // Cargar zonas del backend
    this.loadZonas();

    // Cargar estadísticas generales
    this.loadGeneralStats();

    // Cargar todos los clasificadores
    this.loadAllClasificadores();

    // Cargar usuarios del backend
    this.loadUsers();

    // Cargar datos específicos para gráficos de estadísticas
    this.loadDeteccionesPorHora();
    this.loadClasificacionesExitosas();
    
    // Cargar últimas detecciones
    this.loadUltimasDetecciones();
    this.loadActividadUsuarios();

    this.route.params.subscribe(params => {
      this.currentZoneType = params['type'] || '';
      if (this.currentZoneType) {
        this.mapZoneTypeToLocation(this.currentZoneType);
      }
    });
    
    this.initChart();
    this.updateFilteredClassifiers();
  }

  // === MÉTODOS PARA CARGAR DATOS DEL BACKEND ===
  
  loadZonas() {
    this.isLoadingZonas = true;
    console.log('🔄 Cargando zonas del backend...');
    
    this.backendService.getZonas().subscribe({
      next: (zonas) => {
        console.log('✅ Zonas cargadas:', zonas);
        this.zonas = zonas;
        this.locations = zonas.map(zona => zona.nombre);
        
        // Seleccionar la primera zona por defecto si no hay selección
        if (this.locations.length > 0 && !this.selectedLocation) {
          this.selectedLocation = this.locations[0];
          this.selectedZonaId = this.zonas[0].id;
        }
        
        this.isLoadingZonas = false;
      },
      error: (error) => {
        console.error('❌ Error cargando zonas:', error);
        this.isLoadingZonas = false;
        
        // Fallback a datos hardcodeados si falla el backend
        console.log('⚠️ Usando datos hardcodeados como fallback');
        this.locations = [
          'Edificio D',
          'Zona Norte', 
          'Zona Sur',
          'Zona Este',
          'Zona Oeste',
          'Centro'
        ];
        this.selectedLocation = this.defaultLocation;
      }
    });
  }

  loadGeneralStats() {
    console.log('🔄 Cargando estadísticas generales...');
    
    this.backendService.getEstadisticasGenerales().subscribe({
      next: (stats) => {
        console.log('✅ Estadísticas generales cargadas:', stats);
        
        // Actualizar las estadísticas generales para todas las zonas
        // Esto es temporal mientras conectamos completamente con el backend
        const updatedStats = {
          active: stats.usuariosActivos || 8,
          processing: Math.floor(stats.deteccionesHoy / 5) || 2,
          totalReports: stats.totalDetecciones || 43,
          totalUsers: stats.totalUsuarios || 15,
          thisMonth: stats.deteccionesEsteMes || 127,
          totalClassifiers: stats.totalClasificadores || 12,
          totalDetections: stats.totalDetecciones || 89,
          activeUsers: stats.usuariosActivos || 8
        };
        
        // Actualizar todas las zonas con las estadísticas reales
        Object.keys(this.dashboardStats).forEach(zona => {
          this.dashboardStats[zona] = { ...this.dashboardStats[zona], ...updatedStats };
        });
        
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas generales:', error);
        console.log('⚠️ Manteniendo estadísticas hardcodeadas');
      }
    });
  }

  loadClasificadoresPorZona(zonaId: string | number) {
    this.isLoadingClasificadores = true;
    console.log('🔄 Cargando clasificadores para zona:', zonaId);
    
    this.backendService.getClasificadoresPorZona(zonaId).subscribe({
      next: (clasificadores) => {
        console.log('✅ Clasificadores cargados:', clasificadores);
        
        // Transformar datos del backend al formato esperado por la UI
        this.clasificadoresPorZona = clasificadores.map(clasificador => ({
          id: clasificador.id,
          name: clasificador.nombre,
          location: clasificador.zona || this.selectedLocation,
          status: clasificador.estado,
          activeCount: 0, // Se actualizará con detecciones reales
          inactiveCount: 0, // Se actualizará con detecciones reales  
          pendingCount: 0, // Se actualizará con detecciones reales
          type: clasificador.tipo,
          capacity: clasificador.capacidad || 100,
          level: clasificador.nivelLlenado || Math.floor(Math.random() * 100)
        }));
        
        // Cargar detecciones por tipo para cada clasificador
        this.loadDeteccionesPorTipo();
        
        this.isLoadingClasificadores = false;
        this.updateFilteredClassifiers();
      },
      error: (error) => {
        console.error('❌ Error cargando clasificadores:', error);
        this.isLoadingClasificadores = false;
        
        // Mantener datos hardcodeados como fallback
        console.log('⚠️ Usando clasificadores hardcodeados como fallback');
        this.setFallbackDetections();
      }
    });
  }

  loadAllClasificadores() {
    this.isLoadingClasificadores = true;
    console.log('🔄 Cargando todos los clasificadores...');
    
    this.backendService.getClasificadores().subscribe({
      next: (clasificadores) => {
        console.log('✅ Todos los clasificadores cargados:', clasificadores);
        this.clasificadores = clasificadores;
        
        // Transformar para que también tengan contadores de detecciones
        this.clasificadores = clasificadores.map(clasificador => ({
          ...clasificador,
          activeCount: 0,
          inactiveCount: 0,
          pendingCount: 0
        }));
        
        // Cargar detecciones por tipo para todos los clasificadores
        this.loadDeteccionesPorTipoGeneral();
        
        this.isLoadingClasificadores = false;
      },
      error: (error) => {
        console.error('❌ Error cargando todos los clasificadores:', error);
        this.isLoadingClasificadores = false;
        this.setFallbackDetectionsGeneral();
      }
    });
  }

  initChart() {
    // Cargar estadísticas del dashboard
    this.loadDashboardStats();
    
    // Configurar opciones del gráfico
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

  loadDashboardStats() {
    console.log('🔄 Cargando estadísticas del dashboard...');
    
    this.backendService.getDashboardData().subscribe({
      next: (dashboardData) => {
        console.log('✅ Datos del dashboard cargados:', dashboardData);
        
        // Usar datos reales para el gráfico
        this.chartData = {
          labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
          datasets: [
            {
              label: 'Detecciones',
              data: [
                dashboardData.estadisticasGenerales.deteccionesEsteMes || 12,
                dashboardData.estadisticasGenerales.deteccionesHoy * 30 || 19,
                dashboardData.estadisticasGenerales.totalDetecciones / 12 || 3,
                Math.floor(Math.random() * 20) + 5,
                Math.floor(Math.random() * 15) + 2,
                Math.floor(Math.random() * 10) + 3
              ],
              backgroundColor: 'rgba(74, 124, 89, 0.2)',
              borderColor: 'rgba(74, 124, 89, 1)',
              borderWidth: 2
            }
          ]
        };
      },
      error: (error) => {
        console.error('❌ Error cargando datos del dashboard:', error);
        
        // Fallback a datos mock
        this.initChartFallback();
      }
    });
  }

  private initChartFallback() {
    console.log('⚠️ Usando datos mock para gráfico del admin');
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
    
    // Encontrar el ID de la zona seleccionada
    const zonaSeleccionada = this.zonas.find(zona => zona.nombre === this.selectedLocation);
    if (zonaSeleccionada) {
      this.selectedZonaId = zonaSeleccionada.id;
      console.log('✅ Zona seleccionada:', zonaSeleccionada);
      
      // Cargar clasificadores específicos de la zona
      this.loadClasificadoresPorZona(this.selectedZonaId);
    }
    
    this.initChart();
    this.updateFilteredClassifiers();
  }

  // Método para obtener clasificadores de la zona actual
  getCurrentClassifiers() {
    // Si hay datos reales de clasificadores por zona, usarlos
    if (this.clasificadoresPorZona && this.clasificadoresPorZona.length > 0) {
      return this.clasificadoresPorZona;
    }
    
    // Fallback a datos hardcodeados
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

  trackDetectionById(index: number, detection: any): number {
    return detection.id;
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

  formatDetectionTime(fecha: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - fecha.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMinutes < 1) {
      return 'Hace un momento';
    } else if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else {
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      });
    }
  }

  getDetectionTypeIcon(tipo: string): string {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('valorizable') || tipoLower.includes('reciclable') || tipoLower.includes('plastico') || tipoLower.includes('plástico')) {
      return 'pi-recycle';
    } else if (tipoLower.includes('organico') || tipoLower.includes('orgánico')) {
      return 'pi-heart';
    } else if (tipoLower.includes('no valorizable') || tipoLower.includes('desecho') || tipoLower.includes('general')) {
      return 'pi-trash';
    } else {
      // Casos legacy con iconos mejorados
      switch (tipoLower) {
        case 'metal':
          return 'pi-wrench';
        case 'papel':
          return 'pi-file-o';
        case 'vidrio':
          return 'pi-circle';
        default:
          return 'pi-trash';
      }
    }
  }

  getDetectionTypeColor(tipo: string): string {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('valorizable') || tipoLower.includes('reciclable') || tipoLower.includes('plastico') || tipoLower.includes('plástico')) {
      return '#007bff'; // Azul para reciclables
    } else if (tipoLower.includes('organico') || tipoLower.includes('orgánico')) {
      return '#28a745'; // Verde para orgánicos
    } else if (tipoLower.includes('no valorizable') || tipoLower.includes('desecho') || tipoLower.includes('general')) {
      return '#dc3545'; // Rojo para desechos generales
    } else {
      // Casos legacy con colores mejorados
      switch (tipoLower) {
        case 'metal':
          return '#6c757d'; // Gris para metal
        case 'papel':
          return '#ffc107'; // Amarillo para papel
        case 'vidrio':
          return '#17a2b8'; // Cyan para vidrio
        default:
          return '#6c757d'; // Gris por defecto
      }
    }
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

  // Métodos para el header de clasificadores
  getActiveCount(): number {
    return this.getActiveClassifiersCount();
  }

  getTotalCount(): number {
    return this.getTotalClassifiersCount();
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
    console.log('🔄 Actualizando estadísticas...');
    this.isLoadingStats = true;
    
    // Recargar estadísticas generales
    this.loadGeneralStats();
    
    // Recargar gráficos específicos con datos del backend
    this.loadDeteccionesPorHora();
    this.loadClasificacionesExitosas();
    this.loadActividadUsuarios();
    
    // Recargar últimas detecciones
    this.loadUltimasDetecciones();
    
    // Recargar detecciones por tipo de los clasificadores
    if (this.selectedZonaId) {
      this.loadDeteccionesPorTipo();
    } else {
      this.loadDeteccionesPorTipoGeneral();
    }
    
    // Recargar gráficos del dashboard
    this.loadDashboardStats();
    
    // Si hay una zona seleccionada, recargar sus clasificadores
    if (this.selectedZonaId) {
      this.loadClasificadoresPorZona(this.selectedZonaId);
    }
    
    // Simular tiempo de carga y luego finalizar
    setTimeout(() => {
      this.isLoadingStats = false;
      console.log('✅ Estadísticas actualizadas');
    }, 2000);
  }

  // === MÉTODOS PARA GRÁFICOS ESPECÍFICOS ===
  
  loadDeteccionesPorHora() {
    this.backendService.getEstadisticasHorarios().subscribe({
      next: (horarios) => {
        // Filtrar solo 4 horas principales para el gráfico
        const horasPrincipales = [6, 12, 18, 0]; // 6AM, 12PM, 6PM, 12AM
        this.deteccionesPorHora = horasPrincipales.map(hora => {
          const stat = horarios.find(h => h.hora === hora);
          return stat ? stat.cantidad : Math.floor(Math.random() * 50) + 50; // Fallback random
        });
        console.log('✅ Detecciones por hora actualizadas:', this.deteccionesPorHora);
      },
      error: (error) => {
        console.log('⚠️ Usando datos mock para detecciones por hora');
        this.deteccionesPorHora = [85, 65, 75, 90];
      }
    });
  }

  loadClasificacionesExitosas() {
    // Por ahora simular con datos del backend de detecciones
    this.backendService.getEstadisticasGenerales().subscribe({
      next: (stats) => {
        // Simular clasificaciones exitosas basadas en estadísticas generales
        const base = stats.totalDetecciones || 100;
        this.clasificacionesExitosas = [
          Math.min(95, Math.floor((base * 0.92) / 10)),
          Math.min(95, Math.floor((base * 0.78) / 10)),
          Math.min(95, Math.floor((base * 0.88) / 10)),
          Math.min(95, Math.floor((base * 0.95) / 10))
        ];
        console.log('✅ Clasificaciones exitosas actualizadas:', this.clasificacionesExitosas);
      },
      error: (error) => {
        console.log('⚠️ Usando datos mock para clasificaciones');
        this.clasificacionesExitosas = [92, 78, 88, 95];
      }
    });
  }

  loadActividadUsuarios() {
    this.backendService.getUsuarios().subscribe({
      next: (usuarios) => {
        // Simular actividad por rol basada en usuarios reales
        const rolesCount = {
          admin: usuarios.filter(u => u.rol?.toLowerCase().includes('admin')).length,
          operador: usuarios.filter(u => u.rol?.toLowerCase().includes('op')).length,
          viewer: usuarios.filter(u => u.rol?.toLowerCase().includes('view')).length,
          guest: usuarios.filter(u => u.rol?.toLowerCase().includes('guest')).length
        };
        
        this.actividadUsuarios = [
          Math.min(100, rolesCount.admin * 15 + 70),
          Math.min(100, rolesCount.operador * 12 + 60),
          Math.min(100, rolesCount.viewer * 10 + 85),
          Math.min(100, rolesCount.guest * 8 + 50)
        ];
        console.log('✅ Actividad usuarios actualizada:', this.actividadUsuarios);
      },
      error: (error) => {
        console.log('⚠️ Usando datos mock para actividad usuarios');
        this.actividadUsuarios = [88, 72, 95, 63];
      }
    });
  }

  loadUltimasDetecciones() {
    this.isLoadingDetecciones = true;
    console.log('🔄 Cargando últimas detecciones del endpoint /detecciones/recientes...');
    
    // Usar el endpoint específico de detecciones recientes
    this.backendService.getDeteccionesRecientes(5).subscribe({
      next: (deteccionesRecientes) => {
        console.log('✅ Detecciones recientes recibidas del backend:', deteccionesRecientes);
        
        // Si hay detecciones del backend, transformarlas según la estructura real
        if (deteccionesRecientes && deteccionesRecientes.length > 0) {
          this.ultimasDetecciones = deteccionesRecientes.map(det => ({
            id: det.id,
            fecha: new Date(det.fechaHora || Date.now()),
            tipoResiduo: this.mapTipoResiduo(det.tipo || 'Desconocido'),
            clasificador: `Clasificador ${det.clasificadorId || 'N/A'}`,
            zona: this.getZonaByClasificadorId(det.clasificadorId) || this.selectedLocation || 'Zona',
            confianza: Math.floor(Math.random() * 20) + 80, // Simular confianza hasta que esté en el backend
            estado: 'Procesada' // Estado por defecto hasta que esté en el backend
          }));
          
          console.log('📊 Últimas detecciones transformadas:', this.ultimasDetecciones);
        } else {
          console.log('⚠️ No hay detecciones recientes del backend');
          this.ultimasDetecciones = [];
        }
        
        this.isLoadingDetecciones = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar detecciones recientes del backend:', error);
        console.log('⚠️ Usando datos mock basados en la DB real');
        this.setDeteccionesMockConDatosReales();
        this.isLoadingDetecciones = false;
      }
    });
  }

  // Método para mapear tipos de residuo del backend
  private mapTipoResiduo(tipo: string): string {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('valorizable') || tipoLower.includes('reciclable') || tipoLower.includes('plastico')) {
      return 'Valorizable';
    } else if (tipoLower.includes('organico') || tipoLower.includes('orgánico')) {
      return 'Orgánico';
    } else if (tipoLower.includes('no valorizable') || tipoLower.includes('no valorizanble') || tipoLower.includes('desecho') || tipoLower.includes('general')) {
      return 'No Valorizable';
    }
    return tipo; // Devolver el tipo original si no coincide
  }

  // Método para obtener la zona por clasificador ID
  private getZonaByClasificadorId(clasificadorId: string | number | undefined): string {
    if (!clasificadorId) return '';
    
    // Mapeo de clasificadores basado en los datos reales
    const clasificadorZonas: { [key: string]: string } = {
      '1': 'Entrada Principal',
      '2': 'Pasillo',
      '3': 'Pasillo Superior'
    };
    
    return clasificadorZonas[clasificadorId.toString()] || `Zona ${clasificadorId}`;
  }

  // Datos mock basados en tus 3 detecciones reales de la DB
  private setDeteccionesMockConDatosReales() {
    const now = new Date();
    this.ultimasDetecciones = [
      {
        id: 1,
        fecha: new Date(now.getTime() - 120000), // Hace 2 minutos
        tipoResiduo: 'Orgánico',
        clasificador: 'Entrada Principal',
        zona: 'Edificio D',
        confianza: 94,
        estado: 'Confirmada'
      },
      {
        id: 2,
        fecha: new Date(now.getTime() - 300000), // Hace 5 minutos
        tipoResiduo: 'Valorizable',
        clasificador: 'Pasillo',
        zona: 'Edificio D',
        confianza: 89,
        estado: 'Procesada'
      },
      {
        id: 3,
        fecha: new Date(now.getTime() - 600000), // Hace 10 minutos
        tipoResiduo: 'No Valorizable',
        clasificador: 'Pasillo Superior',
        zona: 'Edificio D',
        confianza: 92,
        estado: 'Confirmada'
      }
    ];
  }

  loadDeteccionesPorTipo() {
    console.log('🔄 Cargando detecciones por tipo para clasificadores:', this.clasificadoresPorZona);
    
    // Reinicializar todos los contadores a cero primero
    this.clasificadoresPorZona.forEach(clasificador => {
      clasificador.activeCount = 0;
      clasificador.inactiveCount = 0;
      clasificador.pendingCount = 0;
    });
    
    // Cargar detecciones para cada clasificador y categorizar por tipo de residuo
    this.clasificadoresPorZona.forEach(clasificador => {
      // Obtener detecciones específicas del clasificador
      if (clasificador.id) {
        console.log(`🔍 Buscando detecciones para clasificador ${clasificador.name} (ID: ${clasificador.id})`);
        
        this.backendService.getDetecciones().subscribe({
          next: (todasDetecciones) => {
            console.log(`📋 Total detecciones recibidas del backend para ${clasificador.name}:`, todasDetecciones.length);
            
            // Filtrar detecciones por ClasificadorId (que coincida con el ID del clasificador)
            const deteccionesClasificador = todasDetecciones.filter(det => {
              // Mapear según el ClasificadorId de tu base de datos
              const coincideId = det.clasificadorId === clasificador.id;
              const coincideNombre = det.ubicacion && det.ubicacion.toLowerCase().includes(clasificador.name.toLowerCase());
              const coincideZona = det.zona && det.zona.toLowerCase().includes(clasificador.location?.toLowerCase());
              
              const coincide = coincideId || coincideNombre || coincideZona;
              
              if (coincide) {
                console.log(`✅ Detección encontrada para ${clasificador.name}:`, {
                  deteccionId: det.id,
                  tipo: det.tipo,
                  clasificadorId: det.clasificadorId,
                  ubicacion: det.ubicacion,
                  zona: det.zona
                });
              }
              return coincide;
            });
            
            console.log(`📊 Detecciones filtradas para ${clasificador.name}:`, deteccionesClasificador.length);
            
            // Contar por tipo de residuo
            const deteccionesPorTipo = this.contarDeteccionesPorTipo(deteccionesClasificador);
            
            // Actualizar contadores del clasificador
            clasificador.activeCount = deteccionesPorTipo.plastico; // Azul - Reciclables/Valorizables
            clasificador.inactiveCount = deteccionesPorTipo.organico; // Verde - Orgánicos
            clasificador.pendingCount = deteccionesPorTipo.desechos; // Gris - Desechos/No Valorizables
            
            console.log(`✅ Contadores actualizados para ${clasificador.name}:`, {
              valorizables: clasificador.activeCount,
              organicos: clasificador.inactiveCount,
              desechos: clasificador.pendingCount,
              total: clasificador.activeCount + clasificador.inactiveCount + clasificador.pendingCount
            });
          },
          error: (error) => {
            console.log(`⚠️ Error al cargar detecciones para ${clasificador.name}:`, error);
            console.log('🔄 Usando datos simulados como fallback');
            this.setFallbackDetectionsForClassifier(clasificador);
          }
        });
      } else {
        console.log(`⚠️ Clasificador ${clasificador.name} no tiene ID, usando fallback`);
        this.setFallbackDetectionsForClassifier(clasificador);
      }
    });
  }

  contarDeteccionesPorTipo(detecciones: any[]): {plastico: number, organico: number, desechos: number} {
    const contadores = {
      plastico: 0,
      organico: 0,
      desechos: 0
    };

    console.log('🔍 Analizando detecciones:', detecciones);

    detecciones.forEach(det => {
      const tipo = (det.tipo || '').toLowerCase();
      
      console.log(`📊 Procesando detección: ${det.id}, tipo: "${tipo}"`);
      
      // Mapear según los tipos de tu base de datos
      if (tipo.includes('valorizable') || 
          tipo.includes('valorizables') ||
          tipo.includes('plástico') || 
          tipo.includes('plastico') || 
          tipo.includes('reciclable')) {
        contadores.plastico++;
        console.log(`➡️ Contado como VALORIZABLE/PLÁSTICO (azul)`);
      } else if (tipo.includes('orgánico') || 
                 tipo.includes('organico') || 
                 tipo.includes('biodegradable')) {
        contadores.organico++;
        console.log(`➡️ Contado como ORGÁNICO (verde)`);
      } else if (tipo.includes('no valorizable') ||
                 tipo.includes('desecho') ||
                 tipo.includes('desechos') ||
                 tipo.includes('general')) {
        contadores.desechos++;
        console.log(`➡️ Contado como DESECHO/NO VALORIZABLE (gris)`);
      } else {
        // Para tipos no reconocidos, categorizar como desechos
        contadores.desechos++;
        console.log(`➡️ Tipo no reconocido "${tipo}", contado como DESECHO (gris)`);
      }
    });

    console.log('📈 Resultado final conteo:', contadores);
    return contadores;
  }

  setFallbackDetections() {
    // Datos de respaldo para todos los clasificadores
    this.clasificadoresPorZona.forEach(clasificador => {
      this.setFallbackDetectionsForClassifier(clasificador);
    });
  }

  setFallbackDetectionsForClassifier(clasificador: any) {
    // Para debugging, usar ceros en lugar de datos aleatorios
    // Esto nos permitirá ver si los datos reales del backend están llegando
    clasificador.activeCount = 0; // Valorizables/Plásticos
    clasificador.inactiveCount = 0; // Orgánicos
    clasificador.pendingCount = 0; // Desechos/No valorizables
    
    console.log(`� Fallback aplicado para ${clasificador.name}: todos los contadores en 0`);
  }

  loadDeteccionesPorTipoGeneral() {
    // Método similar pero para todos los clasificadores (no por zona específica)
    this.clasificadores.forEach(clasificador => {
      if (clasificador.id) {
        this.backendService.getDetecciones().subscribe({
          next: (todasDetecciones) => {
            const deteccionesClasificador = todasDetecciones.filter(det => 
              det.ubicacion === clasificador.nombre || 
              det.zona === clasificador.zona
            );
            
            const deteccionesPorTipo = this.contarDeteccionesPorTipo(deteccionesClasificador);
            
            clasificador.activeCount = deteccionesPorTipo.plastico;
            clasificador.inactiveCount = deteccionesPorTipo.organico;
            clasificador.pendingCount = deteccionesPorTipo.desechos;
          },
          error: (error) => {
            this.setFallbackDetectionsForClassifierGeneral(clasificador);
          }
        });
      } else {
        this.setFallbackDetectionsForClassifierGeneral(clasificador);
      }
    });
  }

  setFallbackDetectionsGeneral() {
    this.clasificadores.forEach(clasificador => {
      this.setFallbackDetectionsForClassifierGeneral(clasificador);
    });
  }

  setFallbackDetectionsForClassifierGeneral(clasificador: any) {
    const baseDetections = Math.floor(Math.random() * 50) + 10;
    
    clasificador.activeCount = Math.floor(baseDetections * 0.4) + Math.floor(Math.random() * 15);
    clasificador.inactiveCount = Math.floor(baseDetections * 0.35) + Math.floor(Math.random() * 12);
    clasificador.pendingCount = Math.floor(baseDetections * 0.25) + Math.floor(Math.random() * 8);
  }

  // === MÉTODOS DE USUARIOS ===
  
  loadUsers() {
    this.isLoadingUsers = true;
    console.log('🔄 Cargando usuarios del backend...');
    
    this.backendService.getUsuarios().subscribe({
      next: (usuarios) => {
        console.log('✅ Usuarios cargados del backend:', usuarios);
        this.users = usuarios;
        this.filteredUsers = [...this.users];
        this.isLoadingUsers = false;
      },
      error: (error) => {
        console.error('❌ Error cargando usuarios del backend:', error);
        console.log('⚠️ Usando usuarios hardcodeados como fallback');
        this.users = [...this.fallbackUsers];
        this.filteredUsers = [...this.users];
        this.isLoadingUsers = false;
      }
    });
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
      // Usar el AuthService para logout
      this.authService.logout();
      
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
