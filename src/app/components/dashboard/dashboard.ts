import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '../../services/auth';
import { BackendService, EstadisticasZonas, EstadisticasTipos, EstadisticasHorarios } from '../../services/backend.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CardModule, ButtonModule, ChartModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  selectedType: string = '';
  currentUser: any;
  
  // Datos para gráficas
  chartData: any;
  chartOptions: any;
  
  // Datos específicos según el tipo
  zoneData: any;
  wasteData: any;
  scheduleData: any;
  
  // Estados de carga
  isLoadingZones = false;
  isLoadingWaste = false;
  isLoadingSchedule = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private backendService: BackendService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.selectedType = this.route.snapshot.queryParams['type'] || 'general';
    this.initializeChartData();
    this.loadDataByType();
  }

  initializeChartData() {
    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  }

  loadDataByType() {
    switch(this.selectedType) {
      case 'zona':
        this.loadZoneData();
        break;
      case 'basura':
        this.loadWasteData();
        break;
      case 'horario':
        this.loadScheduleData();
        break;
      default:
        this.loadGeneralData();
    }
  }

  loadZoneData() {
    this.isLoadingZones = true;
    console.log('🔄 Cargando estadísticas de zonas...');
    
    this.zoneData = {
      title: 'Zonas con Mayor Actividad',
      subtitle: 'Distribución de detecciones por zona'
    };
    
    this.backendService.getEstadisticasZonas().subscribe({
      next: (estadisticas: EstadisticasZonas[]) => {
        console.log('✅ Estadísticas de zonas cargadas:', estadisticas);
        
        this.chartData = {
          labels: estadisticas.map(stat => stat.nombre),
          datasets: [
            {
              label: 'Cantidad de Detecciones',
              data: estadisticas.map(stat => stat.totalDetecciones),
              backgroundColor: [
                '#4a7c59',
                '#5a8c6a',
                '#6b9d7b',
                '#7cae8c',
                '#8dbf9d',
                '#9ed0ae'
              ]
            }
          ]
        };
        
        this.isLoadingZones = false;
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas de zonas:', error);
        this.isLoadingZones = false;
        
        // Fallback a datos mock
        this.loadZoneDataFallback();
      }
    });
  }

  private loadZoneDataFallback() {
    console.log('⚠️ Usando datos mock para zonas');
    this.chartData = {
      labels: ['Zona Norte', 'Zona Sur', 'Zona Este', 'Zona Oeste', 'Centro'],
      datasets: [
        {
          label: 'Cantidad de Recolecciones',
          data: [45, 38, 52, 41, 67],
          backgroundColor: [
            '#4a7c59',
            '#5a8c6a',
            '#6b9d7b',
            '#7cae8c',
            '#8dbf9d'
          ]
        }
      ]
    };
  }

  loadWasteData() {
    this.isLoadingWaste = true;
    console.log('🔄 Cargando estadísticas de tipos de residuos...');
    
    this.wasteData = {
      title: 'Tipos de Residuos Más Comunes',
      subtitle: 'Clasificación por categoría de residuos'
    };
    
    this.backendService.getEstadisticasTipos().subscribe({
      next: (estadisticas: EstadisticasTipos[]) => {
        console.log('✅ Estadísticas de tipos cargadas:', estadisticas);
        
        this.chartData = {
          labels: estadisticas.map(stat => stat.tipo),
          datasets: [
            {
              label: 'Porcentaje (%)',
              data: estadisticas.map(stat => stat.porcentaje),
              backgroundColor: [
                '#4a7c59',
                '#5a8c6a',
                '#6b9d7b',
                '#7cae8c',
                '#8dbf9d',
                '#9ed0ae'
              ]
            }
          ]
        };
        
        this.isLoadingWaste = false;
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas de tipos:', error);
        this.isLoadingWaste = false;
        
        // Fallback a datos mock
        this.loadWasteDataFallback();
      }
    });
  }

  private loadWasteDataFallback() {
    console.log('⚠️ Usando datos mock para tipos de residuos');
    this.chartData = {
      labels: ['Orgánicos', 'Plásticos', 'Papel/Cartón', 'Vidrio', 'Metales', 'Otros'],
      datasets: [
        {
          label: 'Porcentaje (%)',
          data: [35, 28, 18, 8, 6, 5],
          backgroundColor: [
            '#4a7c59',
            '#5a8c6a',
            '#6b9d7b',
            '#7cae8c',
            '#8dbf9d',
            '#9ed0ae'
          ]
        }
      ]
    };
  }

  loadScheduleData() {
    this.isLoadingSchedule = true;
    console.log('🔄 Cargando estadísticas de horarios...');
    
    this.scheduleData = {
      title: 'Horarios Más Activos',
      subtitle: 'Distribución de actividad por franja horaria'
    };
    
    this.backendService.getEstadisticasHorarios().subscribe({
      next: (estadisticas: EstadisticasHorarios[]) => {
        console.log('✅ Estadísticas de horarios cargadas:', estadisticas);
        
        // Convertir horas a etiquetas legibles
        const horariosLabels = estadisticas.map(stat => {
          const hora = stat.hora;
          const siguienteHora = hora + 1;
          return `${hora.toString().padStart(2, '0')}:00-${siguienteHora.toString().padStart(2, '0')}:00`;
        });
        
        this.chartData = {
          labels: horariosLabels,
          datasets: [
            {
              label: 'Nivel de Actividad',
              data: estadisticas.map(stat => stat.cantidad),
              backgroundColor: '#4a7c59',
              borderColor: '#5a8c6a',
              borderWidth: 2
            }
          ]
        };
        
        this.isLoadingSchedule = false;
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas de horarios:', error);
        this.isLoadingSchedule = false;
        
        // Fallback a datos mock  
        this.loadScheduleDataFallback();
      }
    });
  }

  private loadScheduleDataFallback() {
    console.log('⚠️ Usando datos mock para horarios');
    this.chartData = {
      labels: ['6:00-9:00', '9:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'],
      datasets: [
        {
          label: 'Nivel de Actividad',
          data: [25, 45, 35, 55, 30],
          backgroundColor: '#4a7c59',
          borderColor: '#5a8c6a',
          borderWidth: 2
        }
      ]
    };
  }

  loadGeneralData() {
    this.chartData = {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      datasets: [
        {
          label: 'Toneladas Recolectadas',
          data: [120, 135, 148, 162, 155, 170],
          backgroundColor: '#4a7c59',
          borderColor: '#5a8c6a',
          borderWidth: 2
        }
      ]
    };
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToAdmin() {
    this.router.navigate(['/admin']);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  getTitle(): string {
    switch(this.selectedType) {
      case 'zona': return 'Dashboard - Zonas Populares';
      case 'basura': return 'Dashboard - Tipos de Residuos';
      case 'horario': return 'Dashboard - Horarios de Actividad';
      default: return 'Dashboard General';
    }
  }

  getSubtitle(): string {
    switch(this.selectedType) {
      case 'zona': return this.zoneData?.subtitle || '';
      case 'basura': return this.wasteData?.subtitle || '';
      case 'horario': return this.scheduleData?.subtitle || '';
      default: return 'Vista general del sistema de gestión ambiental';
    }
  }

  getRecentActivities() {
    return [
      {
        icon: 'pi pi-map-marker text-green-600',
        title: 'Nueva zona detectada',
        description: 'Zona Norte - Sector 4 requiere atención',
        time: 'Hace 5 minutos'
      },
      {
        icon: 'pi pi-trash text-orange-600',
        title: 'Recolección completada',
        description: 'Ruta 15 - 250kg de residuos orgánicos',
        time: 'Hace 15 minutos'
      },
      {
        icon: 'pi pi-exclamation-triangle text-red-600',
        title: 'Alerta de capacidad',
        description: 'Contenedor C-47 al 95% de capacidad',
        time: 'Hace 22 minutos'
      },
      {
        icon: 'pi pi-check-circle text-blue-600',
        title: 'Mantenimiento completado',
        description: 'Vehículo V-12 listo para operación',
        time: 'Hace 1 hora'
      }
    ];
  }
}
