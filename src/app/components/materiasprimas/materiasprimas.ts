import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BackendService } from '../../services/backend.service';

export interface MateriaPrima {
  id: number;
  nombre: string;
  descripcion: string;
  precioUnitario: number;
  stock: number;
  activo: boolean;
  fechaCreacion: Date | string;
}

@Component({
  selector: 'app-materias-primas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materiasprimas.component.html',
  styleUrls: ['./materiasprimas.component.css']
})
export class MateriasPrimasComponent implements OnInit, OnDestroy {
  
  // === VARIABLES PRINCIPALES ===
  materiasPrimas: MateriaPrima[] = [];
  filteredMaterials: MateriaPrima[] = [];
  isLoadingMaterials = false;
  searchTerm = '';
  selectedMaterials: number[] = [];
  
  // === MODAL Y FORMULARIO ===
  showMaterialModal = false;
  editingMaterial: MateriaPrima | null = null;
  materialForm: MateriaPrima = this.getEmptyMaterialForm();
  
  // === FILTROS ===
  selectedStatusFilter = 'all'; // all, active, inactive
  selectedStockFilter = 'all'; // all, in-stock, low-stock, out-of-stock
  
  // === PAGINACIÓN ===
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  private subscriptions = new Subscription();
  
  constructor(
    private backendService: BackendService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loadMateriasPrimas();
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  // === MÉTODOS DE CARGA ===
  
  loadMateriasPrimas() {
    this.isLoadingMaterials = true;
    console.log('🔄 Cargando materias primas...');
    
    const subscription = this.backendService.getMateriasPrimas().subscribe({
      next: (materiales: MateriaPrima[]) => {
        console.log('✅ Materias primas obtenidas:', materiales);
        
        // Asegurar que fechaCreacion sea Date
        this.materiasPrimas = materiales.map(material => ({
          ...material,
          fechaCreacion: material.fechaCreacion ? new Date(material.fechaCreacion) : new Date()
        }));
        
        this.applyFilters();
        this.isLoadingMaterials = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando materias primas:', error);
        this.materiasPrimas = [];
        this.filteredMaterials = [];
        this.isLoadingMaterials = false;
        this.cdr.detectChanges();
        alert('Error al cargar las materias primas. Por favor, inténtelo de nuevo.');
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  // === FILTROS Y BÚSQUEDA ===
  
  applyFilters() {
    let filtered = [...this.materiasPrimas];
    
    // Filtro de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(material =>
        material.nombre.toLowerCase().includes(term) ||
        material.descripcion.toLowerCase().includes(term)
      );
    }
    
    // Filtro de estado
    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(material =>
        this.selectedStatusFilter === 'active' ? material.activo : !material.activo
      );
    }
    
    // Filtro de stock
    if (this.selectedStockFilter !== 'all') {
      filtered = filtered.filter(material => {
        switch (this.selectedStockFilter) {
          case 'in-stock': return material.stock > 10;
          case 'low-stock': return material.stock > 0 && material.stock <= 10;
          case 'out-of-stock': return material.stock === 0;
          default: return true;
        }
      });
    }
    
    this.filteredMaterials = filtered;
    this.updatePagination();
    this.selectedMaterials = []; // Limpiar selecciones al filtrar
  }
  
  onSearchChange() {
    this.currentPage = 1; // Reset a la primera página
    this.applyFilters();
  }
  
  onStatusFilterChange(event: any) {
    this.currentPage = 1;
    this.applyFilters();
  }
  
  onStockFilterChange(event: any) {
    this.currentPage = 1;
    this.applyFilters();
  }
  
  clearFilters() {
    this.searchTerm = '';
    this.selectedStatusFilter = 'all';
    this.selectedStockFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }
  
  // === PAGINACIÓN ===
  
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredMaterials.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }
  
  getPaginatedMaterials(): MateriaPrima[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredMaterials.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.selectedMaterials = []; // Limpiar selección al cambiar página
    }
  }
  
  goToPreviousPage() {
    if (this.canGoToPreviousPage()) {
      this.currentPage--;
      this.selectedMaterials = [];
    }
  }
  
