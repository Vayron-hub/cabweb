import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription, forkJoin } from 'rxjs';
import { BackendService, Clasificador, Zona } from '../../services/backend.service';
import { ZonaService, ZonaInfo } from '../../services/zona.service';
import { DialogModule } from 'primeng/dialog';

interface Classifier {
  id: string;
  name: string;
  count: number;
  activeCount: number;
  inactiveCount: number;
  pendingCount: number;
  detections: number;
}

@Component({
  selector: 'app-clasificadores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule
  ],
  templateUrl: './clasificadores.html',
})
export class ClasificadoresComponent implements OnInit, OnDestroy {
  // Datos de clasificadores del backend (solo por zona)
  clasificadoresPorZona: any[] = [];
  isLoadingClasificadores = false;

  newClassifier: Clasificador = {
    nombre: '',
    latitud: 0,
    longitud: 0,
    fechaCreacion: new Date(),
    zonaId: ''
  };

  // Zonas del backend
  zonas: Zona[] = [];
  selectedLocation = '';
  selectedZonaId: string | number = '';
  isLoadingZonas = false;

  // Búsqueda
  classifierSearchTerm = '';
  filteredClassifiers: any[] = [];

  // Suscripciones
  private zonaSubscription: Subscription = new Subscription();

  constructor(
    private backendService: BackendService,
    private zonaService: ZonaService
  ) {
    console.log('🏗️ CLASIFICADORES COMPONENT - Constructor ejecutado');
  }

  ngOnInit() {
    console.log('🚀 CLASIFICADORES COMPONENT - ngOnInit iniciado');
    this.loadZonas();
    this.subscribeToZonaChanges();
    console.log('🚀 CLASIFICADORES COMPONENT - ngOnInit completado');
  }

  ngOnDestroy() {
    this.zonaSubscription.unsubscribe();
  }

  subscribeToZonaChanges() {
    this.zonaSubscription = this.zonaService.selectedZona$.subscribe({
      next: (zonaInfo: ZonaInfo) => {
        console.log('🔄 Cambio de zona detectado:', zonaInfo);
        console.log('🔄 ID de nueva zona:', zonaInfo.id, 'tipo:', typeof zonaInfo.id);
        console.log('🔄 Nombre de nueva zona:', zonaInfo.nombre);
        console.log('🔄 Zona actual en componente:', this.selectedZonaId);

        // Solo actualizar si es una zona válida
        if (zonaInfo.id) {
          console.log('🔄 Actualizando zona de', this.selectedZonaId, 'a', zonaInfo.id);
          this.selectedLocation = zonaInfo.nombre;
          this.selectedZonaId = zonaInfo.id;

          // SIEMPRE cargar clasificadores para la nueva zona
          console.log('📞 Llamando a loadClasificadoresPorZona con ID:', zonaInfo.id);
          this.loadClasificadoresPorZona(zonaInfo.id);
        }
      }
    });
  }

  loadZonas() {
    this.isLoadingZonas = true;
    this.backendService.getZonas().subscribe({
      next: (zonasResponse) => {
        console.log('🌍 Zonas del backend:', zonasResponse);
        console.log('🌍 Tipo de zonasResponse:', typeof zonasResponse);
        console.log('🌍 Es array:', Array.isArray(zonasResponse));

        this.zonas = zonasResponse;
        this.isLoadingZonas = false;

        console.log('📞 Zonas cargadas en clasificadores, esperando selección del admin-layout');
      },
      error: (error) => {
        console.error('❌ Error al cargar zonas:', error);
        this.isLoadingZonas = false;
      }
    });
  }

