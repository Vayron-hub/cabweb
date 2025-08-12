import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import {
  BackendService,
  User,
  Zona,
  Clasificador,
  EstadisticasGenerales,
  EstadisticasHorarios,
  EstadisticasZonas,
  EstadisticasTipos,
} from '../../services/backend.service';
import { ZonaService } from '../../services/zona.service';
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
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  Math = Math;

  selectedLocation = '';
  selectedZonaId: string | number = '';
  locations: string[] = [];
  zonas: Zona[] = [];
  clasificadores: Clasificador[] = [];
  isLoadingZonas = false;

  currentUser: User = {
    id: 0,
    nombre: '',
    correo: '',
    email: '',
    password: '',
    rol: '',
    activo: false,
    enLinea: false,
    fechaCreacion: '',
    fechaUltimoAcceso: null,
    ultimoAcceso: new Date(),
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
    { label: 'Cliente', value: 'Cliente' },
    { label: 'Administrador', value: 'Admin' },
    { label: 'Super Administrador', value: 'SuperAdmin' },
  ];

  isLoadingStats = false;
  estadisticasGenerales: EstadisticasGenerales | null = null;
  deteccionesPorHora: EstadisticasHorarios[] = [];
  estadisticasZonas: EstadisticasZonas[] = [];
  estadisticasTipos: EstadisticasTipos[] = [];
  estadisticasHorarios: EstadisticasHorarios[] = []; // Para el heatmap

  usuariosMasActivos: UsuarioActivo[] = [];
  totalDetecciones: number = 0;
  totalUsuarios: number = 0;
  totalZonas: number = 0;

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
  }

  userRole: string = '';

  ngOnInit() {
    const cu = this.backendService.getCurrentUser();
    this.userRole = cu && (cu as any).rol ? (cu as any).rol : '';
    this.zonaSubscription = this.zonaService.selectedZona$.subscribe(
      (zonaInfo) => {
        if (zonaInfo && zonaInfo.nombre) {
          this.selectedLocation = zonaInfo.nombre;
          this.selectedZonaId = zonaInfo.id;
          this.loadUltimasDetecciones();
        }
      }
    );
    this.loadInitialData();
  }

  ngOnDestroy() {
    this.zonaSubscription.unsubscribe();
  }

  loadInitialData() {
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
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  loadUsers() {
    this.isLoadingUsers = true;

    this.backendService.getUsuarios().subscribe({
      next: (usuarios: User[]) => {
        this.allUsers = usuarios.map((user) => ({
          ...user,
          email: user.email || user.correo,
          estado: user.activo ? 'Activo' : 'Inactivo',
          ultimoAcceso:
            (user as any).ultimoAcceso ||
            (user as any).fechaUltimoAcceso ||
            new Date(),
          rol: (user as any).rol || user.rol || '',
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
      },
    });
  }

  // === MÉTODOS PARA ROLES / VISIBILIDAD ===
  isCustomer(): boolean {
    return this.userRole === 'Cliente';
  }
  isAdmin(): boolean {
    return this.userRole === 'Admin';
  }
  isSuperAdmin(): boolean {
    return this.userRole === 'SuperAdmin';
  }
  isPrivileged(): boolean {
    return this.isAdmin() || this.isSuperAdmin();
  }

  filterUsers() {
    this.filteredUsers = this.allUsers.filter(
      (user) =>
        user.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (user.correo &&
          user.correo.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (user.email &&
          user.email.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  toggleUserStatus(user: User) {
    const newStatus = !user.activo;
    this.backendService
      .updateUsuario(user.id, { ...user, activo: newStatus })
      .subscribe({
        next: (updatedUser: User) => {
          const index = this.allUsers.findIndex((u) => u.id === user.id);
          if (index !== -1) {
            this.allUsers[index] = updatedUser;
            this.filterUsers();
          }
        },
        error: (error: any) => {
          console.error('❌ Error actualizando estado:', error);
        },
      });
  }

  getActiveUsersCount(): number {
    return this.allUsers.filter((user) => user.activo === true).length;
  }

  getInactiveUsersCount(): number {
    return this.allUsers.filter((user) => user.activo === false).length;
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
      this.selectedUsers = this.selectedUsers.filter((id) => id !== userId);
    }
  }

  selectAllUsers(event: any) {
    if (event.target.checked) {
      this.selectedUsers = this.filteredUsers.map((user) => user.id);
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

  onRoleFilterChange(event: any) {
    const role = event.target.value;
    if (event.target.checked) {
      this.selectedRoles.push(role);
    } else {
      this.selectedRoles = this.selectedRoles.filter((r) => r !== role);
    }
    this.filterUsers();
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
    return true;
  }

  loadTopClasificadoresGlobales() {
    this.isLoadingClasificadores = true;

    this.backendService.getEstadisticasClasificadores().subscribe({
      next: (clasificadores: any[]) => {
        if (
          clasificadores &&
          Array.isArray(clasificadores) &&
          clasificadores.length > 0
        ) {
          this.topClasificadoresGlobales = clasificadores
            .map((cls: any) => ({
              name: cls.nombre || `Clasificador ${cls.id}`,
              id: cls.id,
              totalDetecciones: cls.totalDetecciones || 0,
              zona: cls.zona || 'Sin zona',
            }))
            .sort((a: any, b: any) => b.totalDetecciones - a.totalDetecciones)
            .slice(0, 3); // TOP 3 clasificadores más activos
        } else {
          console.warn('⚠️ No se encontraron clasificadores válidos');
          this.topClasificadoresGlobales = [];
        }

        this.isLoadingClasificadores = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error(
          '❌ Error cargando clasificadores desde /api/clasificadores/estadisticas:',
          error
        );
        this.topClasificadoresGlobales = [];
        this.isLoadingClasificadores = false;
        this.cdr.detectChanges();
      },
    });
  }

  getDetectionType(tipo: string): string {
    switch (tipo) {
      case 'Organico':
        return 'Orgánico';
      case 'Valorizable':
        return 'Valorizable';
      case 'NoValorizable':
        return 'No valorizable';
      default:
        return 'Error';
    }
  }

  getCurrentClassifiers(): any[] {
    return this.topClasificadoresGlobales.length > 0
      ? this.topClasificadoresGlobales
      : [];
  }

  getActiveCount(): number {
    return this.topClasificadoresGlobales.length;
  }

  getTotalCount(): number {
    return (
      this.estadisticasGenerales?.totalClasificadores ||
      this.topClasificadoresGlobales.length
    );
  }

  loadUltimasDetecciones() {
    if (!this.selectedLocation) {
      return;
    }

    this.isLoadingDetecciones = true;

    forkJoin({
      detecciones: this.backendService.getDeteccionesRecientes(20), // Pedimos más para filtrar por zona
      clasificadores: this.backendService.getClasificadores(),
      zonas: this.backendService.getZonas(),
    }).subscribe({
      next: (data) => {
        this.clasificadores = data.clasificadores;
        this.zonas = data.zonas;

        if (data.detecciones && data.detecciones.length > 0) {
          const clasificadoresMap = new Map();
          data.clasificadores.forEach((clasificador) => {
            clasificadoresMap.set(clasificador.id, clasificador);
          });

          const deteccionesConInfo = data.detecciones.map((deteccion) => {
            const clasificador = clasificadoresMap.get(
              deteccion.clasificadorId
            );
            const zonaNombre = clasificador?.zona?.nombre || 'Sin zona';

            const deteccionProcesada = {
              ...deteccion,
              clasificadorNombre: clasificador
                ? clasificador.nombre
                : `Clasificador ${deteccion.clasificadorId}`,
              zonaNombre: zonaNombre,
              zona: zonaNombre, // Para compatibilidad con el filtro existente
            };

            return deteccionProcesada;
          });

          const deteccionesFiltradas = deteccionesConInfo.filter(
            (deteccion) => {
              const zonaNormalizada = (deteccion.zonaNombre || '')
                .trim()
                .toLowerCase();
              const selectedNormalizada = (this.selectedLocation || '')
                .trim()
                .toLowerCase();
              const coincide = zonaNormalizada === selectedNormalizada;
              return coincide;
            }
          );

          this.ultimasDetecciones = deteccionesFiltradas
            .sort((a, b) => {
              const fechaA = new Date(a.fechaHora || new Date()).getTime();
              const fechaB = new Date(b.fechaHora || new Date()).getTime();
              return fechaB - fechaA; // Orden descendente (más recientes primero)
            })
            .slice(0, 10) // Solo las 10 más recientes de esa zona
            .map((deteccion) => ({
              ...deteccion,
              // Asegurar compatibilidad con el template
              clasificador: deteccion.clasificadorNombre,
              estado: 'Confirmada', // Las detecciones recientes están confirmadas
            }));
        } else {
          this.ultimasDetecciones = [];
        }

        this.isLoadingDetecciones = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.ultimasDetecciones = [];
        this.isLoadingDetecciones = false;
        this.cdr.detectChanges();
      },
    });
  }

  trackDetectionById(index: number, detection: any): number {
    return detection.id;
  }

  getDetectionTypeColor(tipo: string): string {
    const tipoLower = tipo?.toLowerCase() || '';

    // Orgánico - Verde
    if (tipoLower.includes('Organico')) {
      return '#4CAF50'; // Verde para orgánico
    }
    // Valorizable/Reciclable - Azul
    else if (tipoLower === 'Valorizable') {
      return '#2196F3'; // Azul para valorizable/reciclable
    }
    // No Valorizable - Naranja/Rojo
    else if (tipoLower === 'NoValorizable') {
      return '#FF9800'; // Naranja para no valorizable
    }
    // Otros tipos - Gris
    else {
      return '#9E9E9E'; // Gris para otros tipos
    }
  }

  getDetectionTypeImg(tipo: string): string {
    const tipoLower = tipo?.toLowerCase() || '';

    // Orgánico - Ícono de hoja
    if (tipo === 'Organico') {
      return 'assets/images/organico.png'; // Hoja para orgánico
    }
    // Valorizable/Reciclable - Ícono de reciclaje
    else if (tipo === 'Valorizable') {
      return 'assets/images/valorizable.png'; // Ícono de reciclaje para valorizable
    }
    // No Valorizable - Ícono de advertencia
    else if (tipo === 'NoValorizable') {
      return 'assets/images/no_valorizable.png'; // Ícono de advertencia para no valorizable
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

  refreshStatistics() {
    this.loadGlobalStatistics();
    this.loadGlobalZoneComparison();
    this.loadGlobalTypePercentages();
    this.loadTopClasificadoresGlobales();
  }

  private loadGlobalStatistics() {
    this.isLoadingStats = true;
    this.backendService.getEstadisticasGenerales().subscribe({
      next: (estadisticas: EstadisticasGenerales) => {
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
      },
    });
  }

  private loadGlobalZoneComparison() {
    this.backendService.getEstadisticasZonas().subscribe({
      next: (zonas: EstadisticasZonas[]) => {
        this.estadisticasZonas = zonas;
        this.updateZoneComparisonChart(zonas);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error cargando estadísticas de zonas:', error);
        this.datosDashboardCentral = [];
        this.zonasDeteccionesHoy = [];
      },
    });
  }

  private updateZoneComparisonChart(zonas: EstadisticasZonas[]) {
    if (zonas && zonas.length > 0) {
      // Filtrar solo las zonas que tienen detecciones
      const zonasConDetecciones = zonas.filter(
        (zona) => zona.totalDetecciones > 0
      );

      if (zonasConDetecciones.length === 0) {
        console.warn('⚠️ No hay zonas con detecciones');
        this.datosDashboardCentral = [0, 0, 0, 0];
        this.zonasDeteccionesHoy = [
          'Sin datos',
          'Sin datos',
          'Sin datos',
          'Sin datos',
        ];
        return;
      }

      const zonasOrdenadas = zonasConDetecciones.sort(
        (a, b) => b.totalDetecciones - a.totalDetecciones
      );

      const maxDetecciones = zonasOrdenadas[0].totalDetecciones;

      const topZonas = zonasOrdenadas.slice(0, 3);

      while (topZonas.length < 3) {
        topZonas.push({
          nombre: 'Sin datos',
          totalDetecciones: 0,
        } as EstadisticasZonas);
      }

      this.datosDashboardCentral = topZonas.map(
        (zona) => zona.totalDetecciones
      );

      this.zonasDeteccionesHoy = topZonas.map((zona) => zona.nombre);
      // Forzar detección de cambios
      this.cdr.detectChanges();
    } else {
      console.warn('⚠️ No hay datos de zonas disponibles');
      this.datosDashboardCentral = [0, 0, 0, 0];
      this.zonasDeteccionesHoy = [
        'Sin datos',
        'Sin datos',
        'Sin datos',
        'Sin datos',
      ];
    }
  }

  private loadGlobalTypePercentages() {
    this.backendService.getDetecciones().subscribe({
      next: (detecciones: any[]) => {
        if (detecciones && detecciones.length > 0) {
          const tiposCounts: { [key: string]: number } = {};

          detecciones.forEach((deteccion) => {
            const tipo = (
              deteccion.tipo ||
              deteccion.tipoResiduo ||
              'Sin tipo'
            ).toLowerCase();
            tiposCounts[tipo] = (tiposCounts[tipo] || 0) + 1;
          });

          const total = detecciones.length;

          let reciclableCount = 0;
          let organicoCount = 0;
          let novalCount = 0;

          Object.keys(tiposCounts).forEach((tipo) => {
            const count = tiposCounts[tipo];
            if (tipo === 'Valorizable') {
              reciclableCount += count;
            } else if (tipo === 'Organico') {
              organicoCount += count;
            } else if (tipo === 'NoValorizable') {
              novalCount += count;
            }
          });

          this.porcentajeValorizable =
            total > 0 ? Math.round((reciclableCount / total) * 100) : 0;
          this.porcentajeOrganica =
            total > 0 ? Math.round((organicoCount / total) * 100) : 0;
          this.porcentajeNoValorizable =
            total > 0 ? Math.round((novalCount / total) * 100) : 0;

          const suma =
            this.porcentajeValorizable +
            this.porcentajeOrganica +
            this.porcentajeNoValorizable;
          if (suma < 100 && total > 0) {
            this.porcentajeNoValorizable += 100 - suma;
          }
        } else {
          console.warn(
            '⚠️ No se encontraron detecciones para calcular porcentajes'
          );
        }

        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('❌ Error al obtener detecciones globales:', error);
        this.cdr.detectChanges();
      },
    });
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  viewMyAccount() {
    this.showAccountModal = true;
    this.userMenuOpen = false;
  }

  logout() {
    this.userMenuOpen = false;
  }

  closeAccountModal() {
    this.showAccountModal = false;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatAccountDate(date: Date | string | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatZoneLabel(zoneName: string | undefined): string {
    if (!zoneName || zoneName === 'N/A') return 'N/A';
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

  getZoneTitle(index: number): string {
    const zoneName = this.zonasDeteccionesHoy[index];
    const detections =
      this.estadisticasZonas.find((z) => z.nombre === zoneName)
        ?.totalDetecciones || 0;

    if (!zoneName || zoneName === 'N/A') {
      return 'Sin datos';
    }

    return `${zoneName}: ${detections} detecciones`;
  }

  cambiarZona(nombreZona: string) {
    if (this.locations.includes(nombreZona)) {
      this.selectedLocation = nombreZona;
      this.loadUltimasDetecciones();
    } else {
      console.error(
        '❌ Zona no encontrada. Zonas disponibles:',
        this.locations
      );
    }
  }

  verTodasLasDetecciones() {
    this.backendService.getDeteccionesRecientes(50).subscribe({
      next: (detecciones) => {},
      error: (error) => {
        console.error('❌ Error:', error);
      },
    });
  }

  getEstadisticasCompletas(): any {
    return {
      totales: {
        detecciones: this.totalDetecciones,
        usuarios: this.totalUsuarios,
        zonas: this.totalZonas,
      },
      porcentajes: {
        valorizable: this.porcentajeValorizable,
        organica: this.porcentajeOrganica,
        noValorizable: this.porcentajeNoValorizable,
      },
      actividad: {
        clasificadores: this.topClasificadoresGlobales,
        usuarios: this.usuariosMasActivos,
        zonas: this.estadisticasZonas,
      },
    };
  }

  getTopZoneCount(): number {
    if (!this.estadisticasZonas || this.estadisticasZonas.length === 0) {
      return 0;
    }

    const maxDetecciones = Math.max(
      ...this.estadisticasZonas.map((zona) => zona.totalDetecciones || 0)
    );
    return maxDetecciones;
  }

  getTopZoneName(): string {
    if (!this.estadisticasZonas || this.estadisticasZonas.length === 0) {
      return 'Sin datos';
    }

    const zonaConMasDetecciones = this.estadisticasZonas.reduce((max, zona) =>
      (zona.totalDetecciones || 0) > (max.totalDetecciones || 0) ? zona : max
    );

    return this.formatZoneLabel(zonaConMasDetecciones.nombre);
  }
}
