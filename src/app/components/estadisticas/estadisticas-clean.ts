import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendService, EstadisticasGenerales, EstadisticasZonas, EstadisticasTipos, EstadisticasHorarios, User } from '../../services/backend.service';
import { ZonaService } from '../../services/zona.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css'
})
export class EstadisticasComponent implements OnInit, OnDestroy {
  selectedLocation: string = ''; // Recibir zona del ZonaService
  
  private zonaSubscription?: Subscription;
  
  isLoadingStats = false;
  
  // Datos del backend - SIN hardcode
  allDetecciones: any[] = [];
  allZonas: any[] = [];
  allUsuarios: any[] = [];
  
  // Datos filtrados por zona
  deteccionesPorHora: number[] = [0, 0, 0, 0];
  clasificacionesExitosas: number[] = [0, 0, 0, 0]; 
  flujoTransporte: number[] = [0, 0, 0, 0];
  actividadUsuarios: number[] = [0, 0, 0, 0];

  // Estadísticas del backend
  estadisticasGenerales?: EstadisticasGenerales;
  estadisticasZonas: EstadisticasZonas[] = [];
  estadisticasTipos: EstadisticasTipos[] = [];
  estadisticasHorarios: EstadisticasHorarios[] = [];

  constructor(
    private backendService: BackendService,
    private cdr: ChangeDetectorRef,
    private zonaService: ZonaService
  ) {}

  ngOnInit() {
    console.log('📊 EstadisticasComponent iniciado');
    
    // Suscribirse a los cambios de zona
    this.zonaSubscription = this.zonaService.selectedZona$.subscribe(zona => {
      console.log('🗺️ Zona recibida del ZonaService:', zona);
      if (zona.nombre && zona.nombre !== this.selectedLocation) {
        this.selectedLocation = zona.nombre;
        console.log(`� Cambiando estadísticas a zona: ${this.selectedLocation}`);
        this.loadDataForSelectedZone();
      }
    });
    
    this.loadBackendData();
  }

  ngOnDestroy() {
    // Limpiar suscripción para evitar memory leaks
    if (this.zonaSubscription) {
      this.zonaSubscription.unsubscribe();
    }
  }

  exportStatisticsData() {
    console.log(`📁 Exportando estadísticas para ${this.selectedLocation}...`);
    // Aquí puedes usar el endpoint /api/reportes/exportar/estadisticas
  }

  refreshStatistics() {
    console.log('🔄 Actualizando estadísticas desde el backend...');
    this.loadDataForSelectedZone(); // Usar método correcto
  }