  loadClasificadoresPorZona(zonaId: string | number) {
    console.log('🔍 CARGANDO CLASIFICADORES PARA ZONA:', zonaId);
    this.newClassifier.zonaId = zonaId;

    // Validar que el zonaId no esté vacío
    if (!zonaId || zonaId === '' || zonaId === 0) {
      console.warn('⚠️ zonaId está vacío, no se puede cargar clasificadores');
      this.clasificadoresPorZona = [];
      this.isLoadingClasificadores = false;
      return;
    }

    this.isLoadingClasificadores = true;

    // Primero obtener los clasificadores
    this.backendService.getClasificadoresPorZona(zonaId).subscribe({
      next: (clasificadores) => {
        console.log('✅ CLASIFICADORES RECIBIDOS:', clasificadores);

        if (!clasificadores || clasificadores.length === 0) {
          console.log('ℹ️ No hay clasificadores para la zona', zonaId);
          this.clasificadoresPorZona = [];
          this.isLoadingClasificadores = false;
          return;
        }

        // Para cada clasificador, obtener sus estadísticas de detecciones usando forkJoin
        const detectionRequests = clasificadores
          .filter(clf => clf.id) // Filtrar clasificadores con ID válido
          .map(clf => this.backendService.getDeteccionesPorClasificador(clf.id!));

        if (detectionRequests.length === 0) {
          // Si no hay clasificadores válidos, mostrar lista vacía
          this.clasificadoresPorZona = [];
          this.isLoadingClasificadores = false;
          return;
        }

        // Ejecutar todas las peticiones en paralelo usando forkJoin
        forkJoin(detectionRequests).subscribe({
          next: (deteccionesStats) => {
            console.log('✅ ESTADÍSTICAS DE DETECCIONES RECIBIDAS:', deteccionesStats);

            // Mapear clasificadores con sus estadísticas reales
            this.clasificadoresPorZona = clasificadores
              .filter(clf => clf.id) // Solo clasificadores con ID válido
              .map((clf: any, index: number) => {
                const stats = deteccionesStats[index] || {
                  valorizable: 0,
                  no_valorizable: 0,
                  organico: 0
                };

                return {
                  id: clf.id,
                  name: clf.nombre,
                  zonaId: clf.zonaId,
                  zona: clf.zona?.nombre || `Zona ${clf.zonaId}`,
                  latitud: clf.latitud,
                  longitud: clf.longitud,
                  fechaCreacion: clf.fechaCreacion,
                  // Mapear las estadísticas del endpoint específico
                  detections: stats.valorizable + stats.no_valorizable + stats.organico,
                  activeCount: stats.organico,           // Orgánico
                  inactiveCount: stats.valorizable,      // Valorizable
                  pendingCount: stats.no_valorizable,    // No Valorizable
                  count: stats.valorizable + stats.no_valorizable + stats.organico
                };
              });

            console.log('🔄 Clasificadores procesados:', this.clasificadoresPorZona.length);
            console.log('🔄 Datos finales:', this.clasificadoresPorZona);

            this.filteredClassifiers = [...this.clasificadoresPorZona];
            this.isLoadingClasificadores = false;
          },
          error: (error) => {
            console.error('❌ ERROR AL CARGAR ESTADÍSTICAS DE DETECCIONES:', error);
            // Si falla, mostrar clasificadores sin estadísticas
            this.clasificadoresPorZona = clasificadores
              .filter(clf => clf.id)
              .map((clf: any) => ({
                id: clf.id,
                name: clf.nombre,
                zonaId: clf.zonaId,
                zona: clf.zona?.nombre || `Zona ${clf.zonaId}`,
                latitud: clf.latitud,
                longitud: clf.longitud,
                fechaCreacion: clf.fechaCreacion,
                detections: 0,
                activeCount: 0,
                inactiveCount: 0,
                pendingCount: 0,
                count: 0
              }));
            this.filteredClassifiers = [...this.clasificadoresPorZona];
            this.isLoadingClasificadores = false;
          }
        });

      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR CLASIFICADORES:', error);
        this.clasificadoresPorZona = [];
        this.isLoadingClasificadores = false;
      }
    });
  }

  filterClassifiers() {
  // Aplicar filtro directamente como en usuarios
  if (!this.classifierSearchTerm.trim()) {
    this.filteredClassifiers = [...this.clasificadoresPorZona];
  } else {
    const searchTerm = this.classifierSearchTerm.toLowerCase().trim();
    this.filteredClassifiers = this.clasificadoresPorZona.filter((classifier: any) =>
      classifier.name?.toLowerCase().includes(searchTerm) ||
      classifier.id?.toString().includes(searchTerm)
    );
  }
}

