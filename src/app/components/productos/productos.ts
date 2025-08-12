import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendService, ProductoDto, CreateProductoDto, UpdateProductoDto, BulkProductoOperationDto, ProductoFilterDto, PagedProductoResponseDto, newComent } from '../../services/backend.service';

interface Comentario {
  id: number;
  fechaHora: Date;
  texto: string;
  usuarioId: number;
  calificacion: number;
  activo: boolean;
  productoId?: number;
  usuario?: string;
}

export interface User {
  id: string | number;
  nombre: string;
  email: string;
  rol: string;
  ultimoAcceso?: Date;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
  ],
  templateUrl: './productos.html'
})
export class ProductosComponent implements OnInit {
  // === USUARIO ACTUAL ===
  currentUser: User = {
    id: '',
    nombre: '',
    email: '',
    rol: '',
    ultimoAcceso: new Date(),
  };

  // === DATOS DE PRODUCTOS ===
  productos: ProductoDto[] = [];
  pagedResponse: PagedProductoResponseDto | null = null;
  isLoadingProductos = false;
  selectedProductos: number[] = [];

  // === MODAL Y FORMULARIO CRUD ===
  showProductModal = false;
  editingProduct: ProductoDto | null = null;
  productForm: CreateProductoDto | UpdateProductoDto = this.getEmptyProductForm();
  formErrors: { [key: string]: string } = {};

  // === FILTROS Y BÚSQUEDA ===
  filtros: ProductoFilterDto = {
    searchTerm: '',
    statusFilter: 'all',
    stockFilter: 'all',
    page: 1,
    pageSize: 10,
    sortBy: 'fechaCreacion',
    sortDirection: 'desc'
  };

  // === COMENTARIOS ===
  comentarios: Comentario[] = [];
  visibleComentarios: boolean = false;
  visibleAgregarComentario: boolean = false;
  productoSeleccionado: number = 0;
  newComentario: newComent = {
    texto: '',
    fechaHora: '',
    usuarioId: 0,
    calificacion: 0,
    activo: true
  };
  hoverCalificacion: number = 0;

  constructor(
    private backendService: BackendService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.getCurrentUser();
    this.loadProductos();
    if (this.isCliente()) {
      this.loadComentarios();
    }
  }

  // === USUARIO ===
  getCurrentUser() {
    const user = this.backendService.getCurrentUser();
    if (user) {
      this.currentUser = {
        id: user.id || '',
        nombre: user.nombre || '',
        email: (user as any).correo || (user as any).email || '',
        rol: (user as any).rol || '',
        ultimoAcceso: this.convertToDate(user.fechaUltimoAcceso),
      };
      this.newComentario.usuarioId = Number(this.currentUser.id);
    }
  }

  isCliente(): boolean {
    return this.currentUser.rol === 'Cliente';
  }

  isSuperAdmin(): boolean {
    return this.currentUser.rol === 'SuperAdmin' || this.currentUser.rol === 'Admin';
  }

  // === PRODUCTOS ===
  loadProductos() {
    this.isLoadingProductos = true;
    this.backendService.getProductosPaginado(this.filtros).subscribe({
      next: (response: PagedProductoResponseDto) => {
        this.pagedResponse = response;
        this.productos = response.productos;
        this.isLoadingProductos = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.productos = [];
        this.pagedResponse = null;
        this.isLoadingProductos = false;
        this.showErrorMessage('Error al cargar los productos: ' + error.message);
        this.cdr.detectChanges();
      }
    });
  }

