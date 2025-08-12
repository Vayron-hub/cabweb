import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.css']
})
export class ComprasComponent implements OnInit {
  compras: any[] = [];
  filteredCompras: any[] = [];
  proveedores: any[] = [];

  // Filtros
  searchTerm = '';
  selectedStatusFilter = 'all';
  selectedProveedorFilter = 'all';

  // Estado
  isLoadingCompras = false;
  showCompraModal = false;
  editingCompra: any = null;

  // Formulario
  compraForm: any = {
    numeroCompra: '',
    proveedorId: null,
    fechaCompra: '',
    observaciones: '',
    subTotal: 0,
    total: 0,
    estatus: 'pendiente'
  };

  // Paginación
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;

  constructor(private backendService: BackendService) {}

  ngOnInit() {
    this.loadCompras();
    this.loadProveedores();
  }

  // ======= Cargar datos =======
  loadCompras() {
    this.isLoadingCompras = true;
    this.backendService.getCompras().subscribe({
      next: (data) => {
        this.compras = data;
        this.applyFilters();
        this.isLoadingCompras = false;
      },
      error: () => {
        this.isLoadingCompras = false;
      }
    });
  }

  loadProveedores() {
    this.backendService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: () => {}
    });
  }

  // ======= Filtros =======
  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange(event: any) {
    this.selectedStatusFilter = event.target.value;
    this.applyFilters();
  }

  onProveedorFilterChange(event: any) {
    this.selectedProveedorFilter = event.target.value;
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatusFilter = 'all';
    this.selectedProveedorFilter = 'all';
    this.applyFilters();
  }

  applyFilters() {
    this.filteredCompras = this.compras.filter((compra) => {
      const matchSearch =
        !this.searchTerm ||
        compra.numeroCompra?.toString().toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        compra.proveedor?.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchStatus =
        this.selectedStatusFilter === 'all' || compra.estatus === this.selectedStatusFilter;

      const matchProveedor =
        this.selectedProveedorFilter === 'all' || compra.proveedor?.id == this.selectedProveedorFilter;

      return matchSearch && matchStatus && matchProveedor;
    });

    this.totalPages = Math.ceil(this.filteredCompras.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
  }

  // ======= Paginación =======
  getPaginatedCompras() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCompras.slice(start, start + this.itemsPerPage);
  }

  canGoToPreviousPage() {
    return this.currentPage > 1;
  }

  canGoToNextPage() {
    return this.currentPage < this.totalPages;
  }

  goToPreviousPage() {
    if (this.canGoToPreviousPage()) this.currentPage--;
  }

  goToNextPage() {
    if (this.canGoToNextPage()) this.currentPage++;
  }

  getPaginationInfo() {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.filteredCompras.length);
    return `${start}-${end} de ${this.filteredCompras.length}`;
  }

  // ======= Modales =======
  openAddCompraModal() {
    this.editingCompra = null;
    this.compraForm = {
      numeroCompra: '',
      proveedorId: null,
      fechaCompra: '',
      observaciones: '',
      subTotal: 0,
      total: 0,
      estatus: 'pendiente'
    };
    this.showCompraModal = true;
  }

  openEditCompraModal(compra: any) {
    this.editingCompra = compra;
    this.compraForm = {
      numeroCompra: compra.numeroCompra,
      proveedorId: compra.proveedor?.id,
      fechaCompra: compra.fechaCompra?.split('T')[0],
      observaciones: compra.observaciones || '',
      subTotal: compra.subTotal || 0,
      total: compra.total || 0,
      estatus: compra.estatus
    };
    this.showCompraModal = true;
  }

  closeCompraModal() {
    this.showCompraModal = false;
  }

  // ======= Guardar/Actualizar =======
  saveCompra() {
    if (!this.compraForm.numeroCompra || !this.compraForm.proveedorId || !this.compraForm.fechaCompra) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    if (this.editingCompra) {
      this.backendService.updateCompra(this.editingCompra.id, this.compraForm).subscribe({
        next: () => {
          this.loadCompras();
          this.closeCompraModal();
        }
      });
    } else {
      this.backendService.createCompra(this.compraForm).subscribe({
        next: () => {
          this.loadCompras();
          this.closeCompraModal();
        }
      });
    }
  }

  // ======= Eliminar =======
  deleteCompra(compra: any) {
    if (confirm(`¿Eliminar la compra #${compra.numeroCompra}?`)) {
      this.backendService.deleteCompra(compra.id).subscribe({
        next: () => {
          this.loadCompras();
        }
      });
    }
  }

  // ======= Otros helpers =======
  formatPrice(value: number) {
    return `$${value?.toFixed(2) || '0.00'}`;
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(status: string) {
    return {
      pendiente: 'status-pending',
      completado: 'status-completed',
      cancelado: 'status-cancelled'
    }[status] || '';
  }

  getStatusText(status: string) {
    return {
      pendiente: 'Pendiente',
      completado: 'Completado',
      cancelado: 'Cancelado'
    }[status] || status;
  }

  viewCompraDetails(compra: any) {
    console.log('Detalles de compra:', compra);
    // Aquí podrías abrir un modal o navegar a una vista de detalles
  }

  trackByCompraId(index: number, compra: any) {
    return compra.id;
  }
}
