import { Component, Input, OnInit } from '@angular/core';
import { BackendService, Venta} from '../../services/backend.service';
import { User } from '../productos/productos';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-inventario',
  imports: [CommonModule],
  templateUrl: './inventario.html',
})
export class InventarioComponent implements OnInit {
  @Input() currentUser: User = {
    id: '',
    nombre: '',
    email: '',
    rol: '',
    ultimoAcceso: new Date(),
  };

  constructor(private backendService: BackendService) { }

  ngOnInit(): void {
      this.getCurrentUser();
      this.loadVentasByIdUser();
      this.getProductos(); // Agregar esta línea para cargar productos
  }

  ventas: Venta[] = []
  productos: any[] = []; // Para almacenar los productos y hacer el mapeo

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
    } else {
      console.warn('Usuario no encontrado');
    }
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

  loadVentasByIdUser(){
    this.backendService.getVentas().subscribe(ventas => {
      this.ventas = ventas.filter(venta => venta.usuarioId === this.currentUser.id);
      console.log('Ventas del usuario actual:', this.ventas);
    });
  }

  // Método para obtener productos
  getProductos() {
    this.backendService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
      },
      error: (error) => {
        console.error('Error al obtener productos:', error);
      }
    });
  }

  // Método para obtener el nombre del producto por ID
  getNombreProducto(productoId: number): string {
    const producto = this.productos.find(p => p.id === productoId);
    
    if (producto) {
      return producto.nombre;
    }
    
    // Si no encuentra el producto, usar el mapeo que especificaste
    switch (productoId) {
      case 1:
        return 'CAB Clasificador Mini';
      case 2:
        return 'CAB Clasificador';
      default:
        return `Producto ID: ${productoId}`;
    }
  }

}