  // === FILTROS Y BÚSQUEDA ===
  onSearchChange() {
    this.filtros.page = 1;
    this.loadProductos();
  }
  onStatusFilterChange(event: any) {
    this.filtros.statusFilter = event.target.value;
    this.filtros.page = 1;
    this.loadProductos();
  }
  onStockFilterChange(event: any) {
    this.filtros.stockFilter = event.target.value;
    this.filtros.page = 1;
    this.loadProductos();
  }
  onSortChange(sortBy: string) {
    if (this.filtros.sortBy === sortBy) {
      this.filtros.sortDirection = this.filtros.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.filtros.sortBy = sortBy;
      this.filtros.sortDirection = 'asc';
    }
    this.filtros.page = 1;
    this.loadProductos();
  }
  onPageSizeChange(event: any) {
    this.filtros.pageSize = parseInt(event.target.value);
    this.filtros.page = 1;
    this.loadProductos();
  }

  // === PAGINACIÓN ===
  goToPage(page: number) {
    if (page >= 1 && page <= (this.pagedResponse?.totalPages || 1)) {
      this.filtros.page = page;
      this.loadProductos();
    }
  }
  getPaginationPages(): number[] {
    if (!this.pagedResponse) return [];
    const totalPages = this.pagedResponse.totalPages;
    const currentPage = this.pagedResponse.currentPage;
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // === CRUD PRODUCTOS (solo SuperAdmin/Admin) ===
  openAddProductModal() {
    this.editingProduct = null;
    this.productForm = this.getEmptyProductForm();
    this.formErrors = {};
    this.showProductModal = true;
  }
  openEditProductModal(producto: ProductoDto) {
    this.editingProduct = producto;
    this.productForm = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      costo: producto.costo,
      stock: producto.stock,
      imagen: producto.imagen,
      activo: producto.activo
    };
    this.formErrors = {};
    this.showProductModal = true;
  }
  closeProductModal() {
    this.showProductModal = false;
    this.editingProduct = null;
    this.productForm = this.getEmptyProductForm();
    this.formErrors = {};
  }
  saveProduct() {
    this.formErrors = {};
    if (!this.isValidProductForm()) {
      return;
    }
    if (this.editingProduct) {
      this.backendService.updateProducto(this.editingProduct.id, this.productForm as UpdateProductoDto).subscribe({
        next: (updatedProduct: ProductoDto) => {
          this.showSuccessMessage(`Producto "${updatedProduct.nombre}" actualizado exitosamente`);
          this.loadProductos();
          this.closeProductModal();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.handleFormError(error);
        }
      });
    } else {
      this.backendService.createProducto(this.productForm as CreateProductoDto).subscribe({
        next: (newProduct: ProductoDto) => {
          this.showSuccessMessage(`Producto "${newProduct.nombre}" creado exitosamente`);
          this.loadProductos();
          this.closeProductModal();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.handleFormError(error);
        }
      });
    }
  }
  deleteProduct(producto: ProductoDto) {
    if (!confirm(`¿Está seguro de eliminar el producto "${producto.nombre}"?`)) {
      return;
    }
    this.backendService.deleteProducto(producto.id).subscribe({
      next: () => {
        this.showSuccessMessage(`Producto "${producto.nombre}" eliminado exitosamente`);
        this.loadProductos();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showErrorMessage('Error al eliminar el producto: ' + error.message);
      }
    });
  }
  toggleProductStatus(producto: ProductoDto) {
    const newStatus = !producto.activo;
    const statusText = newStatus ? 'activar' : 'desactivar';
    if (!confirm(`¿Está seguro de ${statusText} el producto "${producto.nombre}"?`)) {
      return;
    }
    this.backendService.toggleProductoStatus(producto.id, newStatus).subscribe({
      next: (updatedProduct: ProductoDto) => {
        this.showSuccessMessage(`Producto "${updatedProduct.nombre}" ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
        this.loadProductos();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showErrorMessage('Error al actualizar el estado: ' + error.message);
      }
    });
  }

  // === SELECCIÓN MASIVA ===
  toggleProductSelection(productoId: number, event: any) {
    if (event.target.checked) {
      if (!this.selectedProductos.includes(productoId)) {
        this.selectedProductos.push(productoId);
      }
    } else {
      this.selectedProductos = this.selectedProductos.filter(id => id !== productoId);
    }
  }
  selectAllProducts(event: any) {
    if (event.target.checked) {
      this.selectedProductos = this.productos.map(p => p.id);
    } else {
      this.selectedProductos = [];
    }
  }
  allProductsSelected(): boolean {
    return this.productos.length > 0 && this.selectedProductos.length === this.productos.length;
  }
  bulkActivateProducts() {
    if (this.selectedProductos.length === 0) {
      this.showWarningMessage('Seleccione al menos un producto');
      return;
    }
    this.executeBulkOperation('activate', 'activar');
  }
  bulkDeactivateProducts() {
    if (this.selectedProductos.length === 0) {
      this.showWarningMessage('Seleccione al menos un producto');
      return;
    }
    this.executeBulkOperation('deactivate', 'desactivar');
  }
  bulkDeleteProducts() {
    if (this.selectedProductos.length === 0) {
      this.showWarningMessage('Seleccione al menos un producto');
      return;
    }
    if (!confirm(`¿Está seguro de eliminar ${this.selectedProductos.length} productos seleccionados?`)) {
      return;
    }
    this.executeBulkOperation('delete', 'eliminar');
  }
  private executeBulkOperation(operacion: string, accionTexto: string) {
    const bulkOperation: BulkProductoOperationDto = {
      productoIds: [...this.selectedProductos],
      operacion: operacion
    };
    this.backendService.bulkProductoOperation(bulkOperation).subscribe({
      next: () => {
        this.showSuccessMessage(`${this.selectedProductos.length} productos ${accionTexto}dos exitosamente`);
        this.selectedProductos = [];
        this.loadProductos();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showErrorMessage(`Error al ${accionTexto} productos: ` + error.message);
      }
    });
  }

  // === FORMULARIO Y VALIDACIÓN ===
  getEmptyProductForm(): CreateProductoDto {
    return {
      nombre: '',
      descripcion: '',
      precio: 0,
      costo: 0,
      stock: 0,
      imagen: '',
      activo: true
    };
  }
  isValidProductForm(): boolean {
    const errors: { [key: string]: string } = {};
    if (!this.productForm.nombre.trim()) {
      errors['nombre'] = 'El nombre es requerido';
    }
    if (!this.productForm.descripcion.trim()) {
      errors['descripcion'] = 'La descripción es requerida';
    }
    if (this.productForm.precio <= 0) {
      errors['precio'] = 'El precio debe ser mayor a 0';
    }
    if (this.productForm.costo < 0) {
      errors['costo'] = 'El costo no puede ser negativo';
    }
    if (this.productForm.stock < 0) {
      errors['stock'] = 'El stock no puede ser negativo';
    }
    this.formErrors = errors;
    return Object.keys(errors).length === 0;
  }
  private handleFormError(error: any) {
    if (error.status === 400 && error.error.errors) {
      const modelErrors = error.error.errors;
      Object.keys(modelErrors).forEach(key => {
        const fieldName = key.toLowerCase();
        this.formErrors[fieldName] = modelErrors[key][0];
      });
    } else {
      this.showErrorMessage('Error al guardar el producto: ' + error.message);
    }
  }

  // === COMENTARIOS (solo Cliente) ===
  loadComentarios() {
    this.backendService.getComentarios().subscribe(
      comentarios => {
        this.comentarios = comentarios;
      },
      error => {
        console.error('Error al cargar los comentarios:', error);
      }
    );
  }
  setCalificacion(calificacion: number) {
    this.newComentario.calificacion = calificacion;
  }
  showComentariosDialog(productoId: number) {
    this.productoSeleccionado = productoId;
    this.loadComentariosByProducto(productoId);
    this.visibleComentarios = true;
  }
  showAgregarComentarioDialog() {
    this.visibleComentarios = false;
    setTimeout(() => {
      this.visibleAgregarComentario = true;
    }, 100);
  }
  volverAComentarios() {
    this.visibleAgregarComentario = false;
    setTimeout(() => {
      this.visibleComentarios = true;
    }, 100);
  }
  loadComentariosByProducto(productoId: number) {
    this.backendService.getComentariosByProducto(productoId).subscribe({
      next: (comentarios) => {
        this.comentarios = comentarios;
      },
      error: (error) => {
        console.error('Error al cargar comentarios:', error);
      }
    });
  }
  hideAllDialogs() {
    this.visibleComentarios = false;
    this.visibleAgregarComentario = false;
    this.resetFormulario();
  }
  resetFormulario() {
    this.newComentario = {
      texto: '',
      fechaHora: '',
      usuarioId: Number(this.currentUser.id),
      calificacion: 0,
      activo: true
    };
    this.hoverCalificacion = 0;
  }
  postComentario() {
    const comentarioToSend = {
      texto: this.newComentario.texto,
      usuarioId: Number(this.currentUser.id),
      calificacion: this.newComentario.calificacion,
      activo: this.newComentario.activo,
      productoId: this.productoSeleccionado
    } as any;
    this.backendService.createComentario(comentarioToSend).subscribe({
      next: () => {
        this.resetFormulario();
        this.loadComentariosByProducto(this.productoSeleccionado);
        this.volverAComentarios();
      },
      error: (error) => {
        console.error('Error al crear comentario:', error);
      }
    });
  }

  // === FORMATOS Y UTILIDADES ===
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  getStockStatusClass(stock: number): string {
    if (stock === 0) return 'badge badge-danger';
    if (stock <= 10) return 'badge badge-warning';
    return 'badge badge-success';
  }
  getStatusClass(activo: boolean): string {
    return activo ? 'badge badge-success' : 'badge badge-secondary';
  }
  getSortIcon(column: string): string {
    if (this.filtros.sortBy !== column) return 'fa-sort';
    return this.filtros.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
  trackByProductId(index: number, producto: ProductoDto): number {
    return producto.id;
  }

  // === MENSAJES ===
  private showSuccessMessage(message: string) {
    console.log('✅ Success:', message);
  }
  private showErrorMessage(message: string) {
    console.error('❌ Error:', message);
    alert(message);
  }
  private showWarningMessage(message: string) {
    console.warn('⚠️ Warning:', message);
    alert(message);
  }

  // === EXPORTACIÓN ===
  exportProductsData() {
    const csvData = this.convertToCSV(this.productos);
    this.downloadCSV(csvData, 'productos.csv');
  }
  private convertToCSV(data: ProductoDto[]): string {
    const headers = ['ID', 'Nombre', 'Descripción', 'Precio', 'Costo', 'Stock', 'Estado', 'Fecha Creación'];
    const csvContent = [
      headers.join(','),
      ...data.map(p => [
        p.id,
        `"${p.nombre}"`,
        `"${p.descripcion}"`,
        p.precio,
        p.costo,
        p.stock,
        p.activo ? 'Activo' : 'Inactivo',
        this.formatDate(p.fechaCreacion)
      ].join(','))
    ].join('\n');
    return csvContent;
  }
  private downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // === CONVENIENCIA ===
  refreshProducts() {
    this.loadProductos();
  }
  resetFilters() {
    this.filtros = {
      searchTerm: '',
      statusFilter: 'all',
      stockFilter: 'all',
      page: 1,
      pageSize: 10,
      sortBy: 'fechaCreacion',
      sortDirection: 'desc'
    };
    this.loadProductos();
  }
  duplicateProduct(producto: ProductoDto) {
    this.editingProduct = null;
    this.productForm = {
      nombre: `${producto.nombre} (Copia)`,
      descripcion: producto.descripcion,
      precio: producto.precio,
      costo: producto.costo,
      stock: 0,
      imagen: producto.imagen,
      activo: true
    };
    this.formErrors = {};
    this.showProductModal = true;
  }

  private convertToDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date();
    }
    if (dateValue instanceof Date) {
      return dateValue;
    }
    if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    return new Date();
  }
}
