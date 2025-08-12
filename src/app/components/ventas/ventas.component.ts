import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit {
  ventas: any[] = [];
  usuarios: any[] = [];
  productos: any[] = [];
  clientes: any[] = [];

  filteredVentas: any[] = [];
  paginatedVentas: any[] = [];

  searchTerm: string = '';
  selectedStatusFilter: string = 'all';
  selectedClienteFilter: string = 'all';

  showModal: boolean = false;
  isEditing: boolean = false;
  ventaForm: any = this.getEmptyVenta();

  isLoadingVentas: boolean = false;

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  estatusList = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  constructor(private backendService: BackendService) {}

  ngOnInit() {
    this.loadUsuarios();
    this.loadProductos();
    this.loadClientes();
    this.loadVentas();
  }

  // === Cargar datos ===
  loadVentas() {
    this.isLoadingVentas = true;
    this.backendService.getVentas().subscribe({
      next: (data) => {
        this.ventas = data;
        this.applyFilters();
        this.isLoadingVentas = false;
      },
      error: (err) => {
        console.error('Error cargando ventas', err);
        this.isLoadingVentas = false;
      }
    });
  }

  loadUsuarios() {
    this.backendService.getUsuarios().subscribe({
      next: (data) => this.usuarios = data,
      error: (err) => console.error('Error cargando usuarios', err)
    });
  }

  loadProductos() {
    this.backendService.getProductos().subscribe({
      next: (data) => this.productos = data,
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  loadClientes() {
    this.backendService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.applyFilters();
      },
      error: (err) => console.error('Error cargando clientes', err)
    });
  }

  // === Filtros ===
  applyFilters() {
    this.filteredVentas = this.ventas.filter(v => {
      const matchesSearch =
        !this.searchTerm ||
        v.numeroVenta?.toString().toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        v.usuario?.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        v.producto?.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        v.cliente?.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        this.selectedStatusFilter === 'all' || v.estatus === this.selectedStatusFilter;

      const matchesCliente =
        this.selectedClienteFilter === 'all' || v.cliente?.id == this.selectedClienteFilter;

      return matchesSearch && matchesStatus && matchesCliente;
    });

    this.totalPages = Math.ceil(this.filteredVentas.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
    this.updatePaginatedVentas();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onClienteFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatusFilter = 'all';
    this.selectedClienteFilter = 'all';
    this.applyFilters();
  }

  // === Paginación ===
  updatePaginatedVentas() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedVentas = this.filteredVentas.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedVentas();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedVentas();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedVentas();
    }
  }

  // === Modal ===
  openAddVentaModal() {
    this.isEditing = false;
    this.ventaForm = this.getEmptyVenta();
    this.showModal = true;
  }

  openEditModal(venta: any) {
    this.isEditing = true;
    // Clonar el objeto para no modificar el original
    this.ventaForm = { ...venta };
    // Convertir IDs a string para los selects
    this.ventaForm.usuarioId = venta.usuario?.id.toString();
    this.ventaForm.productoId = venta.producto?.id.toString();
    this.ventaForm.clienteId = venta.cliente?.id.toString();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveVenta() {
    // Preparar el objeto a enviar
    const ventaData = {
      ...this.ventaForm,
      usuarioId: parseInt(this.ventaForm.usuarioId),
      productoId: parseInt(this.ventaForm.productoId),
      clienteId: parseInt(this.ventaForm.clienteId),
      cantidad: parseInt(this.ventaForm.cantidad),
      precioUnitario: parseFloat(this.ventaForm.precioUnitario),
      total: parseFloat(this.ventaForm.total)
    };

    if (this.isEditing) {
      this.backendService.updateVenta(ventaData.id, ventaData).subscribe({
        next: () => {
          this.loadVentas();
          this.closeModal();
        },
        error: (err) => console.error('Error actualizando venta', err)
      });
    } else {
      this.backendService.createVenta(ventaData).subscribe({
        next: () => {
          this.loadVentas();
          this.closeModal();
        },
        error: (err) => console.error('Error creando venta', err)
      });
    }
  }

  deleteVenta(venta: any) {
    if (confirm(`¿Eliminar la venta #${venta.numeroVenta}?`)) {
      this.backendService.deleteVenta(venta.id).subscribe({
        next: () => this.loadVentas(),
        error: (err) => console.error('Error eliminando venta', err)
      });
    }
  }

  // === Helpers ===
  getEmptyVenta() {
    return {
      id: null,
      numeroVenta: '',
      fechaVenta: new Date().toISOString().split('T')[0],
      usuarioId: null,
      productoId: null,
      clienteId: null,
      cantidad: 1,
      precioUnitario: 0,
      subTotal: 0,
      total: 0,
      estatus: 'pendiente',
      direccionEnvio: '',
      observaciones: ''
    };
  }

  formatPrice(value: number) {
    return `$${value?.toFixed(2) || '0.00'}`;
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-ES');
  }

  getStatusClass(status: string) {
    return {
      pendiente: 'status-pendiente',
      completado: 'status-completado',
      cancelado: 'status-cancelado'
    }[status] || '';
  }

  getStatusText(status: string) {
    const statusMap: Record<string, string> = {
      'pendiente': 'Pendiente',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  calculateTotal() {
    const cantidad = this.ventaForm.cantidad ? parseInt(this.ventaForm.cantidad) : 0;
    const precioUnitario = this.ventaForm.precioUnitario ? parseFloat(this.ventaForm.precioUnitario) : 0;
    const subtotal = cantidad * precioUnitario;
    const iva = subtotal * 0.16;
    this.ventaForm.total = (subtotal + iva).toFixed(2);
  }
}