  goToNextPage() {
    if (this.canGoToNextPage()) {
      this.currentPage++;
      this.selectedMaterials = [];
    }
  }
  
  canGoToPreviousPage(): boolean {
    return this.currentPage > 1;
  }
  
  canGoToNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }
  
  getPaginationInfo(): string {
    if (this.totalPages === 0) return 'Sin resultados';
    return `Página ${this.currentPage} de ${this.totalPages}`;
  }
  
  // === OPERACIONES CRUD ===
  
  openAddMaterialModal() {
    this.editingMaterial = null;
    this.materialForm = this.getEmptyMaterialForm();
    this.showMaterialModal = true;
  }
  
  openEditMaterialModal(material: MateriaPrima) {
    this.editingMaterial = material;
    this.materialForm = { 
      ...material,
      fechaCreacion: new Date(material.fechaCreacion) 
    };
    this.showMaterialModal = true;
  }
  
  closeMaterialModal() {
    this.showMaterialModal = false;
    this.editingMaterial = null;
    this.materialForm = this.getEmptyMaterialForm();
  }
  
  saveMaterial() {
    if (!this.isValidMaterialForm()) {
      alert('Por favor complete todos los campos requeridos correctamente');
      return;
    }

    const materialData = {
      nombre: this.materialForm.nombre.trim(),
      descripcion: this.materialForm.descripcion.trim(),
      precioUnitario: Number(this.materialForm.precioUnitario),
      stock: Number(this.materialForm.stock) || 0,
      activo: this.materialForm.activo
    };

    if (this.editingMaterial) {
      // Actualizar materia prima existente
      const subscription = this.backendService.updateMateriaPrima(this.editingMaterial.id, {
        ...materialData,
        id: this.editingMaterial.id,
        fechaCreacion: this.editingMaterial.fechaCreacion
      }).subscribe({
        next: () => {
          this.closeMaterialModal();
          this.loadMateriasPrimas(); // <-- recarga desde la API
        },
        error: (error) => {
          alert('Error al actualizar la materia prima. Por favor, inténtelo de nuevo.');
        }
      });
      this.subscriptions.add(subscription);
    } else {
      // Crear nueva materia prima
      const subscription = this.backendService.createMateriaPrima(materialData).subscribe({
        next: () => {
          this.closeMaterialModal();
          this.loadMateriasPrimas(); // <-- recarga desde la API
        },
        error: (error) => {
          alert('Error al crear la materia prima. Por favor, inténtelo de nuevo.');
        }
      });
      this.subscriptions.add(subscription);
    }
  }
  
  deleteMaterial(material: MateriaPrima) {
    if (!confirm(`¿Está seguro de eliminar la materia prima "${material.nombre}"?`)) {
      return;
    }

    const subscription = this.backendService.deleteMateriaPrima(material.id).subscribe({
      next: () => {
        this.loadMateriasPrimas(); // <-- recarga desde la API
      },
      error: (error) => {
        alert('Error al eliminar la materia prima. Por favor, inténtelo de nuevo.');
      }
    });
    this.subscriptions.add(subscription);
  }

  toggleMaterialStatus(material: MateriaPrima) {
    const newStatus = !material.activo;

    const subscription = this.backendService.updateMateriaPrima(material.id, { 
      ...material, 
      activo: newStatus 
    }).subscribe({
      next: () => {
        this.loadMateriasPrimas(); // <-- recarga desde la API
      },
      error: (error) => {
        alert('Error al actualizar el estado de la materia prima');
      }
    });
    this.subscriptions.add(subscription);
  }
  
  // Lo mismo para las operaciones masivas:
  bulkActivateMaterials() {
    if (this.selectedMaterials.length === 0) return;
    const updates = this.selectedMaterials.map(id => {
      const material = this.materiasPrimas.find(m => m.id === id);
      if (material && !material.activo) {
        return this.backendService.updateMateriaPrima(id, { ...material, activo: true }).toPromise();
      }
      return Promise.resolve(null);
    }).filter(promise => promise !== null);

    Promise.all(updates).then(() => {
      this.selectedMaterials = [];
      this.loadMateriasPrimas(); // <-- recarga desde la API
    }).catch(error => {
      alert('Error al activar algunas materias primas');
    });
  }

  bulkDeactivateMaterials() {
    if (this.selectedMaterials.length === 0) return;
    const updates = this.selectedMaterials.map(id => {
      const material = this.materiasPrimas.find(m => m.id === id);
      if (material && material.activo) {
        return this.backendService.updateMateriaPrima(id, { ...material, activo: false }).toPromise();
      }
      return Promise.resolve(null);
    }).filter(promise => promise !== null);

    Promise.all(updates).then(() => {
      this.selectedMaterials = [];
      this.loadMateriasPrimas(); // <-- recarga desde la API
    }).catch(error => {
      alert('Error al desactivar algunas materias primas');
    });
  }

  bulkDeleteMaterials() {
    if (this.selectedMaterials.length === 0) return;
    if (!confirm(`¿Está seguro de eliminar ${this.selectedMaterials.length} materias primas?`)) {
      return;
    }
    const deletions = this.selectedMaterials.map(id => 
      this.backendService.deleteMateriaPrima(id).toPromise()
    );

    Promise.all(deletions).then(() => {
      this.selectedMaterials = [];
      this.loadMateriasPrimas(); // <-- recarga desde la API
    }).catch(error => {
      alert('Error al eliminar algunas materias primas');
    });
  }
  
  // === SELECCIÓN MASIVA ===
  
  toggleMaterialSelection(materialId: number, event: any) {
    if (event.target.checked) {
      if (!this.selectedMaterials.includes(materialId)) {
        this.selectedMaterials.push(materialId);
      }
    } else {
      this.selectedMaterials = this.selectedMaterials.filter(id => id !== materialId);
    }
  }
  
  selectAllMaterials(event: any) {
    const paginatedMaterials = this.getPaginatedMaterials();
    
    if (event.target.checked) {
      // Agregar todos los IDs de la página actual
      const currentPageIds = paginatedMaterials.map(m => m.id);
      this.selectedMaterials = [...new Set([...this.selectedMaterials, ...currentPageIds])];
    } else {
      // Remover todos los IDs de la página actual
      const currentPageIds = paginatedMaterials.map(m => m.id);
      this.selectedMaterials = this.selectedMaterials.filter(id => !currentPageIds.includes(id));
    }
  }
  
  allMaterialsSelected(): boolean {
    const paginatedMaterials = this.getPaginatedMaterials();
    if (paginatedMaterials.length === 0) return false;
    
    return paginatedMaterials.every(material => this.selectedMaterials.includes(material.id));
  }
  
  // === MÉTODOS AUXILIARES ===
  
  getEmptyMaterialForm(): MateriaPrima {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      precioUnitario: 0,
      stock: 0,
      activo: true,
      fechaCreacion: new Date()
    };
  }
  
  isValidMaterialForm(): boolean {
    return !!(
      this.materialForm.nombre.trim() &&
      this.materialForm.descripcion.trim() &&
      this.materialForm.precioUnitario > 0
    );
  }
  
  // === MÉTODOS DE FORMATO ===
  
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }
  
  formatStock(stock: number): string {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(stock);
  }
  
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  getStockStatusClass(stock: number): string {
    if (stock === 0) return 'out-of-stock';
    if (stock <= 10) return 'low-stock';
    return 'in-stock';
  }
  
  getStockStatusText(stock: number): string {
    if (stock === 0) return '(Sin stock)';
    if (stock <= 10) return '(Stock bajo)';
    return '';
  }
  
  getStatusClass(activo: boolean): string {
    return activo ? 'active' : 'inactive';
  }
  
  getStatusText(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }
  
  // === MÉTODOS DE EXPORTACIÓN ===
  
  exportMaterialsData() {
    console.log('📁 Exportando datos de materias primas...');
    // Aquí implementarías la exportación a Excel/CSV
  }
  
  trackByMaterialId(index: number, material: MateriaPrima): number {
    return material.id;
  }
}