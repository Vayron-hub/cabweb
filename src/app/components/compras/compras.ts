import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../services/backend.service';

interface ProveedorRef {
  id: number;
  nombre: string;
}

interface MateriaPrimaRef {
  id: number;
  nombre: string;
}

interface CompraDetalleForm {
  proveedorId: number | null;
  materiaPrimaId: number | null;
  cantidad: number | null;
  precioUnitario: number | null;
  subTotal: number; // calculado: cantidad * precioUnitario
}

interface CompraListItem {
  id: number;
  numeroCompra: string;
  fechaCompra: string;
  proveedor?: ProveedorRef;
  subTotal: number;
  total: number;
  estatus: string; // 'pendiente' | 'completado' | 'cancelado'
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras.html',
})
export class ComprasComponent implements OnInit {
  compras: CompraListItem[] = [];
  filteredCompras: CompraListItem[] = [];
  proveedores: ProveedorRef[] = [];
  materiasPrimas: MateriaPrimaRef[] = [];
  // Estatus permitidos según backend
  statuses: string[] = [
    'Pendiente',
    'Aprobada',
    'Pagada',
    'EnProceso',
    'Enviada',
    'Completada',
    'Entregada',
    'Cancelada',
    'Rechazada',
  ];

  // Filtros
  searchTerm = '';
  selectedStatusFilter = 'all';
  selectedProveedorFilter: 'all' | number = 'all';

  // Estado
  isLoadingCompras = false;
  showCompraModal = false;
  editingCompra: CompraListItem | null = null;

  // Formulario
  compraForm: {
    numeroCompra: string;
    proveedorId: number | null;
    fechaCompra: string; // yyyy-mm-dd
    observaciones: string;
    estatus: string;
    detalles: CompraDetalleForm[];
    subTotal: number; // calculado
    total: number; // calculado
  } = this.getEmptyCompraForm();

  // Paginación
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;

  constructor(private backendService: BackendService) {}

  ngOnInit() {
    this.loadCompras();
    this.loadProveedores();
    this.loadMateriasPrimas();
  }

  // ======= Cargar datos =======
  loadCompras() {
    this.isLoadingCompras = true;
    this.backendService.getCompras().subscribe({
      next: (data) => {
        this.compras = (data || []).map((c: any) => ({
          id: c.id,
          numeroCompra: c.numeroCompra,
          fechaCompra: c.fechaCompra,
          proveedor: c.proveedor,
          subTotal: c.subTotal ?? 0,
          total: c.total ?? 0,
          estatus: (c.estatus || 'Pendiente').toString(),
        } as CompraListItem));
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
        this.proveedores = (data || []).map((p: any) => ({ id: p.id, nombre: p.nombre }));
      },
      error: () => {}
    });
  }

