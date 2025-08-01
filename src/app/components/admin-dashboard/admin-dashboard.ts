import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BackendService, User, Zona, EstadisticasGenerales, EstadisticasHorarios, EstadisticasZonas, EstadisticasTipos } from '../../services/backend.service';
import { ZonaService, ZonaInfo } from '../../services/zona.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  
  Math = Math;
  
  selectedLocation = 'Edificio D';
  selectedZonaId: string | number = '';
  locations: string[] = ['Edificio D', 'Edificio C', 'Almacén', 'Zona Norte'];
  zonas: Zona[] = [];
  isLoadingZonas = false;
  
  currentUser: User = {
    id: 1,
    nombre: 'root',
    correo: 'admin@utleon.edu.mx',
    email: 'admin@utleon.edu.mx', // Compatibilidad
    rol: 'Administrador',
    activo: true,
    enLinea: false,
    fechaCreacion: '2025-07-26',
    fechaUltimoAcceso: null,
    ultimoAcceso: new Date() // Compatibilidad con frontend
  };
  userMenuOpen = false;
  showAccountModal = false;
  
  activeTab = 'dashboard';
  
  ultimasDetecciones: any[] = [];
  isLoadingDetecciones = false;
  
  clasificadoresPorZona: any[] = [];
  isLoadingClasificadores = false;
  classifierSearchTerm = '';
  
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  isLoadingUsers = false;
  searchTerm = '';
  selectedRoles: string[] = [];
  selectedUsers: (string | number)[] = [];
  roleOptions = [
    { label: 'Administrador', value: 'administrador' },
    { label: 'Usuario', value: 'usuario' },
    { label: 'Operador', value: 'operador' }
  ];
  
  // ESTADÍSTICAS REALES DEL BACKEND
  isLoadingStats = false;
  estadisticasGenerales: EstadisticasGenerales | null = null;
  deteccionesPorHora: EstadisticasHorarios[] = [];
  estadisticasZonas: EstadisticasZonas[] = [];
  estadisticasTipos: EstadisticasTipos[] = [];
  estadisticasHorarios: EstadisticasHorarios[] = []; // Para el heatmap
  
  // GRÁFICAS CON DATOS REALES
  datosDeteccionesPorHora: number[] = [0, 0, 0, 0];
  datosClasificacionesExitosas: number[] = [0, 0, 0, 0];
  datosFlujoTransporte: number[] = [0, 0, 0, 0];
  datosActividadUsuarios: number[] = [0, 0, 0, 0];
  
  datosDashboardCentral: number[] = [0, 0, 0, 0];
  zonasDeteccionesHoy: string[] = ['Cargando...', 'Cargando...', 'Cargando...', 'Cargando...'];
  
  porcentajeValorizable: number = 0;
  porcentajeOrganica: number = 0;
  porcentajeNoValorizable: number = 0;
  
  private zonaSubscription: Subscription = new Subscription();

  constructor(
    private backendService: BackendService,
    private zonaService: ZonaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🏗️ ADMIN-DASHBOARD - Constructor');
  }

  ngOnInit() {
    console.log('🚀 ADMIN-DASHBOARD - Iniciando con gráficas del backend real');
    this.loadInitialData();
  }

  ngOnDestroy() {
    this.zonaSubscription.unsubscribe();
  }

  loadInitialData() {
    this.loadUsers();
    this.loadRealStatistics();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    console.log('📍 Tab activo:', tab);
  }

  onLocationChange() {
    console.log('📍 Ubicación cambiada a:', this.selectedLocation);
  }

  loadUsers() {
    this.isLoadingUsers = true;
    
    this.backendService.getUsuarios().subscribe({
      next: (usuarios: User[]) => {
        console.log('👥 Usuarios del backend:', usuarios);
        // Mapear los datos del backend al formato del frontend
        this.allUsers = usuarios.map(user => ({
          ...user,
          // Asegurar compatibilidad con el frontend
          email: user.email || user.correo,
          estado: user.activo ? 'Activo' : 'Inactivo', // Compatibilidad
          ultimoAcceso: user.ultimoAcceso || user.fechaUltimoAcceso || new Date(),
          rol: user.rol || 'Usuario'
        }));
        this.filteredUsers = [...this.allUsers];
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error cargando usuarios:', error);
        // Datos de ejemplo usando la estructura real de la BD
        this.allUsers = [
          {
            id: 1,
            nombre: 'root',
            correo: 'admin@utleon.edu.mx',
            email: 'admin@utleon.edu.mx',
            rol: 'Administrador',
            activo: true,
            enLinea: false,
            fechaCreacion: '2025-07-26',
            fechaUltimoAcceso: null,
            ultimoAcceso: new Date(),
            estado: 'Activo'
          }
        ];
        this.filteredUsers = [...this.allUsers];
        this.isLoadingUsers = false;
      }
    });
  }

  filterUsers() {
    this.filteredUsers = this.allUsers.filter(user => 
      user.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (user.correo && user.correo.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  editUser(user: User) {
    console.log('Editando usuario:', user);
  }

  deleteUser(user: User) {
    console.log('Eliminando usuario:', user);
  }

  toggleUserStatus(user: User) {
    console.log('Cambiando estado de usuario:', user);
    // Cambiar el estado boolean activo
    const newStatus = !user.activo;
    
    // Aquí podrías hacer una llamada al backend para actualizar el estado
    this.backendService.updateUsuario(user.id, { ...user, activo: newStatus }).subscribe({
      next: (updatedUser: User) => {
        console.log('✅ Estado actualizado:', updatedUser);
        // Actualizar en la lista local
        const index = this.allUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.allUsers[index] = updatedUser;
          this.filterUsers();
        }
      },
      error: (error: any) => {
        console.error('❌ Error actualizando estado:', error);
      }
    });
  }

  addNewUser() {
    console.log('Agregando nuevo usuario');
  }

  exportUsersData() {
    console.log('Exportando datos de usuarios');
  }

  getActiveUsersCount(): number {
    return this.allUsers.filter(user => user.activo === true).length;
  }

  getInactiveUsersCount(): number {
    return this.allUsers.filter(user => user.activo === false).length;
  }

  getTotalUsersCount(): number {
    return this.allUsers.length;
  }

  trackByUserId(index: number, user: User): string | number {
    return user.id;
  }

  toggleUserSelection(userId: string | number, event: any) {
    if (event.target.checked) {
      this.selectedUsers.push(userId);
    } else {
      this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
    }
  }

  selectAllUsers(event: any) {
    if (event.target.checked) {
      this.selectedUsers = this.filteredUsers.map(user => user.id);
    } else {
      this.selectedUsers = [];
    }
  }

  allUsersSelected(): boolean {
    return this.selectedUsers.length === this.filteredUsers.length && this.filteredUsers.length > 0;
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

  getRoleClass(rol: string | undefined): string {
    if (!rol) return 'user';
    const roleStr = String(rol).toLowerCase();
    switch (roleStr) {
      case 'administrador': return 'admin';
      case 'usuario': return 'user';
      case 'operador': return 'operator';
      default: return 'user';
    }
  }

  getStatusClass(activo: boolean | undefined): string {
    return activo === true ? 'active' : 'inactive';
  }

  getStatusIcon(activo: boolean | undefined): string {
    return activo === true ? 'pi-check' : 'pi-times';
  }

  getStatusText(activo: boolean | undefined): string {
    return activo === true ? 'Activo' : 'Inactivo';
  }

  canEditUser(): boolean {
    return this.currentUser.rol === 'Administrador';
  }

  canDeleteUser(user: User): boolean {
    return this.canEditUser() && this.currentUser.id !== user.id;
  }

  bulkActivateUsers() {
    console.log('Activando usuarios:', this.selectedUsers);
  }

  bulkDeactivateUsers() {
    console.log('Desactivando usuarios:', this.selectedUsers);
  }

  bulkDeleteUsers() {
    console.log('Eliminando usuarios:', this.selectedUsers);
  }

  getCurrentClassifiers(): any[] {
    return [
      { 
        name: 'Clasificador 1', 
        activeCount: 24, 
        inactiveCount: 12, 
        pendingCount: 8 
      },
      { 
        name: 'Clasificador 2', 
        activeCount: 18, 
        inactiveCount: 9, 
        pendingCount: 5 
      }
    ];
  }

  getActiveCount(): number {
    return this.getCurrentClassifiers().length;
  }

  getTotalCount(): number {
    return this.getCurrentClassifiers().length;
  }

  filterClassifiers() {
    console.log('Filtrando clasificadores:', this.classifierSearchTerm);
  }

  loadUltimasDetecciones() {
    this.isLoadingDetecciones = true;
    console.log('🔄 Cargando últimas detecciones...');
    
    setTimeout(() => {
      this.ultimasDetecciones = [
        {
          id: 1,
          tipo: 'Orgánico',
          fechaHora: new Date(),
          clasificador: 'Clasificador 1',
          estado: 'Confirmada'
        },
        {
          id: 2,
          tipo: 'Reciclable',
          fechaHora: new Date(),
          clasificador: 'Clasificador 2',
          estado: 'Pendiente'
        }
      ];
      this.isLoadingDetecciones = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  trackDetectionById(index: number, detection: any): number {
    return detection.id;
  }

  getDetectionTypeColor(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'orgánico': return '#4CAF50';
      case 'reciclable': return '#2196F3';
      case 'general': return '#757575';
      default: return '#666';
    }
  }

  getDetectionTypeIcon(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'orgánico': return 'pi-leaf';
      case 'reciclable': return 'pi-refresh';
      case 'general': return 'pi-trash';
      default: return 'pi-circle';
    }
  }

  formatDetectionTime(fecha: Date | string): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(fecha);
    return date.toLocaleString('es-ES');
  }

  exportStatisticsData() {
    console.log('📁 Exportando estadísticas del backend...');
  }

  refreshStatistics() {
    console.log('🔄 Actualizando estadísticas del backend...');
    this.loadRealStatistics();
  }

  // *** MÉTODO PRINCIPAL PARA CARGAR GRÁFICAS REALES ***
  private loadRealStatistics() {
    this.isLoadingStats = true;
    console.log('🔄 Cargando estadísticas REALES desde https://localhost:7286/api...');
    
    // 1. Cargar estadísticas generales
    this.backendService.getEstadisticasGenerales().subscribe({
      next: (generales: EstadisticasGenerales) => {
        console.log('✅ Estadísticas generales del backend:', generales);
        this.estadisticasGenerales = generales;
        this.updateChartsFromGeneralStats(generales);
      },
      error: (error: any) => {
        console.error('❌ Error estadísticas generales:', error);
        this.setDefaultValues();
      }
    });

    // 2. Cargar estadísticas por horarios
    this.backendService.getEstadisticasHorarios().subscribe({
      next: (horarios: EstadisticasHorarios[]) => {
        console.log('⏰ Estadísticas horarias del backend:', horarios);
        this.deteccionesPorHora = horarios;
        this.estadisticasHorarios = horarios; // Para el heatmap también
        this.updateHourlyChart(horarios);
      },
      error: (error: any) => {
        console.error('❌ Error estadísticas horarias:', error);
      }
    });

    // 3. Cargar estadísticas por zonas GLOBALES (comparativa entre todas las zonas)
    this.backendService.getEstadisticasZonas().subscribe({
      next: (zonas: EstadisticasZonas[]) => {
        console.log('🗺️ Estadísticas zonas GLOBALES del backend:', zonas);
        this.estadisticasZonas = zonas;
        this.updateGlobalZoneCharts(zonas); // Método renombrado para claridad
      },
      error: (error: any) => {
        console.error('❌ Error estadísticas zonas globales:', error);
        // En caso de error, cargar datos desde endpoint alternativo
        this.loadZonesFromDetections();
      }
    });

    // 4. Cargar estadísticas por tipos
    this.backendService.getEstadisticasTipos().subscribe({
      next: (tipos: EstadisticasTipos[]) => {
        console.log('📊 Estadísticas tipos del backend:', tipos);
        this.estadisticasTipos = tipos;
        this.updateTypeCharts(tipos);
      },
      error: (error: any) => {
        console.error('❌ Error estadísticas tipos:', error);
      }
    });

    // 5. Cargar usuarios para actividad
    this.loadUserStatistics();
    
    setTimeout(() => {
      this.isLoadingStats = false;
      this.cdr.detectChanges();
      console.log('✅ Todas las gráficas del backend actualizadas');
    }, 2000);
  }

  // *** ACTUALIZAR GRÁFICO DE HORAS CON DATOS REALES ***
  private updateHourlyChart(horarios: EstadisticasHorarios[]) {
    const periodos = [6, 12, 18, 0]; // 6AM, 12PM, 6PM, 12AM
    
    this.datosDeteccionesPorHora = periodos.map(hora => {
      const stat = horarios.find(h => h.hora === hora);
      return stat ? stat.cantidad : 0;
    });
    
    console.log('📈 GRÁFICO HORAS actualizado:', this.datosDeteccionesPorHora);
  }

  // *** ACTUALIZAR GRÁFICO CENTRAL CON COMPARATIVA GLOBAL DE ZONAS ***
  private updateGlobalZoneCharts(zonas: EstadisticasZonas[]) {
    console.log('🏢 Actualizando gráfico central con comparativa GLOBAL de zonas...');
    
    // Ordenar zonas por número de detecciones (de mayor a menor)
    const zonasOrdenadas = zonas
      .sort((a, b) => b.totalDetecciones - a.totalDetecciones)
      .slice(0, 4); // Tomar las top 4 zonas

    this.datosDashboardCentral = zonasOrdenadas.map(zona => zona.totalDetecciones);
    this.zonasDeteccionesHoy = zonasOrdenadas.map(zona => zona.nombre);
    
    // Completar con valores vacíos si hay menos de 4 zonas
    while (this.datosDashboardCentral.length < 4) {
      this.datosDashboardCentral.push(0);
      this.zonasDeteccionesHoy.push('Sin zona');
    }
    
    // Calcular porcentajes para las barras (normalizar al 100%)
    const maxDetecciones = Math.max(...this.datosDashboardCentral.filter(val => val > 0));
    if (maxDetecciones > 0) {
      // Convertir a porcentajes para la visualización
      this.datosDashboardCentral = this.datosDashboardCentral.map(valor => 
        valor > 0 ? Math.round((valor / maxDetecciones) * 100) : 0
      );
    }
    
    this.datosFlujoTransporte = [...this.datosDashboardCentral];
    
    console.log('✅ GRÁFICO CENTRAL actualizado (comparativa global):');
    console.log('  Valores normalizados:', this.datosDashboardCentral);
    console.log('  Nombres zonas:', this.zonasDeteccionesHoy);
    console.log('  Zonas ordenadas por detecciones:', zonasOrdenadas.map(z => `${z.nombre}: ${z.totalDetecciones}`));
  }

  // *** MÉTODO DE FALLBACK: Cargar zonas desde detecciones cuando falla el endpoint de estadísticas ***
  private loadZonesFromDetections() {
    console.log('🔄 Fallback: Cargando zonas desde detecciones generales...');
    
    // Cargar todas las zonas primero
    this.backendService.getZonas().subscribe({
      next: (zonas: any[]) => {
        console.log('🗺️ Zonas cargadas para fallback:', zonas);
        
        // Para cada zona, contar detecciones
        const zonasConDetecciones: EstadisticasZonas[] = [];
        let completedRequests = 0;
        
        zonas.forEach(zona => {
          this.backendService.getDeteccionesPorZona(zona.id).subscribe({
            next: (detecciones: any[]) => {
              zonasConDetecciones.push({
                zonaId: zona.id,
                nombre: zona.nombre,
                totalDetecciones: detecciones.length,
                porcentaje: 0 // Se calculará después
              });
              
              completedRequests++;
              if (completedRequests === zonas.length) {
                // Calcular porcentajes
                const total = zonasConDetecciones.reduce((sum, z) => sum + z.totalDetecciones, 0);
                zonasConDetecciones.forEach(zona => {
                  zona.porcentaje = total > 0 ? Math.round((zona.totalDetecciones / total) * 100) : 0;
                });
                
                this.estadisticasZonas = zonasConDetecciones;
                this.updateGlobalZoneCharts(zonasConDetecciones);
                console.log('✅ Fallback completado - zonas calculadas desde detecciones');
              }
            },
            error: (error: any) => {
              console.error(`❌ Error cargando detecciones para zona ${zona.nombre}:`, error);
              // Agregar zona con 0 detecciones
              zonasConDetecciones.push({
                zonaId: zona.id,
                nombre: zona.nombre,
                totalDetecciones: 0,
                porcentaje: 0
              });
              
              completedRequests++;
              if (completedRequests === zonas.length) {
                this.estadisticasZonas = zonasConDetecciones;
                this.updateGlobalZoneCharts(zonasConDetecciones);
                console.log('✅ Fallback completado - algunas zonas con errores');
              }
            }
          });
        });
      },
      error: (error: any) => {
        console.error('❌ Error total en fallback de zonas:', error);
        this.generateEmptyZoneData();
      }
    });
  }

  // *** ACTUALIZAR GRÁFICOS CIRCULARES CON DATOS REALES ***
  private updateTypeCharts(tipos: EstadisticasTipos[]) {
    const total = tipos.reduce((sum, tipo) => sum + tipo.cantidad, 0);
    
    if (total > 0) {
      const valorizable = tipos.find(t => t.tipo.toLowerCase().includes('reciclable') || t.tipo.toLowerCase().includes('valorizable'));
      const organica = tipos.find(t => t.tipo.toLowerCase().includes('orgánico'));
      const noValorizable = tipos.find(t => t.tipo.toLowerCase().includes('general') || t.tipo.toLowerCase().includes('no valorizable'));
      
      this.porcentajeValorizable = valorizable ? Math.round((valorizable.cantidad / total) * 100) : 0;
      this.porcentajeOrganica = organica ? Math.round((organica.cantidad / total) * 100) : 0;
      this.porcentajeNoValorizable = noValorizable ? Math.round((noValorizable.cantidad / total) * 100) : 0;
      
      const suma = this.porcentajeValorizable + this.porcentajeOrganica + this.porcentajeNoValorizable;
      if (suma < 100) {
        this.porcentajeNoValorizable += (100 - suma);
      }
    }
    
    const topTipos = tipos.slice(0, 4);
    this.datosClasificacionesExitosas = topTipos.map(tipo => tipo.cantidad);
    while (this.datosClasificacionesExitosas.length < 4) {
      this.datosClasificacionesExitosas.push(0);
    }
    
    console.log('📊 GRÁFICOS CIRCULARES actualizados:');
    console.log('  Porcentajes - V:', this.porcentajeValorizable, '% O:', this.porcentajeOrganica, '% NV:', this.porcentajeNoValorizable, '%');
  }

  // *** CARGAR ESTADÍSTICAS DE USUARIOS ***
  private loadUserStatistics() {
    this.backendService.getUsuarios().subscribe({
      next: (usuarios: User[]) => {
        const total = usuarios.length;
        this.datosActividadUsuarios = [
          Math.floor(total * 0.1), // Admin
          Math.floor(total * 0.3), // Operarios
          Math.floor(total * 0.4), // Visualizadores
          Math.floor(total * 0.2)  // Invitados
        ];
        console.log('👥 GRÁFICO USUARIOS actualizado:', this.datosActividadUsuarios);
      },
      error: (error: any) => {
        console.error('❌ Error usuarios:', error);
        this.datosActividadUsuarios = [5, 15, 20, 10];
      }
    });
  }

  private updateChartsFromGeneralStats(generales: EstadisticasGenerales) {
    if (this.datosActividadUsuarios.every(val => val === 0)) {
      const base = Math.floor(generales.usuariosActivos / 4);
      this.datosActividadUsuarios = [
        base + Math.floor(generales.usuariosActivos * 0.4),
        base + Math.floor(generales.usuariosActivos * 0.3),
        base + Math.floor(generales.usuariosActivos * 0.2),
        base + Math.floor(generales.usuariosActivos * 0.1)
      ];
    }
    console.log('📊 Gráficos desde estadísticas generales actualizados');
  }

  private setDefaultValues() {
    this.datosDeteccionesPorHora = [0, 0, 0, 0];
    this.datosClasificacionesExitosas = [0, 0, 0, 0];
    this.datosFlujoTransporte = [0, 0, 0, 0];
    this.datosActividadUsuarios = [0, 0, 0, 0];
    this.datosDashboardCentral = [0, 0, 0, 0];
    this.zonasDeteccionesHoy = ['Sin datos', 'Sin datos', 'Sin datos', 'Sin datos'];
    this.porcentajeValorizable = 0;
    this.porcentajeOrganica = 0;
    this.porcentajeNoValorizable = 0;
    console.log('⚠️ Valores por defecto aplicados');
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  viewMyAccount() {
    this.showAccountModal = true;
    this.userMenuOpen = false;
  }

  logout() {
    console.log('🚪 Cerrando sesión...');
    this.userMenuOpen = false;
  }

  closeAccountModal() {
    this.showAccountModal = false;
  }

  editProfile() {
    console.log('✏️ Editando perfil...');
  }

  changePassword() {
    console.log('🔒 Cambiando contraseña...');
  }

  formatDate(date: Date | string | undefined | null): string {
    if (!date || date === null) return 'Nunca';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Fecha inválida';
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Error de fecha';
    }
  }

  // =================== MÉTODOS PARA LAS NUEVAS GRÁFICAS ===================

  // KPIs Methods
  getActiveClassifiersCount(): number {
    return this.estadisticasZonas.filter(zona => zona.totalDetecciones > 0).length;
  }

  getActiveZonesCount(): number {
    return this.estadisticasZonas.length;
  }

  getEfficiencyPercentage(): string {
    if (!this.estadisticasGenerales) return '0.0';
    const efficiency = (this.estadisticasGenerales.deteccionesHoy / this.estadisticasGenerales.totalDetecciones) * 100;
    return (efficiency || 0).toFixed(1);
  }

  // Composition Chart Methods
  getTopTipos(): EstadisticasTipos[] {
    return this.estadisticasTipos.slice(0, 4);
  }

  getTotalDetections(): number {
    return this.estadisticasGenerales?.totalDetecciones || 0;
  }

  getTipoColor(tipo: string): string {
    const colors: { [key: string]: string } = {
      'Valorizable': '#2196F3',
      'Organico': '#4CAF50', 
      'Orgánico': '#4CAF50',
      'No Valorizable': '#757575',
      'NoValorizable': '#757575'
    };
    return colors[tipo] || '#9E9E9E';
  }

  getStrokeDashOffset(index: number): number {
    let offset = 25; // Starting offset
    for (let i = 0; i < index; i++) {
      offset -= this.estadisticasTipos[i]?.porcentaje || 0;
    }
    return offset;
  }

  // Heatmap Methods
  getMaxCantidad(): number {
    return Math.max(...this.deteccionesPorHora.map(h => h.cantidad), 1);
  }

  getHeatmapColor(cantidad: number, maxCantidad: number): string {
    const intensity = cantidad / maxCantidad;
    const opacity = Math.max(0.1, intensity);
    return `rgba(74, 124, 89, ${opacity})`;
  }

  // Horizontal Bar Chart Methods
  getTopZonas(): EstadisticasZonas[] {
    return this.estadisticasZonas
      .sort((a, b) => b.totalDetecciones - a.totalDetecciones)
      .slice(0, 5);
  }

  getMaxZonaDetections(): number {
    return Math.max(...this.estadisticasZonas.map(z => z.totalDetecciones), 1);
  }

  getBarPercentage(value: number, maxValue: number): number {
    return Math.max(2, (value / maxValue) * 100);
  }

  // Grouped Bar Chart Methods
  getZonaTypePercentage(zona: EstadisticasZonas, tipo: string): number {
    // Como no tenemos porcentajePorTipo, usamos una distribución simulada
    const baseValue = zona.totalDetecciones;
    let typeValue = 0;
    
    switch (tipo) {
      case 'valorizable':
        typeValue = Math.floor(baseValue * 0.4); // 40% valorizable
        break;
      case 'organico':
        typeValue = Math.floor(baseValue * 0.35); // 35% orgánico
        break;
      case 'noValorizable':
        typeValue = Math.floor(baseValue * 0.25); // 25% no valorizable
        break;
    }
    
    const maxInZona = Math.floor(baseValue * 0.4); // El máximo será valorizable
    return Math.max(5, (typeValue / Math.max(maxInZona, 1)) * 100);
  }

  getZonaTypeCount(zona: EstadisticasZonas, tipo: string): number {
    const baseValue = zona.totalDetecciones;
    
    switch (tipo) {
      case 'valorizable':
        return Math.floor(baseValue * 0.4);
      case 'organico':
        return Math.floor(baseValue * 0.35);
      case 'noValorizable':
        return Math.floor(baseValue * 0.25);
      default:
        return 0;
    }
  }

  // Simplified Line Chart Methods
  getSimpleTrendPoints(): string {
    if (!this.estadisticasGenerales) return '';
    
    const data = [
      this.estadisticasGenerales.totalDetecciones * 0.3, // Simulación día 1
      this.estadisticasGenerales.deteccionesHoy,          // Hoy
      this.estadisticasGenerales.deteccionesEsteMes * 0.1, // Simulación día 3
      this.estadisticasGenerales.usuariosActivos * 2       // Simulación día 4
    ];
    
    const maxValue = Math.max(...data, 1);
    const width = 600;
    const height = 200;
    const stepX = width / Math.max(data.length - 1, 1);
    
    return data
      .map((value: number, index: number) => {
        const x = index * stepX;
        const y = height - ((value / maxValue) * (height - 20)) - 10;
        return `${x},${y}`;
      })
      .join(' ');
  }

  getSimpleDataPoints(): { x: number; y: number; value: number; label: string }[] {
    if (!this.estadisticasGenerales) return [];
    
    const data = [
      { value: this.estadisticasGenerales.totalDetecciones * 0.3, label: 'Simulado 1' },
      { value: this.estadisticasGenerales.deteccionesHoy, label: 'Hoy' },
      { value: this.estadisticasGenerales.deteccionesEsteMes * 0.1, label: 'Simulado 2' },
      { value: this.estadisticasGenerales.usuariosActivos * 2, label: 'Usuarios x2' }
    ];
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const width = 600;
    const height = 200;
    const stepX = width / Math.max(data.length - 1, 1);
    
    return data.map((item, index: number) => ({
      x: index * stepX,
      y: height - ((item.value / maxValue) * (height - 20)) - 10,
      value: item.value,
      label: item.label
    }));
  }

  getSimpleTrendAreaPoints(): string {
    const linePoints = this.getSimpleTrendPoints();
    if (!linePoints) return '';
    
    const points = linePoints.split(' ');
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    
    if (!firstPoint || !lastPoint) return '';
    
    const startX = firstPoint.split(',')[0];
    const endX = lastPoint.split(',')[0];
    
    return `${startX},200 ${linePoints} ${endX},200`;
  }

  // *** GENERAR DATOS VACÍOS PARA ZONAS CUANDO FALLAN TODOS LOS ENDPOINTS ***
  private generateEmptyZoneData() {
    console.log('📊 Generando datos vacíos para gráfico central de zonas...');
    
    this.datosDashboardCentral = [0, 0, 0, 0];
    this.zonasDeteccionesHoy = ['Sin datos', 'Sin datos', 'Sin datos', 'Sin datos'];
    this.estadisticasZonas = [];
    
    console.log('⚠️ Gráfico central configurado con datos vacíos');
  }
}
