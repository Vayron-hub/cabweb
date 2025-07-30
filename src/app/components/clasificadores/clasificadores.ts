import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { BackendService, Zona } from '../../services/backend.service';
import { ZonaService, ZonaInfo } from '../../services/zona.service';

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
    InputTextModule
  ],
  templateUrl: './clasificadores.html',
  styleUrl: './clasificadores.css'
})
export class ClasificadoresComponent implements OnInit, OnDestroy {
  // Datos de clasificadores del backend (solo por zona)
  clasificadoresPorZona: any[] = [];
  isLoadingClasificadores = false;
  
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
    
    // Validar que el zonaId no esté vacío
    if (!zonaId || zonaId === '' || zonaId === 0) {
      console.warn('⚠️ zonaId está vacío, no se puede cargar clasificadores');
      this.clasificadoresPorZona = [];
      this.isLoadingClasificadores = false;
      return;
    }
    
    this.isLoadingClasificadores = true;
    
    // Obtener clasificadores y detecciones en paralelo
    Promise.all([
      this.backendService.getClasificadoresPorZona(zonaId).toPromise(),
      this.backendService.getDeteccionesPorZona(zonaId).toPromise()
    ]).then(([clasificadores, detecciones]) => {
      console.log('✅ CLASIFICADORES RECIBIDOS:', clasificadores);
      console.log('✅ DETECCIONES RECIBIDAS:', detecciones);
      
      if (!clasificadores || clasificadores.length === 0) {
        console.log('ℹ️ No hay clasificadores para la zona', zonaId);
        this.clasificadoresPorZona = [];
      } else {
        // Crear un mapa de conteos de detecciones por clasificador
        const deteccionesMap = new Map();
        
        if (detecciones && detecciones.length > 0) {
          detecciones.forEach((deteccion: any) => {
            const clasificadorId = deteccion.clasificadorId;
            if (!deteccionesMap.has(clasificadorId)) {
              deteccionesMap.set(clasificadorId, {
                total: 0,
                organico: 0,
                valorizable: 0,
                noValorizable: 0
              });
            }
            
            const stats = deteccionesMap.get(clasificadorId);
            stats.total++;
            
            switch(deteccion.tipo) {
              case 'Organico':
                stats.organico++;
                break;
              case 'Valorizable':
                stats.valorizable++;
                break;
              case 'No Valorizable':
              case 'No Valorizanble': // Por si hay typo en la BD
                stats.noValorizable++;
                break;
            }
          });
        }
        
        // Mapear clasificadores con sus estadísticas reales
        this.clasificadoresPorZona = clasificadores.map((clf: any) => {
          const stats = deteccionesMap.get(clf.id) || {
            total: 0, organico: 0, valorizable: 0, noValorizable: 0
          };
          
          return {
            id: clf.id,
            name: clf.nombre,
            zonaId: clf.zonaId,
            zona: clf.zona?.nombre || `Zona ${clf.zonaId}`,
            latitud: clf.latitud,
            longitud: clf.longitud,
            fechaCreacion: clf.fechaCreacion,
            // Estadísticas reales de detecciones
            detections: stats.total,
            activeCount: stats.organico,
            inactiveCount: stats.valorizable,
            pendingCount: stats.noValorizable,
            count: stats.total
          };
        });
      }
      
      console.log('🔄 Clasificadores procesados:', this.clasificadoresPorZona.length);
      console.log('🔄 Datos finales:', this.clasificadoresPorZona);
      
      this.applySearchFilter();
      this.isLoadingClasificadores = false;
    }).catch((error) => {
      console.error('❌ ERROR AL CARGAR DATOS:', error);
      this.clasificadoresPorZona = [];
      this.isLoadingClasificadores = false;
    });
  }

  filterClassifiers() {
    this.applySearchFilter();
  }

  applySearchFilter() {
    const currentClassifiers = this.getCurrentClassifiers();
    
    if (!this.classifierSearchTerm.trim()) {
      this.filteredClassifiers = currentClassifiers;
    } else {
      const searchTerm = this.classifierSearchTerm.toLowerCase().trim();
      this.filteredClassifiers = currentClassifiers.filter((classifier: any) =>
        classifier.name?.toLowerCase().includes(searchTerm) ||
        classifier.id?.toLowerCase().includes(searchTerm)
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
    const current = this.getCurrentClassifiers();
    console.log('🎯 getDisplayedClassifiers:', current.length, 'clasificadores');
    
    if (this.classifierSearchTerm.trim()) {
      console.log('🔍 Aplicando filtro de búsqueda:', this.classifierSearchTerm);
      return this.filteredClassifiers;
    }
    return current;
  }

  // Métodos de conteo
  getActiveCount(): number {
    const classifiers = this.getCurrentClassifiers();
    return classifiers.reduce((sum: number, classifier: any) => sum + (classifier.activeCount || 0), 0);
  }

  getTotalCount(): number {
    return this.getCurrentClassifiers().length;
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
}
