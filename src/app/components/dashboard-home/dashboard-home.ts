import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { ChartModule } from 'primeng/chart';
import { BackendService, Zona } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard-home',
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
  templateUrl: './dashboard-home.html',
})
export class DashboardHomeComponent implements OnInit {
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
  isLoadingDetecciones = false;
  
  // Datos para gráficos de estadísticas específicos
  deteccionesPorHora: number[] = [85, 65, 75, 90];
  clasificacionesExitosas: number[] = [92, 78, 88, 95];
  flujoTransporte: number[] = [70, 45, 60, 80];
  actividadUsuarios: number[] = [88, 72, 95, 63];
  
  // Últimas detecciones
  ultimasDetecciones: any[] = [];
  
  // Mantener ubicación por defecto mientras carga
  defaultLocation = 'Edificio D';

  // Estadísticas por zona (hardcoded para fallback)
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

  // Clasificadores por zona (hardcoded para fallback)
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

  constructor(private backendService: BackendService) {}

  ngOnInit() {
    this.loadZonas();
    this.loadUltimasDetecciones();
    this.loadClasificadores();
  }

  loadZonas() {
    this.isLoadingZonas = true;
    this.backendService.getZonas().subscribe({
      next: (zonasResponse) => {
        this.zonas = zonasResponse;
        this.locations = zonasResponse.map((zona: any) => zona.nombre);
        
        if (this.locations.length > 0) {
          this.selectedLocation = this.locations[0];
          const zonaSeleccionada = this.zonas.find(z => z.nombre === this.selectedLocation);
          this.selectedZonaId = zonaSeleccionada?.id || '';
        } else {
          this.selectedLocation = this.defaultLocation;
        }
        this.isLoadingZonas = false;
      },
      error: (error) => {
        console.error('Error al cargar zonas:', error);
        this.locations = [this.defaultLocation];
        this.selectedLocation = this.defaultLocation;
        this.isLoadingZonas = false;
      }
    });
  }

  loadClasificadores() {
    this.isLoadingClasificadores = true;
    this.backendService.getClasificadores().subscribe({
      next: (clasificadores) => {
        this.clasificadores = clasificadores;
        this.updateClasificadoresPorZona();
        this.isLoadingClasificadores = false;
      },
      error: (error) => {
        console.error('Error al cargar clasificadores:', error);
        this.clasificadores = [];
        this.isLoadingClasificadores = false;
      }
    });
  }

  updateClasificadoresPorZona() {
    if (this.selectedZonaId) {
      this.clasificadoresPorZona = this.clasificadores.filter(
        clf => clf.zonaId === this.selectedZonaId
      );
    } else {
      this.clasificadoresPorZona = [];
    }
  }

  loadUltimasDetecciones() {
    this.isLoadingDetecciones = true;
    this.backendService.getDeteccionesRecientes(5).subscribe({
      next: (detecciones) => {
        console.log('🔍 Detecciones recibidas:', detecciones);
        // Log de los campos de tipo para debugging
        detecciones.forEach((det, index) => {
          console.log(`Detección ${index}:`, {
            id: det.id,
            tipo: det.tipo,
            tipoResiduo: (det as any).tipoResiduo,
            todosLosCampos: Object.keys(det)
          });
        });
        
        this.ultimasDetecciones = detecciones;
        this.isLoadingDetecciones = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar detecciones:', error);
        this.ultimasDetecciones = [];
        this.isLoadingDetecciones = false;
      }
    });
  }

  onLocationChange() {
    const zonaSeleccionada = this.zonas.find(z => z.nombre === this.selectedLocation);
    this.selectedZonaId = zonaSeleccionada?.id || '';
    this.updateClasificadoresPorZona();
    console.log('Zona seleccionada:', this.selectedLocation, 'ID:', this.selectedZonaId);
  }

  // Método para obtener clasificadores de la zona actual (con fallback)
  getCurrentClassifiers() {
    if (this.clasificadoresPorZona.length > 0) {
      return this.clasificadoresPorZona;
    }
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

  formatDetectionTime(fecha: string | Date | undefined): string {
    // Validar que fecha no sea undefined, null o vacío
    if (!fecha) {
      return 'Sin fecha';
    }
    
    try {
      const date = new Date(fecha);
      
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Ahora mismo';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      return `Hace ${diffDays}d`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  }

  getDetectionTypeColor(tipo: string): string {
    // Validar que tipo no sea undefined, null o vacío
    if (!tipo || typeof tipo !== 'string') {
      return '#9E9E9E'; // Color por defecto para valores inválidos
    }
    
    const colorMap: { [key: string]: string } = {
      'organico': '#4CAF50',
      'reciclable': '#2196F3', 
      'general': '#9E9E9E',
      'peligroso': '#F44336'
    };
    return colorMap[tipo.toLowerCase()] || '#9E9E9E';
  }

  getDetectionTypeIcon(tipo: string): string {
    // Validar que tipo no sea undefined, null o vacío
    if (!tipo || typeof tipo !== 'string') {
      return 'pi-trash'; // Icono por defecto para valores inválidos
    }
    
    const iconMap: { [key: string]: string } = {
      'organico': 'pi-leaf',
      'reciclable': 'pi-refresh',
      'general': 'pi-trash',
      'peligroso': 'pi-exclamation-triangle'
    };
    return iconMap[tipo.toLowerCase()] || 'pi-trash';
  }

  trackDetectionById(index: number, item: any): any {
    return item.deteccionId;
  }

  exportStatisticsData() {
    console.log('Exportando estadísticas...');
  }

  refreshStatistics() {
    this.isLoadingStats = true;
    setTimeout(() => {
      this.isLoadingStats = false;
    }, 2000);
  }
}
