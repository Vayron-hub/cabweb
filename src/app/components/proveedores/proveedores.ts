import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../services/backend.service';

export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string[];
  producto?: string;
  activo: boolean;
  fechaRegistro: Date | string;
  estado?: string;
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html'
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  filteredProveedores: Proveedor[] = [];
  isLoadingProveedores = false;
  searchTerm = '';
  selectedProveedores: number[] = [];
  
  // === MODAL Y FORMULARIO ===
  showSupplierModal = false;
  editingSupplier: Proveedor | null = null;
  supplierFormData: Proveedor = this.getEmptySupplierForm();
  
  // === FILTROS ===
  selectedStatusFilter = 'all'; // all, active, inactive
  
  // === PAGINACIÓN ===
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  constructor(
    private backendService: BackendService
  ) {}
  
  ngOnInit() {
    this.loadProveedores();
  }
  
  // === MÉTODOS DE CARGA ===
  
  loadProveedores() {
    this.isLoadingProveedores = true;
    this.backendService.getProveedores().subscribe({
      next: (proveedores: Proveedor[]) => {
        this.proveedores = proveedores.map(p => ({
          ...p,
          fechaRegistro: p.fechaRegistro || new Date()
        }));
        this.applyFilters();
        this.isLoadingProveedores = false;
      },
      error: (err) => {
        this.proveedores = [];
        this.filteredProveedores = [];
        this.isLoadingProveedores = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.proveedores];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        (p.producto && p.producto.toLowerCase().includes(term)) ||
        (Array.isArray(p.contacto) && p.contacto.some(c => c.toLowerCase().includes(term)))
      );
    }

    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(p =>
        this.selectedStatusFilter === 'active' ? p.activo : !p.activo
      );
    }

    this.filteredProveedores = filtered;
    this.updatePagination();
  }

  // Cuando abras el modal para crear o editar, inicializa el contacto así:
  getEmptySupplierForm(): Proveedor {
    return {
      id: 0,
      nombre: '',
      contacto: [],  // array vacío para contactos
      producto: '',
      activo: true,
      fechaRegistro: new Date()
    };
  }

  // Guardar proveedor ajusta para enviar contactos como array
  saveSupplier() {
    // Prepara el payload para el backend SIN el campo id
    const proveedorPayload: any = {
      Nombre: this.supplierFormData.nombre,
      Contacto: this.supplierFormData.contacto,
      Producto: this.supplierFormData.producto,
      Activo: this.supplierFormData.activo
    };

    if (this.editingSupplier) {
      // Editar proveedor
      this.backendService.updateProveedor(this.editingSupplier.id, proveedorPayload).subscribe({
        next: () => {
          this.closeSupplierModal();
          this.loadProveedores();
        },
        error: () => alert('Error al actualizar el proveedor')
      });
    } else {
      // Crear proveedor
      this.backendService.createProveedor(proveedorPayload).subscribe({
        next: () => {
          this.closeSupplierModal();
          this.loadProveedores();
        },
        error: () => alert('Error al crear el proveedor')
      });
    }
  }
  
  clearFilters() {
    this.searchTerm = '';
    this.selectedStatusFilter = 'all';
    this.applyFilters();
  }
  
  // === PAGINACIÓN ===
  
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProveedores.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }
  
  getPaginatedProveedores(): Proveedor[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProveedores.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  // === OPERACIONES CRUD ===
  
  openAddSupplierModal() {
    this.editingSupplier = null;
    this.supplierFormData = this.getEmptySupplierForm();
    this.showSupplierModal = true;
  }
  
  openEditSupplierModal(proveedor: Proveedor) {
    this.editingSupplier = proveedor;
    this.supplierFormData = { ...proveedor };
    this.showSupplierModal = true;
  }
  
  closeSupplierModal() {
    this.showSupplierModal = false;
    this.editingSupplier = null;
    this.supplierFormData = this.getEmptySupplierForm();
  }
  
  deleteSupplier(proveedor: Proveedor) {
    if (!confirm(`¿Está seguro de eliminar el proveedor "${proveedor.nombre}"?`)) {
      return;
    }
    this.backendService.deleteProveedor(proveedor.id).subscribe({
      next: () => {
        this.loadProveedores(); // <-- recarga la lista
      },
      error: (error) => {
        alert('Error al eliminar el proveedor');
      }
    });
  }
  
  toggleSupplierStatus(proveedor: Proveedor) {
    const proveedorPayload: any = {
      Nombre: proveedor.nombre,
      Contacto: proveedor.contacto,
      Producto: proveedor.producto,
      Activo: !proveedor.activo
    };

    this.backendService.updateProveedor(proveedor.id, proveedorPayload).subscribe({
      next: () => {
        const index = this.proveedores.findIndex(p => p.id === proveedor.id);
        if (index !== -1) {
          this.proveedores[index] = { ...this.proveedores[index], activo: !proveedor.activo };
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('❌ Error actualizando estado:', error);
        alert('Error al actualizar el estado del proveedor');
      }
    });
  }
  
  // === SELECCIÓN MASIVA ===
  
  toggleSupplierSelection(proveedorId: number, event: any) {
    if (event.target.checked) {
      this.selectedProveedores.push(proveedorId);
    } else {
      this.selectedProveedores = this.selectedProveedores.filter(id => id !== proveedorId);
    }
  }
  
  selectAllSuppliers(event: any) {
    if (event.target.checked) {
      this.selectedProveedores = this.getPaginatedProveedores().map(p => p.id);
    } else {
      this.selectedProveedores = [];
    }
  }
  
  allProductsSelected(): boolean {
    const paginatedProveedores = this.getPaginatedProveedores();
    return this.selectedProveedores.length === paginatedProveedores.length && paginatedProveedores.length > 0;
  }
  
  bulkActivateSuppliers() {
    if (this.selectedProveedores.length === 0) return;
    
    // Implementar activación masiva
    console.log('Activando proveedores:', this.selectedProveedores);
    this.selectedProveedores = [];
  }
  
  bulkDeactivateSuppliers() {
    if (this.selectedProveedores.length === 0) return;
    
    // Implementar desactivación masiva
    console.log('Desactivando proveedores:', this.selectedProveedores);
    this.selectedProveedores = [];
  }
  
  bulkDeleteSuppliers() {
    if (this.selectedProveedores.length === 0) return;
    
    if (!confirm(`¿Está seguro de eliminar ${this.selectedProveedores.length} proveedores?`)) {
      return;
    }
    
    // Implementar eliminación masiva
    console.log('Eliminando proveedores:', this.selectedProveedores);
    this.selectedProveedores = [];
  }
  
  // === MÉTODOS DE FORMATO ===
  
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  getStatusClass(activo: boolean): string {
    return activo ? 'active' : 'inactive';
  }
  
  getStatusText(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }
  
  exportSuppliersData() {
    console.log('📁 Exportando datos de proveedores...');
    // Implementar exportación
  }
}