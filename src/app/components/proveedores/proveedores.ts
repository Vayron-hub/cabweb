import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../services/backend.service';

export interface Proveedor {
  id: number;
  nombre: string;
  telefono: string;
  email?: string;
  rfc?: string;
  direccion?: string;
  productos?: string;
  activo: boolean;
  fechaRegistro: Date | string;
}

@Component({
  selector: 'app-proveedores',
<<<<<<< HEAD:src/app/components/proveedores/proveedores.component.ts
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
=======
  imports: [],
  templateUrl: './proveedores.html',
>>>>>>> 29b1ac3c0f58f9d3a6e992f40fb82a1942426678:src/app/components/proveedores/proveedores.ts
})
export class ProveedoresComponent implements OnInit {
  
  // === VARIABLES PRINCIPALES ===
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
        console.log('✅ Proveedores obtenidos:', proveedores);
        this.proveedores = proveedores.map(proveedor => ({
          ...proveedor,
          fechaRegistro: proveedor.fechaRegistro || new Date()
        }));
        this.applyFilters();
        this.isLoadingProveedores = false;
      },
      error: (error) => {
        console.error('❌ Error cargando proveedores:', error);
        this.proveedores = [];
        this.filteredProveedores = [];
        this.isLoadingProveedores = false;
      }
    });
  }
  
  // === FILTROS Y BÚSQUEDA ===
  
  applyFilters() {
    let filtered = [...this.proveedores];
    
    // Filtro de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(proveedor =>
        proveedor.nombre.toLowerCase().includes(term) ||
        (proveedor.direccion && proveedor.direccion.toLowerCase().includes(term)) ||
        (proveedor.productos && proveedor.productos.toLowerCase().includes(term))
      );
    }
    
    // Filtro de estado
    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(proveedor =>
        this.selectedStatusFilter === 'active' ? proveedor.activo : !proveedor.activo
      );
    }
    
    this.filteredProveedores = filtered;
    this.updatePagination();
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
  
  saveSupplier() {
    if (this.editingSupplier) {
      // Actualizar proveedor
      this.backendService.updateProveedor(this.editingSupplier.id, this.supplierFormData).subscribe({
        next: (updatedProveedor: Proveedor) => {
          console.log('✅ Proveedor actualizado:', updatedProveedor);
          const index = this.proveedores.findIndex(p => p.id === updatedProveedor.id);
          if (index !== -1) {
            this.proveedores[index] = updatedProveedor;
            this.applyFilters();
          }
          this.closeSupplierModal();
        },
        error: (error) => {
          console.error('❌ Error actualizando proveedor:', error);
          alert('Error al actualizar el proveedor');
        }
      });
    } else {
      // Crear nuevo proveedor
      this.backendService.createProveedor(this.supplierFormData).subscribe({
        next: (newProveedor: Proveedor) => {
          console.log('✅ Proveedor creado:', newProveedor);
          this.proveedores.unshift(newProveedor);
          this.applyFilters();
          this.closeSupplierModal();
        },
        error: (error) => {
          console.error('❌ Error creando proveedor:', error);
          alert('Error al crear el proveedor');
        }
      });
    }
  }
  
  deleteSupplier(proveedor: Proveedor) {
    if (!confirm(`¿Está seguro de eliminar el proveedor "${proveedor.nombre}"?`)) {
      return;
    }
    
    this.backendService.deleteProveedor(proveedor.id).subscribe({
      next: () => {
        console.log('✅ Proveedor eliminado:', proveedor.id);
        this.proveedores = this.proveedores.filter(p => p.id !== proveedor.id);
        this.applyFilters();
      },
      error: (error) => {
        console.error('❌ Error eliminando proveedor:', error);
        alert('Error al eliminar el proveedor');
      }
    });
  }
  
  toggleSupplierStatus(proveedor: Proveedor) {
    const newStatus = !proveedor.activo;
    
    this.backendService.updateProveedor(proveedor.id, { ...proveedor, activo: newStatus }).subscribe({
      next: (updatedProveedor: Proveedor) => {
        console.log('✅ Estado actualizado:', updatedProveedor);
        const index = this.proveedores.findIndex(p => p.id === proveedor.id);
        if (index !== -1) {
          this.proveedores[index] = updatedProveedor;
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
  
  // === MÉTODOS AUXILIARES ===
  
  getEmptySupplierForm(): Proveedor {
    return {
      id: 0,
      nombre: '',
      telefono: '',
      email: '',
      rfc: '',
      direccion: '',
      productos: '',
      activo: true,
      fechaRegistro: new Date()
    };
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