import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { BackendService, User, Zona, Clasificador, EstadisticasGenerales, EstadisticasHorarios, EstadisticasZonas, EstadisticasTipos } from '../../services/backend.service';
import { ZonaService, ZonaInfo } from '../../services/zona.service';
import { AuthService } from '../../services/auth';

// *** INTERFACES ADICIONALES PARA EL DASHBOARD ***
export interface UsuarioActivo {
  nombre: string;
  detecciones: number;
}

export interface ClasificadorGlobal {
  nombre: string;
  detecciones: number;
  precision?: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  Math = Math;

  selectedLocation = '';
  selectedZonaId: string | number = '';
  locations: string[] = [];
  zonas: Zona[] = [];
  clasificadores: Clasificador[] = [];
  isLoadingZonas = false;

  currentUser: User = {
    id: 1,
    nombre: 'root',
    correo: 'admin@utleon.edu.mx',
    email: 'admin@utleon.edu.mx', 
    password:'',// Compatibilidad
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
  topClasificadoresGlobales: any[] = [];
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

  // ESTADÍSTICAS GLOBALES ADICIONALES
  usuariosMasActivos: UsuarioActivo[] = [];
  totalDetecciones: number = 0;
  totalUsuarios: number = 0;
  totalZonas: number = 0;

  // GRÁFICAS CON DATOS REALES
  datosDeteccionesPorHora: number[] = [0, 0, 0, 0];
  datosClasificacionesExitosas: number[] = [0, 0, 0, 0];
  datosFlujoTransporte: number[] = [0, 0, 0, 0];
  datosActividadUsuarios: number[] = [0, 0, 0, 0];

  datosDashboardCentral: number[] = [];
  zonasDeteccionesHoy: string[] = [];

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
    // Solo inicializar variables básicas en el constructor
  }

  ngOnInit() {
    console.log('🚀 ADMIN-DASHBOARD - Iniciando dashboard con datos REALES del sistema');

    // SUSCRIBIRSE AL ZONA SERVICE PARA ESCUCHAR CAMBIOS DESDE LA NAVBAR
    this.zonaSubscription = this.zonaService.selectedZona$.subscribe(zonaInfo => {
      console.log('🔄 ZONA SERVICE - Cambio detectado:', zonaInfo);

      if (zonaInfo && zonaInfo.nombre) {
        console.log('✅ Actualizando zona seleccionada desde navbar:', zonaInfo.nombre);
        this.selectedLocation = zonaInfo.nombre;
        this.selectedZonaId = zonaInfo.id;

        // Recargar detecciones con la nueva zona
        this.loadUltimasDetecciones();
      }
    });

    this.loadInitialData();
  }

  ngOnDestroy() {
    this.zonaSubscription.unsubscribe();
  }