  // Cargar todos los datos del backend
  private loadBackendData() {
    this.isLoadingStats = true;
    console.log('📊 Cargando datos del backend...');
    
    // Solo cargar todas las zonas y usuarios inicialmente
    // Las detecciones se cargarán específicamente por zona cuando se seleccione

    // Cargar zonas del backend
    this.backendService.getZonas().subscribe({
      next: (zonas: any[]) => {
        console.log('🗺️ Zonas cargadas:', zonas);
        this.allZonas = zonas;
        this.loadDataForSelectedZone(); // Usar método correcto
      },
      error: (error: any) => {
        console.error('❌ Error cargando zonas:', error);
        this.allZonas = [];
      }
    });

    // Cargar usuarios del backend
    this.backendService.getUsuarios().subscribe({
      next: (usuarios: any[]) => {
        console.log('👥 Usuarios cargados:', usuarios);
        this.allUsuarios = usuarios;
        this.generateUserActivityStats(usuarios);
      },
      error: (error: any) => {
        console.error('❌ Error cargando usuarios:', error);
        this.allUsuarios = [];
        this.actividadUsuarios = [0, 0, 0, 0];
      }
    });
    
    setTimeout(() => {
      this.isLoadingStats = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  // Cargar datos específicos para la zona seleccionada usando endpoints reales
  private loadDataForSelectedZone() {
    if (!this.selectedLocation) {
      console.log('⚠️ No hay zona seleccionada');
      this.generateEmptyStats();
      return;
    }

    console.log(`🔍 Cargando datos reales para zona: ${this.selectedLocation}`);
    
    // Encontrar la zona seleccionada
    const zonaSeleccionada = this.allZonas.find(z => z.nombre === this.selectedLocation);
    if (!zonaSeleccionada) {
      console.log(`⚠️ Zona '${this.selectedLocation}' no encontrada en el backend`);
      this.generateEmptyStats();
      return;
    }

    this.isLoadingStats = true;

    // USAR ENDPOINTS REALES ESPECÍFICOS PARA LA ZONA
    this.loadRealStatisticsForZone(zonaSeleccionada);
  }

  // Cargar estadísticas usando endpoints reales del backend para zona específica
  private loadRealStatisticsForZone(zona: any) {
    console.log(`📊 Cargando estadísticas reales desde backend para ${zona.nombre}...`);

    // Inicializar contador de clasificadores
    let clasificadoresCount = 0;
    let deteccionesLoaded = false;
    let clasificadoresLoaded = false;

    // 1. Cargar detecciones específicas de la zona
    this.backendService.getDeteccionesPorZona(zona.id).subscribe({
      next: (detecciones: any[]) => {
        console.log(`✅ Detecciones cargadas para ${zona.nombre}:`, detecciones);
        this.processZoneDetections(detecciones, zona, clasificadoresCount);
        deteccionesLoaded = true;
        
        // Si ambos están cargados, finalizar loading
        if (clasificadoresLoaded) {
          this.finishLoading();
        }
      },
      error: (error: any) => {
        console.error(`❌ Error cargando detecciones para ${zona.nombre}:`, error);
        this.generateEmptyStats();
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      }
    });

    // 2. Cargar clasificadores específicos de la zona
    this.backendService.getClasificadoresPorZona(zona.id).subscribe({
      next: (clasificadores: any[]) => {
        console.log(`✅ Clasificadores cargados para ${zona.nombre}:`, clasificadores);
        clasificadoresCount = clasificadores.length;
        
        // Actualizar las estadísticas con el contador correcto
        if (this.estadisticasGenerales) {
          this.estadisticasGenerales.totalClasificadores = clasificadoresCount;
          console.log(`🔢 Clasificadores actualizados: ${clasificadoresCount}`);
          this.cdr.detectChanges();
        }
        
        clasificadoresLoaded = true;
        
        // Si ambos están cargados, finalizar loading
        if (deteccionesLoaded) {
          this.finishLoading();
        }
      },
      error: (error: any) => {
        console.error(`❌ Error cargando clasificadores para ${zona.nombre}:`, error);
        clasificadoresCount = 0;
        // Actualizar con 0 clasificadores
        if (this.estadisticasGenerales) {
          this.estadisticasGenerales.totalClasificadores = 0;
          this.cdr.detectChanges();
        }
        clasificadoresLoaded = true;
        
        // Si detecciones están cargadas, finalizar loading
        if (deteccionesLoaded) {
          this.finishLoading();
        }
      }
    });

    // 3. Intentar cargar estadísticas específicas por zona (si existen endpoints)
    this.loadZoneSpecificStatistics(zona);
  }

  // Finalizar el estado de carga
  private finishLoading() {
    this.isLoadingStats = false;
    this.cdr.detectChanges();
    console.log(`✅ Carga completada para ${this.selectedLocation}`);
  }

  // Procesar detecciones reales de la zona
  private processZoneDetections(detecciones: any[], zona: any, clasificadoresCount: number = 0) {
    console.log(`📈 Procesando ${detecciones.length} detecciones para ${zona.nombre}...`);
    
    const totalDetecciones = detecciones.length;
    const hoy = new Date().toDateString();
    const deteccionesHoy = detecciones.filter(d => 
      new Date(d.fechaHora).toDateString() === hoy
    ).length;
    
    // Estadísticas generales con datos reales
    this.estadisticasGenerales = {
      totalDetecciones: totalDetecciones,
      deteccionesHoy: deteccionesHoy,
      deteccionesEsteMes: detecciones.filter(d => {
        const fecha = new Date(d.fechaHora);
        const ahora = new Date();
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      }).length,
      usuariosActivos: this.allUsuarios.filter(u => u.activo === true || u.estado === 'activo').length,
      totalUsuarios: this.allUsuarios.length,
      totalClasificadores: clasificadoresCount, // Usar el valor pasado como parámetro
      totalZonas: 1
    };

    // Generar distribuciones reales desde datos del backend
    this.deteccionesPorHora = this.generateRealHourlyDistribution(detecciones);
    this.clasificacionesExitosas = this.generateRealTypeDistribution(detecciones);
    this.estadisticasTipos = this.generateRealTypesFromDetections(detecciones);
    this.estadisticasHorarios = this.generateRealHourlyStats(detecciones);
    
    // Estadísticas de zona (solo la seleccionada)
    this.estadisticasZonas = [{
      id: zona.id,
      nombre: zona.nombre,
      totalClasificadores: 0,
      totalDetecciones: totalDetecciones,
      deteccionesHoy: 0,
      ultimaActividad: null,
      tipoMasComun: null
    }];
    
    // Flujo de transporte basado en detecciones por horas pico
    this.flujoTransporte = this.deteccionesPorHora;
    
    console.log(`✅ Estadísticas reales procesadas para ${zona.nombre} con ${clasificadoresCount} clasificadores`);
    // No finalizar loading aquí - se hace en finishLoading()
    this.cdr.detectChanges();
  }

  // Procesar clasificadores reales de la zona (método simplificado)
  private processZoneClassifiers(clasificadores: any[], zona: any) {
    console.log(`🤖 Procesando ${clasificadores.length} clasificadores para ${zona.nombre}...`);
    
    // Este método ya no necesita actualizar estadísticas - se hace en loadRealStatisticsForZone
    console.log(`✅ Clasificadores procesados para ${zona.nombre}: ${clasificadores.length} encontrados`);
  }

  // Cargar estadísticas específicas por zona usando endpoints dedicados
  private loadZoneSpecificStatistics(zona: any) {
    console.log(`🎯 Intentando cargar estadísticas específicas para zona ${zona.nombre}...`);

    // Usar endpoints generales ya que no hay específicos por zona
    this.backendService.getEstadisticasZonas().subscribe({
      next: (todasLasZonas: any[]) => {
        const estadisticasZona = todasLasZonas.find(z => z.id === zona.id);
        if (estadisticasZona) {
          console.log(`✅ Estadísticas específicas cargadas para ${zona.nombre}:`, estadisticasZona);
          // Combinar con estadísticas ya calculadas
          if (this.estadisticasGenerales) {
            this.estadisticasGenerales = { ...this.estadisticasGenerales, ...estadisticasZona };
          }
          this.cdr.detectChanges();
        }
      },
      error: (error: any) => {
        console.log(`ℹ️ No hay estadísticas específicas para ${zona.nombre} (normal si el endpoint no existe)`);
        // No es un error crítico - las estadísticas ya están calculadas desde detecciones
      }
    });

    // Cargar estadísticas de tipos usando endpoint general
    this.backendService.getEstadisticasTipos().subscribe({
      next: (tipos: any[]) => {
        console.log(`✅ Tipos cargados para filtrar por ${zona.nombre}:`, tipos);
        // Los tipos se pueden filtrar por zona en el frontend si es necesario
        this.estadisticasTipos = tipos;
        this.clasificacionesExitosas = tipos.map(t => t.cantidad || 0);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.log(`ℹ️ No hay tipos disponibles (usando datos calculados)`);
        // No es un error crítico - los tipos ya están calculados desde detecciones
      }
    });

    // Cargar estadísticas de horarios usando endpoint general
    this.backendService.getEstadisticasHorarios().subscribe({
      next: (horarios: any[]) => {
        console.log(`✅ Horarios cargados para filtrar por ${zona.nombre}:`, horarios);
        // Los horarios se pueden filtrar por zona en el frontend si es necesario
        if (horarios && horarios.length > 0) {
          this.estadisticasHorarios = horarios;
        }
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.log(`ℹ️ No hay horarios disponibles (usando datos calculados)`);
        // No es un error crítico - los horarios ya están calculados desde detecciones
      }
    });
  }

  // Generar estadísticas vacías cuando no hay datos
  private generateEmptyStats() {
    console.log(`🔄 Generando estadísticas vacías para ${this.selectedLocation}`);
    
    this.estadisticasGenerales = {
      totalDetecciones: 0,
      deteccionesHoy: 0,
      deteccionesEsteMes: 0,
      usuariosActivos: 0,
      totalUsuarios: this.allUsuarios.length,
      totalClasificadores: 0, // Siempre inicializar en 0
      totalZonas: 1
    };
    
    this.deteccionesPorHora = [0, 0, 0, 0];
    this.clasificacionesExitosas = [0, 0, 0, 0];
    this.flujoTransporte = [0, 0, 0, 0];
    this.estadisticasTipos = [];
    this.estadisticasZonas = [];
    this.estadisticasHorarios = [];
    
    this.isLoadingStats = false;
    this.cdr.detectChanges();
    console.log(`✅ Estadísticas vacías generadas para ${this.selectedLocation}`);
  }

  // Método para cargar estadísticas usando endpoints EXISTENTES del backend
  private loadRealStatistics() {
    this.isLoadingStats = true;
    console.log('📊 Cargando estadísticas usando endpoints existentes...');
    
    // Usar datos de detecciones existentes para generar estadísticas
    this.backendService.getDetecciones().subscribe({
      next: (detecciones: any[]) => {
        console.log('✅ Detecciones cargadas:', detecciones);
        this.allDetecciones = detecciones; // Guardar todas las detecciones
        // Filtrar datos por zona usando método correcto
        this.loadDataForSelectedZone();
      },
      error: (error: any) => {
        console.error('❌ Error cargando detecciones:', error);
        this.generateMockStatistics();
      }
    });

    // Cargar zonas para estadísticas por zonas y selector
    this.backendService.getZonas().subscribe({
      next: (zonas: any[]) => {
        console.log('🗺️ Zonas cargadas para estadísticas:', zonas);
        this.allZonas = zonas; // Guardar todas las zonas
        // Zonas ya están cargadas para estadísticas
        this.generateZoneStatistics(zonas);
      },
      error: (error: any) => {
        console.error('❌ Error cargando zonas:', error);
        // Generar estadísticas vacías en caso de error
        this.generateEmptyStats();
      }
    });

    // Cargar usuarios para estadísticas de actividad
    this.backendService.getUsuarios().subscribe({
      next: (usuarios: any[]) => {
        console.log('� Usuarios cargados para estadísticas:', usuarios);
        this.generateUserStatistics(usuarios);
      },
      error: (error: any) => {
        console.error('❌ Error cargando usuarios:', error);
        this.actividadUsuarios = [2, 8, 12, 5]; // Valores por defecto
      }
    });
    
    setTimeout(() => {
      this.isLoadingStats = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  // Generar estadísticas desde detecciones reales (filtradas por zona)
  private generateStatisticsFromDetections(detecciones: any[]) {
    console.log(`📈 Generando estadísticas desde detecciones de ${this.selectedLocation}...`);
    
    // Filtrar detecciones por zona seleccionada
    const zonaSeleccionada = this.allZonas.find(z => z.nombre === this.selectedLocation);
    const deteccionesFiltradas = detecciones.filter(d => {
      return d.id === zonaSeleccionada?.id || 
             d.zona === this.selectedLocation ||
             d.ubicacion === this.selectedLocation;
    });
    
    console.log(`🔍 Detecciones filtradas para ${this.selectedLocation}:`, deteccionesFiltradas);
    
    // Simular estadísticas generales basadas en detecciones filtradas
    const totalDetecciones = deteccionesFiltradas.length;
    const hoy = new Date().toDateString();
    const deteccionesHoy = deteccionesFiltradas.filter(d => 
      new Date(d.fechaHora || d.fecha).toDateString() === hoy
    ).length;
    
    this.estadisticasGenerales = {
      totalDetecciones: totalDetecciones,
      deteccionesHoy: deteccionesHoy,
      deteccionesEsteMes: Math.floor(totalDetecciones * 0.8),
      usuariosActivos: Math.floor(totalDetecciones * 0.1) || 5, // Proporción basada en detecciones
      totalUsuarios: 25,
      totalClasificadores: this.getClassifiersInZone(),
      totalZonas: 1 // Solo mostramos la zona seleccionada
    };

    // Generar distribución por horas (6AM, 12PM, 6PM, 12AM) para la zona
    this.deteccionesPorHora = this.generateHourlyDistribution(deteccionesFiltradas);
    
    // Generar clasificaciones por tipo para la zona
    this.clasificacionesExitosas = this.generateTypeDistribution(deteccionesFiltradas);
    
    // Generar estadísticas de tipos para gráficos avanzados
    this.estadisticasTipos = this.generateTiposFromDetections(deteccionesFiltradas);
    
    console.log(`✅ Estadísticas generadas para ${this.selectedLocation}:`, {
      generales: this.estadisticasGenerales,
      porHora: this.deteccionesPorHora,
      clasificaciones: this.clasificacionesExitosas,
      tipos: this.estadisticasTipos
    });
  }

  // Obtener número de clasificadores en la zona seleccionada
  private getClassifiersInZone(): number {
    // Simular clasificadores según la zona
    const classifiersByZone: { [key: string]: number } = {
      'Edificio A': 3,
      'Edificio B': 4,
      'Edificio C': 2,
      'Edificio D': 5,
      'Cafetería': 2,
      'Almacén': 3
    };
    
    return classifiersByZone[this.selectedLocation] || 2;
  }

  private generateHourlyDistribution(detecciones: any[]): number[] {
    const hours = [6, 12, 18, 0]; // 6AM, 12PM, 6PM, 12AM
    return hours.map(targetHour => {
      return detecciones.filter(d => {
        const date = new Date(d.fechaHora || d.fecha);
        const hour = date.getHours();
        // Contar detecciones en un rango de ±2 horas
        return Math.abs(hour - targetHour) <= 2 || 
               (targetHour === 0 && (hour >= 22 || hour <= 2));
      }).length;
    });
  }

  private generateTypeDistribution(detecciones: any[]): number[] {
    const tipos = ['Valorizable', 'Orgánico', 'No Valorizable', 'Mixto'];
    return tipos.map(tipo => {
      return detecciones.filter(d => 
        d.tipo && d.tipo.toLowerCase().includes(tipo.toLowerCase())
      ).length || Math.floor(Math.random() * 15) + 5; // Fallback con datos simulados
    });
  }

  private generateTiposFromDetections(detecciones: any[]): EstadisticasTipos[] {
    const tiposMap = new Map<string, number>();
    
    detecciones.forEach(d => {
      const tipo = d.tipo || 'No Clasificado';
      tiposMap.set(tipo, (tiposMap.get(tipo) || 0) + 1);
    });

    const total = detecciones.length || 1;
    const result: EstadisticasTipos[] = [];
    
    tiposMap.forEach((cantidad, tipo) => {
      result.push({
        tipo: tipo,
        cantidad: cantidad,
        porcentaje: Math.round((cantidad / total) * 100)
      });
    });

    // Si no hay datos reales, generar datos de ejemplo
    if (result.length === 0) {
      result.push(
        { tipo: 'Valorizable', cantidad: 45, porcentaje: 45 },
        { tipo: 'Orgánico', cantidad: 30, porcentaje: 30 },
        { tipo: 'No Valorizable', cantidad: 20, porcentaje: 20 },
        { tipo: 'Mixto', cantidad: 5, porcentaje: 5 }
      );
    }

    return result.sort((a, b) => b.cantidad - a.cantidad);
  }

  private generateZoneStatistics(zonas: any[]) {
    console.log('🗺️ Generando estadísticas de zonas...');
    
    this.estadisticasZonas = zonas.map((zona, index) => ({
      id: zona.id,
      nombre: zona.nombre,
      totalClasificadores: Math.floor(Math.random() * 10) + 3, // Simulado
      totalDetecciones: Math.floor(Math.random() * 50) + 10, // Simulado
      deteccionesHoy: Math.floor(Math.random() * 20) + 2, // Simulado
      ultimaActividad: new Date().toISOString(),
      tipoMasComun: ['Valorizable', 'Orgánico', 'No Valorizable'][Math.floor(Math.random() * 3)]
    }));

    // Actualizar flujo de transporte con datos de zonas
    this.flujoTransporte = this.estadisticasZonas
      .slice(0, 4)
      .map(zona => zona.totalDetecciones);
      
    console.log('✅ Estadísticas de zonas generadas:', this.estadisticasZonas);
  }

  private generateUserStatistics(usuarios: any[]) {
    console.log('👥 Generando estadísticas de usuarios...');
    
    const total = usuarios.length;
    // Distribución simulada por tipo de usuario
    this.actividadUsuarios = [
      Math.floor(total * 0.1), // Admin (10%)
      Math.floor(total * 0.3), // Operarios (30%)  
      Math.floor(total * 0.4), // Visualizadores (40%)
      Math.floor(total * 0.2)  // Invitados (20%)
    ];
    
    console.log('✅ Estadísticas de usuarios generadas:', this.actividadUsuarios);
  }

  // Generar datos simulados si no hay datos reales (específicos por zona)
  private generateMockStatistics() {
    console.log(`🎭 Generando estadísticas simuladas para ${this.selectedLocation}...`);
    
    // Datos base según la zona seleccionada
    const dataByZone: { [key: string]: any } = {
      'Edificio A': { base: 800, multiplier: 0.8, efficiency: 0.85 },
      'Edificio B': { base: 1200, multiplier: 1.2, efficiency: 0.90 },
      'Edificio C': { base: 600, multiplier: 0.6, efficiency: 0.75 },
      'Edificio D': { base: 1500, multiplier: 1.5, efficiency: 0.95 },
      'Cafetería': { base: 400, multiplier: 0.4, efficiency: 0.70 },
      'Almacén': { base: 300, multiplier: 0.3, efficiency: 0.65 }
    };
    
    const zoneData = dataByZone[this.selectedLocation] || dataByZone['Edificio D'];
    
    this.estadisticasGenerales = {
      totalDetecciones: Math.floor(zoneData.base * zoneData.multiplier),
      deteccionesHoy: Math.floor(45 * zoneData.multiplier),
      deteccionesEsteMes: Math.floor(890 * zoneData.multiplier),
      usuariosActivos: Math.floor(25 * zoneData.efficiency),
      totalUsuarios: 25,
      totalClasificadores: this.getClassifiersInZone(),
      totalZonas: 1 // Solo la zona seleccionada
    };

    this.deteccionesPorHora = [
      Math.floor(12 * zoneData.multiplier), 
      Math.floor(28 * zoneData.multiplier), 
      Math.floor(35 * zoneData.multiplier), 
      Math.floor(18 * zoneData.multiplier)
    ];
    
    this.clasificacionesExitosas = [
      Math.floor(45 * zoneData.efficiency), 
      Math.floor(30 * zoneData.efficiency), 
      Math.floor(20 * zoneData.efficiency), 
      Math.floor(8 * zoneData.efficiency)
    ];
    
    this.flujoTransporte = [
      Math.floor(25 * zoneData.multiplier), 
      Math.floor(35 * zoneData.multiplier), 
      Math.floor(40 * zoneData.multiplier), 
      Math.floor(22 * zoneData.multiplier)
    ];
    
    this.actividadUsuarios = [3, 8, 12, 5];

    this.estadisticasTipos = [
      { tipo: 'Valorizable', cantidad: Math.floor(45 * zoneData.multiplier), porcentaje: 45 },
      { tipo: 'Orgánico', cantidad: Math.floor(30 * zoneData.multiplier), porcentaje: 30 },
      { tipo: 'No Valorizable', cantidad: Math.floor(20 * zoneData.multiplier), porcentaje: 20 },
      { tipo: 'Mixto', cantidad: Math.floor(5 * zoneData.multiplier), porcentaje: 5 }
    ];

    // Solo mostrar la zona seleccionada en estadísticas de zonas
    this.estadisticasZonas = [
      { 
        id: 1, 
        nombre: this.selectedLocation,
        totalClasificadores: Math.floor(zoneData.multiplier * 5) + 2,
        totalDetecciones: Math.floor(zoneData.base * zoneData.multiplier),
        deteccionesHoy: Math.floor(zoneData.multiplier * 10) + 3,
        ultimaActividad: new Date().toISOString(),
        tipoMasComun: 'Valorizable'
      }
    ];
    
    console.log(`✅ Estadísticas simuladas generadas para ${this.selectedLocation}`);
  }

  // =================== MÉTODOS PARA LAS NUEVAS GRÁFICAS ===================

  // KPIs Methods - Usando datos reales del backend
  getActiveClassifiersCount(): number {
    // Usar datos reales de estadísticas generales (se actualiza desde loadRealStatisticsForZone)
    const count = this.estadisticasGenerales?.totalClasificadores || 0;
    console.log(`🔢 getActiveClassifiersCount() llamado para ${this.selectedLocation}: ${count} clasificadores`);
    return count;
  }

  getActiveZonesCount(): number {
    return 1; // Solo mostramos la zona seleccionada
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

  // Heatmap Methods - Actualizado para usar datos simulados
  getMaxCantidad(): number {
    // Si no tenemos datos de horarios reales, simular
    if (!this.estadisticasHorarios || this.estadisticasHorarios.length === 0) {
      this.estadisticasHorarios = this.generateMockHorarios();
    }
    return Math.max(...this.estadisticasHorarios.map(h => h.cantidad), 1);
  }

  private generateMockHorarios(): EstadisticasHorarios[] {
    const horarios: EstadisticasHorarios[] = [];
    for (let hora = 0; hora < 24; hora++) {
      horarios.push({
        hora: hora,
        cantidad: Math.floor(Math.random() * 20) + 1, // 1-20 detecciones por hora
        porcentaje: Math.floor(Math.random() * 10) + 1 // Porcentaje simulado
      });
    }
    return horarios;
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

  // Trend Analysis Methods
  getAverageDetections(): number {
    if (!this.estadisticasGenerales) return 0;
    return Math.floor((this.estadisticasGenerales.totalDetecciones + this.estadisticasGenerales.deteccionesHoy) / 2);
  }

  getMaxDetections(): number {
    if (!this.estadisticasGenerales) return 0;
    return Math.max(this.estadisticasGenerales.totalDetecciones, this.estadisticasGenerales.deteccionesHoy);
  }

  getTrendDirection(): number {
    if (!this.estadisticasGenerales) return 0;
    return this.estadisticasGenerales.deteccionesHoy - this.estadisticasGenerales.deteccionesEsteMes / 30;
  }

  // =================== MÉTODOS PARA DATOS REALES DEL BACKEND ===================

  // Generar distribución horaria real desde detecciones (usando campo real fechaHora)
  private generateRealHourlyDistribution(detecciones: any[]): number[] {
    const hours = [6, 12, 18, 0]; // 6AM, 12PM, 6PM, 12AM
    return hours.map(targetHour => {
      return detecciones.filter(d => {
        const date = new Date(d.fechaHora); // Usar campo real del backend
        const hour = date.getHours();
        // Contar detecciones en un rango de ±2 horas
        return Math.abs(hour - targetHour) <= 2 || 
               (targetHour === 0 && (hour >= 22 || hour <= 2));
      }).length;
    });
  }

  // Generar tipos reales desde detecciones (usando estructura real del backend)
  private generateRealTypesFromDetections(detecciones: any[]): EstadisticasTipos[] {
    const tiposMap = new Map<string, number>();
    
    detecciones.forEach(d => {
      let tipo = d.tipo || 'No Clasificado';
      // Corregir el typo del backend
      if (tipo === 'No Valorizanble') {
        tipo = 'No Valorizable';
      }
      tiposMap.set(tipo, (tiposMap.get(tipo) || 0) + 1);
    });

    const total = detecciones.length || 1;
    const result: EstadisticasTipos[] = [];
    
    tiposMap.forEach((cantidad, tipo) => {
      result.push({
        tipo: tipo,
        cantidad: cantidad,
        porcentaje: Math.round((cantidad / total) * 100)
      });
    });

    // Si no hay datos reales, mostrar estructura vacía
    if (result.length === 0) {
      result.push(
        { tipo: 'Valorizable', cantidad: 0, porcentaje: 0 },
        { tipo: 'Organico', cantidad: 0, porcentaje: 0 },
        { tipo: 'No Valorizable', cantidad: 0, porcentaje: 0 }
      );
    }

    return result.sort((a, b) => b.cantidad - a.cantidad);
  }

  // Generar distribución de tipos real (usando tipos correctos del backend)
  private generateRealTypeDistribution(detecciones: any[]): number[] {
    const tiposReales = ['Valorizable', 'Organico', 'No Valorizable']; // SIN "Mixto"
    return tiposReales.map(tipo => {
      return detecciones.filter(d => {
        const detectionType = d.tipo || '';
        // Manejar el typo "No Valorizanble" del backend
        if (tipo === 'No Valorizable' && detectionType === 'No Valorizanble') {
          return true;
        }
        return detectionType === tipo;
      }).length;
    });
  }

  // Generar estadísticas horarias reales (usando campo real fechaHora)
  private generateRealHourlyStats(detecciones: any[]): EstadisticasHorarios[] {
    const horarios: EstadisticasHorarios[] = [];
    
    for (let hora = 0; hora < 24; hora++) {
      const deteccionesHora = detecciones.filter(d => {
        const date = new Date(d.fechaHora); // Usar campo real del backend
        return date.getHours() === hora;
      }).length;
      
      const totalDetecciones = detecciones.length || 1;
      const porcentaje = Math.round((deteccionesHora / totalDetecciones) * 100);
      
      horarios.push({
        hora: hora,
        cantidad: deteccionesHora,
        porcentaje: porcentaje
      });
    }
    
    return horarios;
  }

  // Generar estadísticas de actividad de usuarios
  private generateUserActivityStats(usuarios: any[]) {
    console.log('👥 Generando estadísticas de actividad de usuarios...');
    
    const total = usuarios.length;
    if (total === 0) {
      this.actividadUsuarios = [0, 0, 0, 0];
      return;
    }
    
    // Contar usuarios por rol real
    const roleCount = {
      admin: usuarios.filter(u => u.rol && u.rol.toLowerCase().includes('admin')).length,
      operario: usuarios.filter(u => u.rol && u.rol.toLowerCase().includes('operario')).length,
      visualizador: usuarios.filter(u => u.rol && u.rol.toLowerCase().includes('visualizador')).length,
      otros: 0
    };
    
    roleCount.otros = total - roleCount.admin - roleCount.operario - roleCount.visualizador;
    
    this.actividadUsuarios = [
      roleCount.admin,
      roleCount.operario,
      roleCount.visualizador,
      roleCount.otros
    ];
    
    console.log('✅ Estadísticas de usuarios generadas:', this.actividadUsuarios);
  }
}