  // Método para obtener clasificadores de la zona actual (solo backend)
  getCurrentClassifiers() {
    console.log('📋 getCurrentClassifiers llamado:');
    console.log('  - clasificadoresPorZona.length:', this.clasificadoresPorZona.length);
    console.log('  - selectedLocation:', this.selectedLocation);

    // Solo usar datos del backend, sin fallback
    console.log('📋 Usando clasificadores del backend:', this.clasificadoresPorZona.length);
    return this.clasificadoresPorZona;
  }

  // Método para obtener clasificadores filtrados (que se usa en el template)
  getDisplayedClassifiers() {
    console.log('🎯 getDisplayedClassifiers llamado');

    // Si hay término de búsqueda, usar los filtrados
    if (this.classifierSearchTerm.trim()) {
      console.log('🔍 Mostrando clasificadores filtrados:', this.filteredClassifiers.length);
      return this.filteredClassifiers;
    }

    // Si no hay búsqueda, mostrar todos los de la zona actual
    console.log('📋 Mostrando todos los clasificadores:', this.clasificadoresPorZona.length);
    return this.clasificadoresPorZona;
  }

  // Métodos de conteo
  getActiveCount(): number {
    const classifiers = this.getCurrentClassifiers();
    return classifiers.reduce((sum: number, classifier: any) => sum + (classifier.activeCount || 0), 0);
  }

  getTotalCount(): number {
    return this.getCurrentClassifiers().length;
  }

  getTotalDetectionsCount(): number {
    const classifiers = this.getCurrentClassifiers();
    return classifiers.reduce((sum: number, classifier: any) => {
      const activeCount = classifier.activeCount || 0;
      const inactiveCount = classifier.inactiveCount || 0;
      const pendingCount = classifier.pendingCount || 0;
      return sum + activeCount + inactiveCount + pendingCount;
    }, 0);
  }

  // Método para cambiar zona (si se implementa selector de zona)
  onLocationChange(newLocation: string) {
    this.selectedLocation = newLocation;
    const zonaSeleccionada = this.zonas.find(z => z.nombre === newLocation);
    this.selectedZonaId = zonaSeleccionada?.id || '';
    // Cargar clasificadores directamente para la nueva zona
    if (this.selectedZonaId) {
      this.loadClasificadoresPorZona(this.selectedZonaId);
    }
    console.log('Zona seleccionada:', this.selectedLocation, 'ID:', this.selectedZonaId);
  }

  // Métodos de utilidad
  addNewClassifier() {
    console.log('Agregar nuevo clasificador');
    // Implementar modal o navegación para agregar clasificador
  }

  editClassifier(classifier: any) {
    console.log('Editar clasificador:', classifier);
    // Implementar modal o navegación para editar clasificador
  }

  deleteClassifier(classifier: any) {
    if (confirm(`¿Estás seguro de que deseas eliminar el clasificador ${classifier.name}?`)) {
      console.log('Eliminar clasificador:', classifier);
      // Implementar eliminación
    }
  }

  viewDetails(classifier: any) {
    console.log('Ver detalles del clasificador:', classifier);
    // Implementar vista de detalles
  }

  visible: boolean = false;
  showDialog() {
    this.visible = true;
  }
  hideDialog() {
    this.newClassifier = {
      nombre: '',
      latitud: 0,
      longitud: 0,
      fechaCreacion: new Date(),
      zonaId: ''
    };
    this.visible = false;
  }

  postClassifier() {
    this.backendService.createClasificador(this.newClassifier).subscribe({
      next: (response) => {
        console.log('Clasificador creado:', response);
        this.hideDialog();
        this.loadClasificadoresPorZona(this.selectedZonaId);
      },
      error: (error) => {
        console.error('Error al crear clasificador:', error);
      }
    });
  }
}
