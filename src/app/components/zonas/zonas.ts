import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { Subscription } from 'rxjs';
import { BackendService, Zona } from '../../services/backend.service';

interface NewZona {
  nombre: string;
  descripcion: string;
  latitud?: number;
  longitud?: number;
  area?: number;
  estado: string;
}

@Component({
  selector: 'app-zonas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CheckboxModule
  ],
  templateUrl: './zonas.html',
})
export class ZonasComponent implements OnInit, OnDestroy {
  // Datos de zonas
  allZones: Zona[] = [];
  filteredZones: Zona[] = [];
  isLoadingZonas = false;

  // Nueva zona
  newZona: NewZona = {
    nombre: '',
    descripcion: '',
    latitud: undefined,
    longitud: undefined,
    area: undefined,
    estado: 'activa'
  };

  // Búsqueda y filtros
  zoneSearchTerm = '';
  selectedZones: (string | number)[] = [];

  // Modal
  visible: boolean = false;

  constructor(
    private backendService: BackendService
  ) {
    console.log('🏗️ ZONAS COMPONENT - Constructor ejecutado');
  }

  ngOnInit() {
    console.log('🚀 ZONAS COMPONENT - ngOnInit iniciado');
    this.loadZones();
    console.log('🚀 ZONAS COMPONENT - ngOnInit completado');
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  loadZones() {
    console.log('🔍 CARGANDO ZONAS DEL BACKEND...');
    this.isLoadingZonas = true;

    this.backendService.getZonas().subscribe({
      next: (zonas) => {
        console.log('✅ ZONAS RECIBIDAS:', zonas);
        this.allZones = zonas.map(zona => ({
          ...zona,
          estado: zona.estado || 'activa' // Valor por defecto
        }));
        this.filteredZones = [...this.allZones];
        this.isLoadingZonas = false;
        console.log('🔄 Zonas procesadas:', this.allZones.length);
      },
      error: (error) => {
        console.error('❌ ERROR AL CARGAR ZONAS:', error);
        this.allZones = [];
        this.filteredZones = [];
        this.isLoadingZonas = false;
      }
    });
  }

  postZona() {
    console.log('📝 CREANDO NUEVA ZONA:', this.newZona);

    // Validaciones básicas
    if (!this.newZona.nombre.trim()) {
      alert('El nombre de la zona es obligatorio');
      return;
    }

    if (!this.newZona.descripcion.trim()) {
      alert('La descripción de la zona es obligatoria');
      return;
    }

    // Verificar si ya existe una zona con el mismo nombre
    if (this.allZones.some(zona => zona.nombre.toLowerCase() === this.newZona.nombre.toLowerCase())) {
      alert('Ya existe una zona con ese nombre');
      return;
    }

    this.backendService.createZona(this.newZona).subscribe({
      next: (response) => {
        console.log('✅ Zona creada:', response);
        this.hideDialog();
        this.loadZones(); // Recargar la lista
        alert('Zona creada exitosamente');
      },
      error: (error) => {
        console.error('❌ Error al crear zona:', error);
        alert('Error al crear la zona. Por favor, intenta nuevamente.');
      }
    });
  }

  filterZones() {
    if (!this.zoneSearchTerm.trim()) {
      this.filteredZones = [...this.allZones];
    } else {
      const searchTerm = this.zoneSearchTerm.toLowerCase().trim();
      this.filteredZones = this.allZones.filter((zone) =>
        zone.nombre?.toLowerCase().includes(searchTerm) ||
        zone.descripcion?.toLowerCase().includes(searchTerm) ||
        zone.id?.toString().includes(searchTerm)
      );
    }
  }

  // Métodos de visualización
  getDisplayedZones() {
    return this.filteredZones;
  }

  // Métodos de estadísticas
  getActiveZonesCount(): number {
    return this.allZones.filter(zone => zone.estado === 'activa').length;
  }

  getTotalClassifiersCount(): number {
    // Este dato podría venir del backend en el futuro
    // Por ahora retornamos un cálculo estimado
    return this.allZones.length * 3; // Estimación de 3 clasificadores por zona
  }

  getTotalZonesCount(): number {
    return this.allZones.length;
  }

  // Métodos de selección
  toggleZoneSelection(zoneId: string | number, event: any) {
    if (event.target.checked) {
      this.selectedZones.push(zoneId);
    } else {
      this.selectedZones = this.selectedZones.filter(id => id !== zoneId);
    }
  }

  selectAllZones(event: any) {
    if (event.target.checked) {
      this.selectedZones = this.filteredZones.map(zone => zone.id);
    } else {
      this.selectedZones = [];
    }
  }

  allZonesSelected(): boolean {
    return this.selectedZones.length === this.filteredZones.length && this.filteredZones.length > 0;
  }

  // Métodos de acciones
  viewDetails(zone: Zona) {
    console.log('👁️ Ver detalles de zona:', zone);
    alert(`Detalles de ${zone.nombre}:\n\nDescripción: ${zone.descripcion}\nEstado: ${zone.estado}\nÁrea: ${zone.area ? this.formatArea(zone.area) : 'No especificada'}`);
  }

  editZone(zone: Zona) {
    console.log('✏️ Editar zona:', zone);
    // TODO: Implementar modal de edición
    alert('Función de edición pendiente de implementar');
  }

  deleteZone(zone: Zona) {
    if (confirm(`¿Estás seguro de que deseas eliminar la zona "${zone.nombre}"?`)) {
      console.log('🗑️ Eliminando zona:', zone);
      
      this.backendService.deleteZona(zone.id).subscribe({
        next: () => {
          console.log('✅ Zona eliminada exitosamente');
          this.loadZones(); // Recargar la lista
          alert('Zona eliminada exitosamente');
        },
        error: (error) => {
          console.error('❌ Error al eliminar zona:', error);
          alert('Error al eliminar la zona. Por favor, intenta nuevamente.');
        }
      });
    }
  }

  // Acciones masivas
  bulkActivateZones() {
    if (this.selectedZones.length === 0) return;

    if (confirm(`¿Activar ${this.selectedZones.length} zona(s) seleccionada(s)?`)) {
      console.log('🔄 Activando zonas seleccionadas:', this.selectedZones);
      
      const updatePromises = this.selectedZones.map(zoneId => {
        const zone = this.allZones.find(z => z.id === zoneId);
        if (zone) {
          return this.backendService.updateZona(zone.id, { ...zone, estado: 'activa' }).toPromise();
        }
        return null;
      }).filter(promise => promise !== null);

      Promise.all(updatePromises).then(() => {
        console.log('✅ Zonas activadas exitosamente');
        this.selectedZones = [];
        this.loadZones();
        alert('Zonas activadas exitosamente');
      }).catch(error => {
        console.error('❌ Error al activar zonas:', error);
        alert('Error al activar algunas zonas');
      });
    }
  }

  bulkMaintenanceZones() {
    if (this.selectedZones.length === 0) return;

    if (confirm(`¿Poner en mantenimiento ${this.selectedZones.length} zona(s) seleccionada(s)?`)) {
      console.log('🔧 Poniendo en mantenimiento zonas seleccionadas:', this.selectedZones);
      
      const updatePromises = this.selectedZones.map(zoneId => {
        const zone = this.allZones.find(z => z.id === zoneId);
        if (zone) {
          return this.backendService.updateZona(zone.id, { ...zone, estado: 'mantenimiento' }).toPromise();
        }
        return null;
      }).filter(promise => promise !== null);

      Promise.all(updatePromises).then(() => {
        console.log('✅ Zonas puestas en mantenimiento exitosamente');
        this.selectedZones = [];
        this.loadZones();
        alert('Zonas puestas en mantenimiento exitosamente');
      }).catch(error => {
        console.error('❌ Error al poner zonas en mantenimiento:', error);
        alert('Error al poner algunas zonas en mantenimiento');
      });
    }
  }

  bulkDeleteZones() {
    if (this.selectedZones.length === 0) return;

    if (confirm(`¿Estás seguro de que deseas eliminar ${this.selectedZones.length} zona(s) seleccionada(s)? Esta acción no se puede deshacer.`)) {
      console.log('🗑️ Eliminando zonas seleccionadas:', this.selectedZones);
      
      const deletePromises = this.selectedZones.map(zoneId => 
        this.backendService.deleteZona(zoneId).toPromise()
      );

      Promise.all(deletePromises).then(() => {
        console.log('✅ Zonas eliminadas exitosamente');
        this.selectedZones = [];
        this.loadZones();
        alert('Zonas eliminadas exitosamente');
      }).catch(error => {
        console.error('❌ Error al eliminar zonas:', error);
        alert('Error al eliminar algunas zonas');
      });
    }
  }

  // Métodos de utilidad
  formatArea(area: number): string {
    if (area >= 1000000) {
      return `${(area / 1000000).toFixed(2)} km²`;
    }
    return `${area.toLocaleString()} m²`;
  }

  getStatusIcon(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activa':
        return 'pi-check-circle';
      case 'inactiva':
        return 'pi-times-circle';
      case 'mantenimiento':
        return 'pi-wrench';
      default:
        return 'pi-question-circle';
    }
  }

  getStatusText(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activa':
        return 'Activa';
      case 'inactiva':
        return 'Inactiva';
      case 'mantenimiento':
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  }

  // Métodos del modal
  showDialog() {
    this.visible = true;
  }

  hideDialog() {
    this.newZona = {
      nombre: '',
      descripcion: '',
      latitud: undefined,
      longitud: undefined,
      area: undefined,
      estado: 'activa'
    };
    this.visible = false;
  }
}
