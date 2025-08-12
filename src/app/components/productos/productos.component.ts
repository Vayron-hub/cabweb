import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BackendService, ProductoDto, CreateProductoDto, UpdateProductoDto, BulkProductoOperationDto, ProductoFilterDto, PagedProductoResponseDto } from '../../services/backend.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit, OnDestroy {
getStatusText(arg0: boolean): string {
throw new Error('Method not implemented.');
}
getStockStatusText(arg0: number): string {
throw new Error('Method not implemented.');
}
onImageError($event: ErrorEvent) {
throw new Error('Method not implemented.');
}
  
  // === VARIABLES PRINCIPALES ===
  productos: ProductoDto[] = [];
  pagedResponse: PagedProductoResponseDto | null = null;
  isLoadingProductos = false;
  selectedProductos: number[] = [];
  
  // === MODAL Y FORMULARIO ===
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
  
  private subscriptions = new Subscription();
  
  constructor(
    private backendService: BackendService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit() {
    this.loadProductos();
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  // === MÉTODOS DE CARGA ===
  
  loadProductos() {
    this.isLoadingProductos = true;
    
    const subscription = this.backendService.getProductosPaginado(this.filtros).subscribe({
      next: (response: PagedProductoResponseDto) => {
        console.log('✅ Productos obtenidos:', response);
        this.pagedResponse = response;
        this.productos = response.productos;
        this.isLoadingProductos = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando productos:', error);
        this.productos = [];
        this.pagedResponse = null;
        this.isLoadingProductos = false;
        this.showErrorMessage('Error al cargar los productos: ' + error.message);
        this.cdr.detectChanges();
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  // === FILTROS Y BÚSQUEDA ===
  
  onSearchChange() {
    this.filtros.page = 1; // Resetear a la primera página
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
    
    // Lógica para mostrar páginas (máximo 5 páginas visibles)
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
  
  // === OPERACIONES CRUD ===
  
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
    
    const subscription = this.editingProduct 
      ? this.updateProduct()
      : this.createProduct();
    
    this.subscriptions.add(subscription);
  }
  
  private createProduct() {
    const createDto = this.productForm as CreateProductoDto;
    
    return this.backendService.createProducto(createDto).subscribe({
      next: (newProduct: ProductoDto) => {
        console.log('✅ Producto creado:', newProduct);
        this.showSuccessMessage(`Producto "${newProduct.nombre}" creado exitosamente`);
        this.loadProductos(); // Recargar la lista
        this.closeProductModal();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error creando producto:', error);
        this.handleFormError(error);
      }
    });
  }
  
  private updateProduct() {
    if (!this.editingProduct) return;
    
    const updateDto = this.productForm as UpdateProductoDto;
    
    return this.backendService.updateProducto(this.editingProduct.id, updateDto).subscribe({
      next: (updatedProduct: ProductoDto) => {
        console.log('✅ Producto actualizado:', updatedProduct);
        this.showSuccessMessage(`Producto "${updatedProduct.nombre}" actualizado exitosamente`);
        this.loadProductos(); // Recargar la lista
        this.closeProductModal();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error actualizando producto:', error);
        this.handleFormError(error);
      }
    });
  }
  
  deleteProduct(producto: ProductoDto) {
    if (!confirm(`¿Está seguro de eliminar el producto "${producto.nombre}"?`)) {
      return;
    }
    
    const subscription = this.backendService.deleteProducto(producto.id).subscribe({
      next: (response) => {
        console.log('✅ Producto eliminado:', response);
        this.showSuccessMessage(`Producto "${producto.nombre}" eliminado exitosamente`);
        this.loadProductos();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error eliminando producto:', error);
        this.showErrorMessage('Error al eliminar el producto: ' + error.message);
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  toggleProductStatus(producto: ProductoDto) {
    const newStatus = !producto.activo;
    const statusText = newStatus ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Está seguro de ${statusText} el producto "${producto.nombre}"?`)) {
      return;
    }
    
    const subscription = this.backendService.toggleProductoStatus(producto.id, newStatus).subscribe({
      next: (updatedProduct: ProductoDto) => {
        console.log('✅ Estado actualizado:', updatedProduct);
        this.showSuccessMessage(`Producto "${updatedProduct.nombre}" ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
        this.loadProductos();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error actualizando estado:', error);
        this.showErrorMessage('Error al actualizar el estado: ' + error.message);
      }
    });
    
    this.subscriptions.add(subscription);
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
  
  someProductsSelected(): boolean {
    return this.selectedProductos.length > 0 && this.selectedProductos.length < this.productos.length;
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
    
    const subscription = this.backendService.bulkProductoOperation(bulkOperation).subscribe({
      next: (response) => {
        console.log('✅ Operación masiva completada:', response);
        this.showSuccessMessage(`${this.selectedProductos.length} productos ${accionTexto}dos exitosamente`);
        this.selectedProductos = [];
        this.loadProductos();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error en operación masiva:', error);
        this.showErrorMessage(`Error al ${accionTexto} productos: ` + error.message);
      }
    });
    
    this.subscriptions.add(subscription);
  }
  
  // === MÉTODOS AUXILIARES ===
  
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
      // Errores de validación del modelo
      const modelErrors = error.error.errors;
      Object.keys(modelErrors).forEach(key => {
        const fieldName = key.toLowerCase();
        this.formErrors[fieldName] = modelErrors[key][0];
      });
    } else {
      this.showErrorMessage('Error al guardar el producto: ' + error.message);
    }
  }
  
  // === MÉTODOS DE FORMATO ===
  
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
  
  // === MÉTODOS DE MENSAJES ===
  
  private showSuccessMessage(message: string) {
    // Implementar notificación de éxito
    console.log('✅ Success:', message);
    // Aquí podrías integrar con un servicio de notificaciones como ToastrService
  }
  
  private showErrorMessage(message: string) {
    // Implementar notificación de error
    console.error('❌ Error:', message);
    alert(message); // Temporal, reemplazar con un sistema de notificaciones mejor
  }
  
  private showWarningMessage(message: string) {
    // Implementar notificación de advertencia
    console.warn('⚠️ Warning:', message);
    alert(message); // Temporal, reemplazar con un sistema de notificaciones mejor
  }
  
  // === MÉTODOS DE EXPORTACIÓN ===
  
  exportProductsData() {
    console.log('📁 Exportando datos de productos...');
    // Implementar exportación a Excel/CSV
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
  
  trackByProductId(index: number, producto: ProductoDto): number {
    return producto.id;
  }
  
  // === MÉTODOS DE CONVENIENCIA ===
  
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
      stock: 0, // Nuevo producto sin stock inicial
      imagen: producto.imagen,
      activo: true
    };
    this.formErrors = {};
    this.showProductModal = true;
  }
}