  loadInitialData() {
    console.log('🚀 Cargando datos GLOBALES del dashboard administrativo...');

    // 1. Cargar usuarios del sistema
    this.loadUsers();

    // 2. Cargar estadísticas GENERALES del sistema completo
    this.loadGlobalStatistics();

    // 3. Cargar TOP 3 clasificadores más activos de TODO el sistema
    this.loadTopClasificadoresGlobales();

    // 4. Cargar tipos más populares a nivel GLOBAL
    this.loadGlobalTypePercentages();

    // 5. Comparativa entre TODAS las zonas
    this.loadGlobalZoneComparison();

    // 6. Las detecciones se cargarán cuando se seleccione una zona desde el ZonaService
    console.log('⏳ Esperando selección de zona desde navbar...');
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    console.log('📍 Tab activo:', tab);
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
          rol: 'Admin'
        }));
        this.filteredUsers = [...this.allUsers];
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error cargando usuarios:', error);
        this.allUsers = [];
        this.filteredUsers = [];
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

  canDeleteUser(): boolean {
    const currentUser = this.authService.getCurrentUser();
    // No permitir eliminar el propio usuario
    if (currentUser && this.selectedUsers.includes(currentUser.id)) {
      return false;
    }
    return true
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

  loadTopClasificadoresGlobales() {
    console.log('🔄 Cargando TOP 3 clasificadores más activos desde https://localhost:7286/api/clasificadores/estadisticas...');
    this.isLoadingClasificadores = true;

    this.backendService.getEstadisticasClasificadores().subscribe({
      next: (clasificadores: any[]) => {
        console.log('📊 Clasificadores del backend obtenidos:', clasificadores);

        if (clasificadores && Array.isArray(clasificadores) && clasificadores.length > 0) {
          // Procesar y ordenar por totalDetecciones - TOP 3 (solo zona, nombre y total)
          this.topClasificadoresGlobales = clasificadores
            .map((cls: any) => ({
              name: cls.nombre || `Clasificador ${cls.id}`,
              id: cls.id,
              totalDetecciones: cls.totalDetecciones || 0,
              zona: cls.zona || 'Sin zona'
            }))
            .sort((a: any, b: any) => b.totalDetecciones - a.totalDetecciones)
            .slice(0, 3); // TOP 3 clasificadores más activos

          console.log('🏆 TOP 3 clasificadores globales del sistema:', this.topClasificadoresGlobales);
        } else {
          console.warn('⚠️ No se encontraron clasificadores válidos');
          this.topClasificadoresGlobales = [];
        }

        this.isLoadingClasificadores = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error cargando clasificadores desde /api/clasificadores/estadisticas:', error);
        this.topClasificadoresGlobales = [];
        this.isLoadingClasificadores = false;
        this.cdr.detectChanges();
      }
    });
  }

  getCurrentClassifiers(): any[] {
    // Retorna los TOP 3 clasificadores más activos de TODO el sistema
    console.log('🔍 getCurrentClassifiers - TOP 3 clasificadores globales:', this.topClasificadoresGlobales);
    return this.topClasificadoresGlobales.length > 0 ? this.topClasificadoresGlobales : [];
  }

  getActiveCount(): number {
    return this.topClasificadoresGlobales.length;
  }

  getTotalCount(): number {
    return this.estadisticasGenerales?.totalClasificadores || this.topClasificadoresGlobales.length;
  }

  filterClassifiers() {
    console.log('Filtrando clasificadores:', this.classifierSearchTerm);
  }

  // === MÉTODOS DE DETECCIONES ===

  loadUltimasDetecciones() {
    // No cargar detecciones si no hay zona seleccionada
    if (!this.selectedLocation) {
      console.log('⚠️ No hay zona seleccionada, esperando carga de zonas...');
      return;
    }

    this.isLoadingDetecciones = true;
    console.log('🔄 Cargando últimas detecciones recientes del endpoint /api/detecciones/recientes para zona:', this.selectedLocation);

    // Cargar detecciones, clasificadores y zonas en paralelo
    forkJoin({
      detecciones: this.backendService.getDeteccionesRecientes(20), // Pedimos más para filtrar por zona
      clasificadores: this.backendService.getClasificadores(),
      zonas: this.backendService.getZonas()
    }).subscribe({
      next: (data) => {
        console.log('📊 Datos obtenidos del backend:', data);

        // Almacenar clasificadores y zonas para uso posterior
        this.clasificadores = data.clasificadores;
        this.zonas = data.zonas;

        if (data.detecciones && data.detecciones.length > 0) {
          // Crear un mapa de clasificadores por ID para búsqueda rápida
          const clasificadoresMap = new Map();
          data.clasificadores.forEach(clasificador => {
            clasificadoresMap.set(clasificador.id, clasificador);
          });

          // Procesar detecciones para agregar información de clasificador y zona
          const deteccionesConInfo = data.detecciones.map(deteccion => {
            const clasificador = clasificadoresMap.get(deteccion.clasificadorId);
            // Los clasificadores ya vienen con la zona anidada: clasificador.zona.nombre
            const zonaNombre = clasificador?.zona?.nombre || 'Sin zona';

            const deteccionProcesada = {
              ...deteccion,
              clasificadorNombre: clasificador ? clasificador.nombre : `Clasificador ${deteccion.clasificadorId}`,
              zonaNombre: zonaNombre,
              zona: zonaNombre // Para compatibilidad con el filtro existente
            };

            // DEBUG: Log detallado de cada detección
            console.log(`🔍 Detección ${deteccion.id}:`, {
              clasificadorId: deteccion.clasificadorId,
              clasificadorNombre: deteccionProcesada.clasificadorNombre,
              zonaNombre: deteccionProcesada.zonaNombre,
              tipo: deteccion.tipo
            });

            return deteccionProcesada;
          });

          console.log('🔍 DEBUG - Zona seleccionada:', this.selectedLocation);
          console.log('🔍 DEBUG - Detecciones con info completa:', deteccionesConInfo.map(d => ({
            id: d.id,
            clasificadorId: d.clasificadorId,
            clasificadorNombre: d.clasificadorNombre,
            zonaNombre: d.zonaNombre,
            tipo: d.tipo
          })));

          // Mostrar resumen de zonas encontradas
          const zonasEncontradas = [...new Set(deteccionesConInfo.map(d => d.zonaNombre))];
          console.log('🏢 Zonas encontradas en las detecciones:', zonasEncontradas);

          // Filtrar por zona seleccionada
          const deteccionesFiltradas = deteccionesConInfo.filter(deteccion => {
            // Normalizar los nombres para comparación (quitar espacios y convertir a minúsculas)
            const zonaNormalizada = (deteccion.zonaNombre || '').trim().toLowerCase();
            const selectedNormalizada = (this.selectedLocation || '').trim().toLowerCase();

            const coincide = zonaNormalizada === selectedNormalizada;
            console.log(`🎯 Filtro - Detección ${deteccion.id}: "${deteccion.zonaNombre}" (norm: "${zonaNormalizada}") === "${this.selectedLocation}" (norm: "${selectedNormalizada}") = ${coincide}`);
            return coincide;
          });

          console.log(`🎯 Detecciones filtradas para zona "${this.selectedLocation}":`, deteccionesFiltradas.length);

          // Ordenar por fecha (más recientes primero) y tomar las últimas 10
          this.ultimasDetecciones = deteccionesFiltradas
            .sort((a, b) => {
              const fechaA = new Date(a.fechaHora || new Date()).getTime();
              const fechaB = new Date(b.fechaHora || new Date()).getTime();
              return fechaB - fechaA; // Orden descendente (más recientes primero)
            })
            .slice(0, 10) // Solo las 10 más recientes de esa zona
            .map(deteccion => ({
              ...deteccion,
              // Asegurar compatibilidad con el template
              clasificador: deteccion.clasificadorNombre,
              estado: 'Confirmada' // Las detecciones recientes están confirmadas
            }));

          console.log('✅ Últimas detecciones procesadas para zona:', this.ultimasDetecciones.length);
          console.log('📋 Detecciones con información completa:', this.ultimasDetecciones);
        } else {
          console.warn('⚠️ No se encontraron detecciones recientes');
          this.ultimasDetecciones = [];
        }

        this.isLoadingDetecciones = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error cargando detecciones recientes:', error);
        this.ultimasDetecciones = [];
        this.isLoadingDetecciones = false;
        this.cdr.detectChanges();
      }
    });
  }

  trackDetectionById(index: number, detection: any): number {
    return detection.id;
  }

  getDetectionTypeColor(tipo: string): string {
    const tipoLower = tipo?.toLowerCase() || '';

    // Orgánico - Verde
    if (tipoLower.includes('orgánico') || tipoLower.includes('organico')) {
      return '#4CAF50'; // Verde para orgánico
    }
    // Valorizable/Reciclable - Azul
    else if (tipoLower ==='valorizable') {
      return '#2196F3'; // Azul para valorizable/reciclable
    }
    // No Valorizable - Naranja/Rojo
    else if (tipoLower==='no valorizable') {
      return '#FF9800'; // Naranja para no valorizable
    }
    // Otros tipos - Gris
    else {
      return '#9E9E9E'; // Gris para otros tipos
    }
  }

  getDetectionTypeIcon(tipo: string): string {
    const tipoLower = tipo?.toLowerCase() || '';

    console.log('Tipo de detección:', tipoLower);
    // Orgánico - Ícono de hoja
    if (tipoLower === 'organico') {
      return 'pi-heart'; // Hoja para orgánico
    }
    // Valorizable/Reciclable - Ícono de reciclaje
    else if (tipoLower === 'valorizable') {
      return 'pi-refresh'; // Ícono de reciclaje para valorizable
    }
    // No Valorizable - Ícono de advertencia
    else if (tipoLower === 'no valorizable') {
      return 'pi-exclamation-triangle'; // Triángulo de advertencia para no valorizable
    }
    // Otros tipos - Ícono genérico
    else {
      return 'pi-circle'; // Círculo para otros tipos
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
    console.log('🔄 Actualizando estadísticas GLOBALES del sistema...');
    this.loadGlobalStatistics();
    this.loadGlobalZoneComparison();
    this.loadGlobalTypePercentages();
    this.loadTopClasificadoresGlobales();
  }

  // *** MÉTODO PARA CARGAR ESTADÍSTICAS GLOBALES DEL SISTEMA ***
  private loadGlobalStatistics() {
    console.log('🌍 Cargando estadísticas GLOBALES del sistema completo...');
    this.isLoadingStats = true;

    // Cargar estadísticas generales del sistema
    this.backendService.getEstadisticasGenerales().subscribe({
      next: (estadisticas: EstadisticasGenerales) => {
        console.log('� Estadísticas generales del sistema:', estadisticas);
        this.estadisticasGenerales = estadisticas;
        this.totalDetecciones = estadisticas.totalDetecciones || 0;
        this.totalUsuarios = estadisticas.totalUsuarios || 0;
        this.totalZonas = estadisticas.totalZonas || 0;

        this.isLoadingStats = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error cargando estadísticas generales:', error);
        this.isLoadingStats = false;
        // No usar datos falsos
      }
    });
  }

  // *** MÉTODO PARA CARGAR COMPARATIVA ENTRE TODAS LAS ZONAS ***
  private loadGlobalZoneComparison() {
    console.log('🗺️ Cargando comparativa entre TODAS las zonas del sistema...');

    this.backendService.getEstadisticasZonas().subscribe({
      next: (zonas: EstadisticasZonas[]) => {
        console.log('📊 Estadísticas de todas las zonas:', zonas);
        this.estadisticasZonas = zonas;

        // Actualizar datos para el gráfico de barras (comparativa entre zonas)
        this.updateZoneComparisonChart(zonas);

        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error cargando estadísticas de zonas:', error);
        // Solo loggear el error, no generar datos falsos
        this.datosDashboardCentral = [];
        this.zonasDeteccionesHoy = [];
      }
    });
  }

  // *** ACTUALIZAR GRÁFICO DE COMPARATIVA ENTRE ZONAS ***
  private updateZoneComparisonChart(zonas: EstadisticasZonas[]) {
    console.log('📊 Actualizando gráfico de comparativa entre zonas:', zonas);

    if (zonas && zonas.length > 0) {
      // Filtrar solo las zonas que tienen detecciones
      const zonasConDetecciones = zonas.filter(zona => zona.totalDetecciones > 0);

      if (zonasConDetecciones.length === 0) {
        console.warn('⚠️ No hay zonas con detecciones');
        this.datosDashboardCentral = [];
        this.zonasDeteccionesHoy = [];
        return;
      }

      // Ordenar zonas por número de detecciones (mayor a menor)
      const zonasOrdenadas = zonasConDetecciones.sort((a, b) => b.totalDetecciones - a.totalDetecciones);

      // Encontrar el máximo para calcular porcentajes relativos
      const maxDetecciones = zonasOrdenadas[0].totalDetecciones;

      // Extraer datos para el gráfico de barras (porcentajes relativos para la altura)
      this.datosDashboardCentral = zonasOrdenadas.slice(0, 4).map(zona => {
        return maxDetecciones > 0 ? Math.round((zona.totalDetecciones / maxDetecciones) * 100) : 0;
      });

      this.zonasDeteccionesHoy = zonasOrdenadas.slice(0, 4).map(zona =>
        zona.nombre
      );

      console.log('✅ Gráfico de comparativa de zonas actualizado');
      console.log('📊 Datos del gráfico (porcentajes):', this.datosDashboardCentral);
      console.log('🏷️ Labels del gráfico:', this.zonasDeteccionesHoy);
      console.log('🔢 Datos numéricos para verificación:', zonasOrdenadas.map(z => ({
        nombre: z.nombre,
        detecciones: z.totalDetecciones,
        porcentaje: Math.round((z.totalDetecciones / maxDetecciones) * 100)
      })));

      // DEBUG: Verificar que los datos lleguen al template
      setTimeout(() => {
        console.log('🎯 VERIFICACIÓN FINAL - Datos en las variables del componente:');
        console.log('  datosDashboardCentral:', this.datosDashboardCentral);
        console.log('  zonasDeteccionesHoy:', this.zonasDeteccionesHoy);
      }, 100);
    } else {
      console.warn('⚠️ No hay datos de zonas disponibles');
      this.datosDashboardCentral = [];
      this.zonasDeteccionesHoy = [];
    }
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
        // No usar datos falsos
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
        // Solo loggear el error, no generar datos falsos
        this.datosDashboardCentral = [];
        this.zonasDeteccionesHoy = [];
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

  // *** CARGAR PORCENTAJES GLOBALES DE TIPOS DE RESIDUO ***
  private loadGlobalTypePercentages() {
    console.log('🌍 Cargando porcentajes globales de tipos de residuo...');

    this.backendService.getDetecciones().subscribe({
      next: (detecciones: any[]) => {
        console.log('📊 Detecciones globales obtenidas:', detecciones);

        if (detecciones && detecciones.length > 0) {
          // Contar tipos de residuo a nivel global
          const tiposCounts: { [key: string]: number } = {};

          detecciones.forEach(deteccion => {
            const tipo = (deteccion.tipo || deteccion.tipoResiduo || 'Sin tipo').toLowerCase();
            tiposCounts[tipo] = (tiposCounts[tipo] || 0) + 1;
          });

          console.log('📈 Conteo de tipos:', tiposCounts);

          const total = detecciones.length;

          // Mapear tipos conocidos
          let reciclableCount = 0;
          let organicoCount = 0;
          let novalCount = 0;
          
          Object.keys(tiposCounts).forEach(tipo => {
            const count = tiposCounts[tipo];
            if (tipo === 'Valorizable' || tipo === 'valorizable') {
              reciclableCount += count;
            } else if (tipo.includes('organico') || tipo.includes('orgánico') || tipo.includes('Organico')) {
              organicoCount += count;
            }else if (tipo ==='no valorizable') {
              novalCount += count;
            }
          });

          // Calcular porcentajes
          this.porcentajeValorizable = total > 0 ? Math.round((reciclableCount / total) * 100) : 0;
          this.porcentajeOrganica = total > 0 ? Math.round((organicoCount / total) * 100) : 0;
          this.porcentajeNoValorizable = total > 0 ? Math.round((novalCount / total) * 100) : 0;

          // Ajustar para que sume 100%
          const suma = this.porcentajeValorizable + this.porcentajeOrganica + this.porcentajeNoValorizable;
          if (suma < 100 && total > 0) {
            this.porcentajeNoValorizable += (100 - suma);
          }

          console.log('🎯 Porcentajes globales calculados:');
          console.log(`  📦 Reciclable/Valorizable: ${this.porcentajeValorizable}% (${reciclableCount} detecciones)`);
          console.log(`  🌱 Orgánico: ${this.porcentajeOrganica}% (${organicoCount} detecciones)`);
          console.log(`  🗑️ General/No Valorizable: ${this.porcentajeNoValorizable}% (${novalCount} detecciones)`);

        } else {
          console.warn('⚠️ No se encontraron detecciones para calcular porcentajes');
          // No usar datos falsos por defecto
        }

        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error al obtener detecciones globales:', error);
        // No usar datos falsos por defecto
        this.cdr.detectChanges();
      }
    });
  }

  // *** ACTUALIZAR GRÁFICOS CON ESTADÍSTICAS DE TIPOS ***
  private updateTypeCharts(tipos: EstadisticasTipos[]) {
    console.log('📊 Actualizando gráficos de tipos con datos del backend:', tipos);

    if (tipos && tipos.length > 0) {
      // Calcular el total de detecciones por tipo
      const total = tipos.reduce((sum, tipo) => sum + (tipo.cantidad || 0), 0);

      // Buscar tipos específicos y calcular porcentajes
      let valorizableCount = 0;
      let organicoCount = 0;
      let noValorizableCount = 0;

      tipos.forEach(tipo => {
        const nombreTipo = (tipo.tipo || '').toLowerCase();
        const cantidad = tipo.cantidad || 0;

        if (nombreTipo.includes('valorizable') || nombreTipo.includes('Valorizable') || nombreTipo.includes('plastico')) {
          valorizableCount += cantidad;
        } else if (nombreTipo.includes('organico') || nombreTipo.includes('orgánico') || nombreTipo.includes('Organico')) {
          organicoCount += cantidad;
        } else if(nombreTipo.includes('no valorizable') || nombreTipo.includes('No Valorizable') || nombreTipo.includes('no Valorizable')) {
          noValorizableCount += cantidad;
        }
      });

      // Calcular porcentajes
      this.porcentajeValorizable = total > 0 ? Math.round((valorizableCount / total) * 100) : 0;
      this.porcentajeOrganica = total > 0 ? Math.round((organicoCount / total) * 100) : 0;
      this.porcentajeNoValorizable = total > 0 ? Math.round((noValorizableCount / total) * 100) : 0;

      // Asegurar que sume 100%
      const suma = this.porcentajeValorizable + this.porcentajeOrganica + this.porcentajeNoValorizable;
      if (suma < 100 && total > 0) {
        this.porcentajeNoValorizable += (100 - suma);
      }

      console.log('✅ Gráficos de tipos actualizados desde backend:');
      console.log(`  📦 Valorizable: ${this.porcentajeValorizable}% (${valorizableCount} detecciones)`);
      console.log(`  🌱 Orgánico: ${this.porcentajeOrganica}% (${organicoCount} detecciones)`);
      console.log(`  🗑️ No Valorizable: ${this.porcentajeNoValorizable}% (${noValorizableCount} detecciones)`);

    } else {
      console.warn('⚠️ No hay datos de tipos del backend, manteniendo método alternativo');
      // Mantener el método de fallback que ya funciona
      this.loadGlobalTypePercentages();
    }
  }

  // === MÉTODOS DE MENÚ DE USUARIO ===

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

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAccountDate(date: Date | string | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // *** MÉTODOS DE ACTUALIZACIÓN DE GRÁFICOS ***

  private updateChartsFromGeneralStats(generales: EstadisticasGenerales) {
    console.log('📊 Actualizando gráficos principales con estadísticas generales:', generales);

    // Actualizar totales principales
    this.totalDetecciones = generales.totalDetecciones || 0;
    this.totalUsuarios = generales.totalUsuarios || 0;
    this.totalZonas = generales.totalZonas || 0;

    console.log('✅ Gráficos principales actualizados con estadísticas generales');
    this.cdr.detectChanges();
  }

  private updateHourlyChart(horarios: EstadisticasHorarios[]) {
    console.log('⏰ Actualizando gráfico de horas con:', horarios);

    // Procesar datos horarios para el gráfico
    if (horarios && horarios.length > 0) {
      const horasData = new Array(24).fill(0);

      horarios.forEach(hora => {
        const horaIndex = parseInt(hora.hora.toString());
        if (horaIndex >= 0 && horaIndex < 24) {
          horasData[horaIndex] = hora.cantidad || 0;
        }
      });

      // Encontrar la hora pico
      const maxHora = Math.max(...horasData);
      const horaPico = horasData.indexOf(maxHora);

      console.log(`📈 Hora pico: ${horaPico}:00 con ${maxHora} detecciones`);

      // Actualizar variables para el template
      this.deteccionesPorHora = horarios;
    }

    this.cdr.detectChanges();
  }

  private updateGlobalZoneCharts(zonas: EstadisticasZonas[]) {
    console.log('🗺️ Actualizando gráficos globales de zonas con:', zonas);

    if (zonas && zonas.length > 0) {
      // Procesar estadísticas por zona
      this.estadisticasZonas = zonas;

      // Encontrar zona más activa
      const zonaMasActiva = zonas.reduce((max, zona) =>
        (zona.totalDetecciones || 0) > (max.totalDetecciones || 0) ? zona : max
      );

      console.log('🏆 Zona más activa:', zonaMasActiva.nombre, 'con', zonaMasActiva.totalDetecciones, 'detecciones');

    } else {
      console.warn('⚠️ No hay datos de zonas disponibles');
    }

    this.cdr.detectChanges();
  }

  private loadUserStatistics() {
    console.log('👥 Cargando estadísticas de usuarios...');

    // Obtener usuarios más activos usando el método existente
    this.backendService.getUsuarios().subscribe({
      next: (usuarios: User[]) => {
        console.log('✅ Usuarios obtenidos para estadísticas:', usuarios);

        // Solo contar los usuarios reales del sistema
        this.usuariosMasActivos = usuarios.slice(0, 5).map(usuario => ({
          nombre: usuario.nombre || 'Usuario',
          detecciones: 0 // Sin simular datos falsos
        }));

        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error usuarios más activos:', error);
        this.usuariosMasActivos = [];
      }
    });
  }

  // *** MÉTODOS AUXILIARES ***

  // Método para formatear nombres de zonas en las etiquetas del gráfico
  formatZoneLabel(zoneName: string | undefined): string {
    if (!zoneName || zoneName === 'N/A') return 'N/A';

    // Eliminar prefijos comunes y acortar nombres largos
    let formatted = zoneName
      .replace('Edificio ', 'Ed. ')
      .replace('Zona ', '')
      .trim();

    // Si sigue siendo muy largo, truncar
    if (formatted.length > 8) {
      formatted = formatted.substring(0, 8) + '...';
    }

    return formatted;
  }

  // Método para obtener el título completo de la zona (para el hover)
  getZoneTitle(index: number): string {
    const zoneName = this.zonasDeteccionesHoy[index];
    const detections = this.estadisticasZonas.find(z => z.nombre === zoneName)?.totalDetecciones || 0;

    if (!zoneName || zoneName === 'N/A') {
      return 'Sin datos';
    }

    return `${zoneName}: ${detections} detecciones`;
  }

  // *** MÉTODO AUXILIAR PARA DEBUGGING ***

  // Método público para cambiar zona desde la consola (debugging)
  cambiarZona(nombreZona: string) {
    console.log('🔧 DEBUG - Cambiando zona manualmente a:', nombreZona);
    if (this.locations.includes(nombreZona)) {
      this.selectedLocation = nombreZona;
      // Recargar detecciones con la nueva zona
      this.loadUltimasDetecciones();
    } else {
      console.error('❌ Zona no encontrada. Zonas disponibles:', this.locations);
    }
  }

  // Método para ver todas las detecciones sin filtro (debugging)
  verTodasLasDetecciones() {
    console.log('🔧 DEBUG - Cargando TODAS las detecciones sin filtro...');
    this.backendService.getDeteccionesRecientes(50).subscribe({
      next: (detecciones) => {
        console.log('🔍 TODAS las detecciones del backend:', detecciones);
      },
      error: (error) => {
        console.error('❌ Error:', error);
      }
    });
  }

  // *** INTERFAZ PARA BACKEND ***

  // Método para obtener el resumen estadístico completo
  getEstadisticasCompletas(): any {
    return {
      totales: {
        detecciones: this.totalDetecciones,
        usuarios: this.totalUsuarios,
        zonas: this.totalZonas
      },
      porcentajes: {
        valorizable: this.porcentajeValorizable,
        organica: this.porcentajeOrganica,
        noValorizable: this.porcentajeNoValorizable
      },
      actividad: {
        clasificadores: this.topClasificadoresGlobales,
        usuarios: this.usuariosMasActivos,
        zonas: this.estadisticasZonas
      }
    };
  }
}
