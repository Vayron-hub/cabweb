import { Component, Input, OnInit } from '@angular/core';
import { BackendService, newComent, Producto, Venta } from '../../services/backend.service'; // Agregar Venta aquí
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

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

// Agregar la interfaz VentaDetalle que faltaba
export interface VentaDetalle {
  id?: number;
  ventaId?: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subTotal: number;
}

@Component({
  selector: 'app-productos',
  imports: [CommonModule, DialogModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './productos.html',
})
export class ProductosComponent implements OnInit {
  @Input() currentUser: User = {
    id: '',
    nombre: '',
    email: '',
    rol: '',
    ultimoAcceso: new Date(),
  };


  venta: Venta = {
    numeroVenta: '',
    fechaVenta: new Date(),
    usuarioId: Number(this.currentUser.id),
    cantidad: 0,
    precioUnitario: 0,
    subTotal: 0,
    total: 0,
    estatus: 'Pendiente',
    direccionEnvio: '',
    observaciones: '',
    detalles: []
  };

  constructor(
    private backendService: BackendService
  ) { }

  ngOnInit() {
    this.getCurrentUser();
    this.getProductos();
    this.loadComentarios();
    this.getLastVentaNumero();
  }

  productos: Producto[] = [];
  comentarios: Comentario[] = [];
  usercomentarios: Comentario[] = [];
  visible: boolean = false;
  visiblePostC: boolean = false;
  visibleCompra: boolean = false;
  hoverCalificacion: number = 0;

  newComentario: newComent = {
    texto: '',
    fechaHora: '',
    usuarioId: Number(this.currentUser.id),
    calificacion: 0,
    activo: true,

  };

  visibleComentarios: boolean = false;
  visibleAgregarComentario: boolean = false;
  productoSeleccionado: any = null;
  anio: number = new Date().getFullYear();
  templateNV: string = 'V-' + this.anio + '-';

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

  getLastVentaNumero(){
    this.backendService.getVentas().subscribe({
      next: (numero) => {
        let numeroF = Number(numero.map((venta: any) => venta.numeroVenta).sort().pop().slice(-3));
        let numeroFormateado = (numeroF + 1).toString().padStart(3, '0');
        this.templateNV += numeroFormateado;
        console.log('Último número de venta:', numeroF, 'Nuevo número:', this.templateNV);
      },
      error: (error) => {
        console.error('Error al obtener el último número de venta:', error);
        this.templateNV += '000';
      }
    });
  }

  getProductos() {
    this.backendService.getProductos().subscribe({
      next: (productos) => {
<<<<<<< HEAD
        this.productos = productos;
=======
        console.log('Productos obtenidos:', productos);
        this.productos = productos.map(p => ({
          ...p,
          precio: String(p.precio)
        }));
>>>>>>> e541e4af15220dadd3b21ea3b0046e0b65a639d7
      },
      error: (error) => {
        console.error('Error al obtener productos:', error);
      }
    });
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

  showPostDialog() {
    this.visiblePostC = true;
  }

  showDialog() {
    this.visible = true;
  }

  showComentariosDialog(productoId: number) {
    this.productoSeleccionado = productoId;
    this.loadComentariosByProducto(productoId);
    this.visibleComentarios = true;
  }

  showAgregarComentarioDialog() {
    this.visibleComentarios = false;

    // Usar setTimeout para evitar conflictos entre modales
    setTimeout(() => {
      this.visibleAgregarComentario = true;
    }, 100);
  }

  volverAComentarios() {
    this.visibleAgregarComentario = false;

    // Usar setTimeout para evitar conflictos entre modales
    setTimeout(() => {
      this.visibleComentarios = true;
    }, 100);
  }

  loadComentariosByProducto(productoId: number) {
    // Cargar comentarios específicos del producto
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
      usuarioId: this.currentUser.id as number,
      calificacion: 0,
      activo: true
    };
    this.hoverCalificacion = 0;
  }

  postComentario() {
    const comentarioToSend = {
      texto: this.newComentario.texto,
      usuarioId: this.currentUser.id as number,
      calificacion: this.newComentario.calificacion,
      activo: this.newComentario.activo,
      productoId: this.productoSeleccionado
    } as any;

    this.backendService.createComentario(comentarioToSend).subscribe({
      next: (response) => {
        this.resetFormulario();
        this.loadComentariosByProducto(this.productoSeleccionado); 
        this.volverAComentarios(); 
      },
      error: (error) => {
        console.error('Error al crear comentario:', error);
      }
    });
  }

  abrirVenta(productoId: number) {
    this.productoSeleccionado = this.productos.find(p => p.id === productoId);
    
    if (this.productoSeleccionado) {
      // Crear el detalle de venta
      const detalle: VentaDetalle = {
        productoId: productoId,
        cantidad: 1,
        precioUnitario: this.productoSeleccionado.precio,
        subTotal: this.productoSeleccionado.precio
      };

      this.venta = {
        numeroVenta: this.templateNV,
        usuarioId: Number(this.currentUser.id),
        cantidad: 1,
        precioUnitario: this.productoSeleccionado.precio,
        subTotal: this.productoSeleccionado.precio,
        total: this.productoSeleccionado.precio,
        fechaVenta: new Date(),
        estatus: 'Pendiente',
        direccionEnvio: '',
        observaciones: '',
        detalles: [detalle]
      };
      
      this.visibleCompra = true;
    }
  }

  calcularTotales() {
    if (this.productoSeleccionado && this.venta.cantidad && this.venta.cantidad > 0) {
      this.venta.precioUnitario = this.productoSeleccionado.precio;
      this.venta.subTotal = this.productoSeleccionado.precio * this.venta.cantidad;
      this.venta.total = this.venta.subTotal;

      if (this.venta.detalles && this.venta.detalles.length > 0) {
        this.venta.detalles[0].cantidad = this.venta.cantidad;
        this.venta.detalles[0].precioUnitario = this.productoSeleccionado.precio;
        this.venta.detalles[0].subTotal = this.productoSeleccionado.precio * this.venta.cantidad;
      }
    } else {
      this.venta.subTotal = 0;
      this.venta.total = 0;
      if (this.venta.detalles && this.venta.detalles.length > 0) {
        this.venta.detalles[0].subTotal = 0;
      }
    }
  }

  closeVenta() {
    this.visibleCompra = false;
    this.productoSeleccionado = null;
    
    this.venta = {
      numeroVenta: '',
      fechaVenta: new Date(),
      usuarioId: Number(this.currentUser.id),
      cantidad: 0,
      precioUnitario: 0,
      subTotal: 0,
      total: 0,
      estatus: 'Pendiente',
      direccionEnvio: '',
      observaciones: '',
      detalles: []
    };
  }

  procesarVenta() {
    if (!this.venta.cantidad || this.venta.cantidad <= 0) {
      console.error('Cantidad inválida');
      return;
    }

    if (this.venta.cantidad > this.productoSeleccionado?.stock) {
      console.error('Cantidad excede el stock disponible');
      return;
    }

    this.venta.numeroVenta = this.templateNV;
    this.venta.fechaVenta = new Date();
    this.calcularTotales(); 


    this.backendService.crearVenta(this.venta).subscribe({
      next: (response) => {
        console.log('Venta procesada con éxito');
        
        // Actualizar stock localmente
        if (this.productoSeleccionado) {
          this.productoSeleccionado.stock -= this.venta.cantidad;
        }
        
        this.closeVenta();
        
        this.templateNV = 'V-' + this.anio + '-';
        this.getLastVentaNumero();
      },
      error: (error) => {
        console.error('Error al procesar venta:', error);
        alert('Error al procesar la venta. Intenta nuevamente.');
      }
    });
  }

}
