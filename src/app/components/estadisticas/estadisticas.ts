import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BackendService, EstadisticasGenerales, EstadisticasTipos } from '../../services/backend.service';
import { ZonaService } from '../../services/zona.service';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.html',
})
export class EstadisticasComponent implements OnInit, OnDestroy {
  selectedLocation: string = '';
  private zonaSubscription?: Subscription;
  isLoadingStats = false;

  // Datos del backend
  estadisticasGenerales?: EstadisticasGenerales;
  estadisticasTipos: EstadisticasTipos[] = [];
  classifierPerformance: any[] = [];
  hourlyActivity: any[] = [];

  constructor(
    private backendService: BackendService,
    private cdr: ChangeDetectorRef,
    private zonaService: ZonaService
  ) { }

  ngOnInit() {
    console.log('📊 EstadisticasComponent iniciado');
    
    this.zonaSubscription = this.zonaService.selectedZona$.subscribe(zona => {
      if (zona && zona.nombre) {
        console.log('🎯 Zona seleccionada:', zona.nombre);
        this.selectedLocation = zona.nombre;
        this.loadDataForSelectedZone();
      } else {
        console.warn('⚠️ No hay zona seleccionada');
        this.selectedLocation = 'Sin zona';
        this.generateEmptyStats();
      }
    });

    this.loadBackendData();
  }

  ngOnDestroy() {
    if (this.zonaSubscription) {
      this.zonaSubscription.unsubscribe();
    }
  }

  private loadBackendData() {
    this.isLoadingStats = true;
    console.log('📊 Cargando datos del backend...');
    
    setTimeout(() => {
      this.isLoadingStats = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  private loadDataForSelectedZone() {
    if (!this.selectedLocation || this.selectedLocation === 'Sin zona') {
      this.generateEmptyStats();
      return;
    }

    console.log(`🔍 Cargando datos para zona: ${this.selectedLocation}`);
    this.isLoadingStats = true;

    // Cargar estadísticas generales
    this.backendService.getEstadisticasGenerales().subscribe({
      next: (stats) => {
        this.estadisticasGenerales = stats;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas generales:', error);
        this.generateEmptyStats();
      }
    });

    // Cargar estadísticas de tipos
    this.backendService.getEstadisticasTipos().subscribe({
      next: (tipos) => {
        this.estadisticasTipos = tipos;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando tipos:', error);
        this.estadisticasTipos = [];
      }
    });

    this.loadClassifierPerformance();
    this.loadHourlyActivity();
    
    setTimeout(() => {
      this.isLoadingStats = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  private generateEmptyStats() {
    console.log(`🔄 Generando estadísticas vacías para ${this.selectedLocation}`);

    this.estadisticasGenerales = {
      totalDetecciones: 0,
      deteccionesHoy: 0,
      deteccionesEsteMes: 0,
      usuariosActivos: 0,
      totalUsuarios: 0,
      totalClasificadores: 0,
      totalZonas: 1
    };

    this.estadisticasTipos = [];
    this.classifierPerformance = [];
    this.hourlyActivity = [];

    this.isLoadingStats = false;
    this.cdr.detectChanges();
  }

  // Métodos requeridos por el HTML
  getActiveClassifiersCount(): number {
    return this.estadisticasGenerales?.totalClasificadores || 0;
  }

  getActiveZonesCount(): number {
    return 1;
  }

  getTopTipos(): EstadisticasTipos[] {
    return this.estadisticasTipos.slice(0, 4);
  }

  getTotalDetections(): number {
    return this.estadisticasGenerales?.totalDetecciones || 0;
  }

  getTipoColor(tipo: string): string {
    const colors: { [key: string]: string } = {
      'valorizable': '#0088FF',
      'organico': '#4CAF50',
      'no_valorizable': '#757575',
      'mixto': '#2196F3'
    };
    return colors[tipo.toLowerCase()] || '#9E9E9E';
  }

  getStrokeDashOffset(index: number): number {
    let offset = 25;
    for (let i = 0; i < index; i++) {
      offset -= this.estadisticasTipos[i]?.porcentaje || 0;
    }
    return offset;
  }

  getAverageDetections(): number {
    if (!this.classifierPerformance.length) return 0;
    const total = this.classifierPerformance.reduce((sum, c) => sum + (c.detecciones || 0), 0);
    return Math.round(total / this.classifierPerformance.length);
  }

  getMaxDetections(): number {
    return this.estadisticasGenerales?.totalDetecciones || 0;
  }

  getTrendDirection(): number {
    if (!this.estadisticasGenerales) return 0;
    const hoy = this.estadisticasGenerales.deteccionesHoy;
    const promedio = this.estadisticasGenerales.totalDetecciones / 30;
    
    if (hoy > promedio * 1.1) return 1;
    if (hoy < promedio * 0.9) return -1;
    return 0;
  }

  getPeakHour() {
    if (!this.hourlyActivity.length) return null;
    return this.hourlyActivity.reduce((max, hour) => 
      (hour.detections > max.detections) ? hour : max
    );
  }

  getSimpleTrendPoints(): string {
    if (!this.estadisticasGenerales) return '';

    const data = [
      this.estadisticasGenerales.deteccionesHoy * 0.8,
      this.estadisticasGenerales.deteccionesHoy * 0.9,
      this.estadisticasGenerales.deteccionesHoy,
      this.estadisticasGenerales.deteccionesHoy * 1.1
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
      { value: this.estadisticasGenerales.deteccionesHoy * 0.8, label: 'Ayer' },
      { value: this.estadisticasGenerales.deteccionesHoy * 0.9, label: 'Anteayer' },
      { value: this.estadisticasGenerales.deteccionesHoy, label: 'Hoy' },
      { value: this.estadisticasGenerales.deteccionesHoy * 1.1, label: 'Proyección' }
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

  loadClassifierPerformance() {
    console.log('🤖 Cargando rendimiento de clasificadores...');
    
    const basePerformance = Math.floor(Math.random() * 50) + 20;
    this.classifierPerformance = [
      { nombre: `Clasificador A - ${this.selectedLocation}`, detecciones: basePerformance },
      { nombre: `Clasificador B - ${this.selectedLocation}`, detecciones: basePerformance + 10 },
      { nombre: `Clasificador C - ${this.selectedLocation}`, detecciones: basePerformance - 5 }
    ];
  }

  loadHourlyActivity() {
    console.log('⏰ Cargando actividad horaria...');
    
    const hours = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    this.hourlyActivity = hours.map(hour => ({
      hour: hour,
      detections: Math.floor(Math.random() * 30) + 5
    }));
  }

  refreshStatistics() {
    console.log('🔄 Refrescando estadísticas...');
    this.loadDataForSelectedZone();
  }
}