  loadMateriasPrimas() {
    this.backendService.getMateriasPrimas().subscribe({
      next: (data) => {
        this.materiasPrimas = (data || []).map((m: any) => ({ id: m.id, nombre: m.nombre }));
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
    const val = event.target.value;
    this.selectedProveedorFilter = val === 'all' ? 'all' : Number(val);
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
        this.selectedProveedorFilter === 'all' || (compra.proveedor?.id ?? -1) === Number(this.selectedProveedorFilter);

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
    this.compraForm = this.getEmptyCompraForm();
    // Fila inicial
    this.addDetalleRow();
    this.showCompraModal = true;
  }

  openEditCompraModal(compra: CompraListItem) {
    this.editingCompra = compra;
    // Obtener compra con detalles del backend para editar correctamente
    this.backendService.getCompra(compra.id).subscribe({
      next: (c: any) => {
        const detalles = (c.detalles || []).map((d: any) => ({
          proveedorId: (d as any).proveedorId ?? (d as any).proveedor?.id ?? (c.proveedorId ?? c.proveedor?.id ?? null),
          materiaPrimaId: d.materiaPrimaId ?? d.materiaPrima?.id ?? null,
          cantidad: d.cantidad ?? 0,
          precioUnitario: d.precioUnitario ?? 0,
          subTotal: (d.subTotal ?? ((d.cantidad ?? 0) * (d.precioUnitario ?? 0)))
        })) as CompraDetalleForm[];

        this.compraForm = {
          numeroCompra: c.numeroCompra,
          proveedorId: c.proveedorId ?? c.proveedor?.id ?? null,
          fechaCompra: (c.fechaCompra || '').toString().split('T')[0] || '',
          observaciones: c.observaciones || '',
          estatus: (c.estatus || 'Pendiente').toString(),
          detalles: detalles.length ? detalles : [this.createEmptyDetalleRow()],
          subTotal: 0,
          total: 0,
        };
        this.recalculateTotals();
        this.showCompraModal = true;
      },
      error: () => {
        // Si falla, al menos abrir el modal con datos básicos
        this.compraForm = {
          numeroCompra: compra.numeroCompra,
          proveedorId: compra.proveedor?.id ?? null,
          fechaCompra: compra.fechaCompra?.toString().split('T')[0] || '',
          observaciones: '',
          estatus: compra.estatus,
          detalles: [this.createEmptyDetalleRow()],
          subTotal: compra.subTotal || 0,
          total: compra.total || 0,
        };
        this.showCompraModal = true;
      }
    });
  }

  closeCompraModal() {
    this.showCompraModal = false;
  }

  // ======= Guardar/Actualizar =======
  saveCompra() {
    // Numero de compra lo genera el backend, no se requiere al crear
    if (!this.compraForm.proveedorId || !this.compraForm.fechaCompra) {
      alert('Por favor completa proveedor y fecha.');
      return;
    }

    // Validar detalles
    const detallesValidos = this.compraForm.detalles.filter(
      (d) => d.proveedorId && d.materiaPrimaId && (d.cantidad ?? 0) > 0 && (d.precioUnitario ?? 0) >= 0
    );
    if (detallesValidos.length === 0) {
      alert('Agrega al menos un detalle válido (proveedor, materia prima, cantidad y precio).');
      return;
    }

    this.recalculateTotals();

    // Construir payload respetando reglas: numeroCompra generado por backend en creación, estatus solo editable en edición
    const basePayload: any = {
      proveedorId: this.compraForm.proveedorId,
      fechaCompra: this.compraForm.fechaCompra,
      observaciones: this.compraForm.observaciones || null,
      subTotal: this.compraForm.subTotal,
      total: this.compraForm.total,
      detalles: detallesValidos.map((d) => ({
        proveedorId: d.proveedorId,
        materiaPrimaId: d.materiaPrimaId,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        subTotal: d.subTotal,
      })),
    };

  const payload = this.editingCompra
      ? {
          // En edición, enviar numeroCompra (si el backend lo requiere) y estatus editable
          numeroCompra: this.compraForm.numeroCompra,
      estatus: this.compraForm.estatus, // Mantener exactamente como enum del backend
          ...basePayload,
        }
      : {
          // En creación, no enviar numeroCompra; estatus por defecto 'pendiente'
      estatus: 'Pendiente',
          ...basePayload,
        };

    if (this.editingCompra) {
      this.backendService.updateCompra(this.editingCompra.id, payload).subscribe({
        next: () => {
          this.loadCompras();
          this.closeCompraModal();
        }
      });
    } else {
      this.backendService.createCompra(payload).subscribe({
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
    const map: Record<string, string> = {
      Pendiente: 'bg-amber-100 text-amber-700',
      Aprobada: 'bg-sky-100 text-sky-700',
      Pagada: 'bg-blue-100 text-blue-700',
      EnProceso: 'bg-indigo-100 text-indigo-700',
      Enviada: 'bg-cyan-100 text-cyan-700',
      Completada: 'bg-emerald-100 text-emerald-700',
      Entregada: 'bg-teal-100 text-teal-700',
      Cancelada: 'bg-rose-100 text-rose-700',
      Rechazada: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }

  getStatusText(status: string) {
    const map: Record<string, string> = {
      Pendiente: 'Pendiente',
      Aprobada: 'Aprobada',
      Pagada: 'Pagada',
      EnProceso: 'En Proceso',
      Enviada: 'Enviada',
      Completada: 'Completada',
      Entregada: 'Entregada',
      Cancelada: 'Cancelada',
      Rechazada: 'Rechazada',
    };
    return map[status] || status;
  }

  viewCompraDetails(compra: any) {
    console.log('Detalles de compra:', compra);
    // Aquí podrías abrir un modal o navegar a una vista de detalles
  }

  trackByCompraId(index: number, compra: any) {
    return compra.id;
  }

  // ======= Detalles (líneas) =======
  createEmptyDetalleRow(): CompraDetalleForm {
    return {
      proveedorId: null,
      materiaPrimaId: null,
      cantidad: null,
      precioUnitario: null,
      subTotal: 0,
    };
  }

  addDetalleRow() {
    const row = this.createEmptyDetalleRow();
    if (this.compraForm.proveedorId) {
      row.proveedorId = this.compraForm.proveedorId;
    }
    this.compraForm.detalles.push(row);
  }

  removeDetalleRow(index: number) {
    this.compraForm.detalles.splice(index, 1);
    if (this.compraForm.detalles.length === 0) {
      this.addDetalleRow();
    }
    this.recalculateTotals();
  }

  onDetalleChange(index: number) {
    const d = this.compraForm.detalles[index];
    const cantidad = Number(d.cantidad || 0);
    const precio = Number(d.precioUnitario || 0);
    d.subTotal = cantidad * precio;
    this.recalculateTotals();
  }

  recalculateTotals() {
    const sub = this.compraForm.detalles.reduce((acc, d) => acc + (Number(d.subTotal) || 0), 0);
    this.compraForm.subTotal = Number(sub.toFixed(2));
    // Por ahora Total = SubTotal (impuestos/descuentos futuros)
    this.compraForm.total = this.compraForm.subTotal;
  }

  getEmptyCompraForm() {
    return {
      numeroCompra: '',
      proveedorId: null,
      fechaCompra: '',
      observaciones: '',
  estatus: 'Pendiente',
      detalles: [] as CompraDetalleForm[],
      subTotal: 0,
      total: 0,
    };
  }

  // Completa proveedorId en filas sin valor cuando cambia el proveedor a nivel compra
  onProveedorCompraChange(newProveedorId: number | null) {
    this.compraForm.detalles = this.compraForm.detalles.map((d) => ({
      ...d,
      proveedorId: d.proveedorId ?? newProveedorId,
    }));
  }
}

