import { Component, Input, OnInit } from '@angular/core';
import { BackendService, newComent, Producto } from '../../services/backend.service';
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
@Component({
  selector: 'app-productos',
  imports: [CommonModule,DialogModule, FormsModule, ButtonModule, InputTextModule],
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

  constructor(
    private backendService: BackendService
  ){}

  ngOnInit(){
    this.getCurrentUser();
    this.getProductos();
    this.loadComentarios();
  }

  productos: Producto[]=[];
  comentarios: Comentario[] = [];
  usercomentarios: Comentario[] = [];
  visible: boolean = false;
  visiblePostC: boolean = false;
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
  productoSeleccionado: number = 0;

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
      console.log('Usuario actual:', this.currentUser);
    } else {
      console.warn('Usuario no encontrado');
    }
  }

  getProductos(){
    this.backendService.getProductos().subscribe({
      next: (productos) => {
        console.log('Productos obtenidos:', productos);
        this.productos = productos.map(p => ({
          ...p,
          precio: String(p.precio)
        }));
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
    // Agregar el ID del producto al comentario
    const comentarioToSend = {
      texto: this.newComentario.texto,
      usuarioId: this.currentUser.id as number,
      calificacion: this.newComentario.calificacion,
      activo: this.newComentario.activo,
      productoId: this.productoSeleccionado
    } as any;

    this.backendService.createComentario(comentarioToSend).subscribe({
      next: (response) => {
        console.log('Comentario creado:', response);
        this.resetFormulario();
        this.loadComentariosByProducto(this.productoSeleccionado); // Recargar comentarios
        this.volverAComentarios(); // Volver al modal de comentarios
      },
      error: (error) => {
        console.error('Error al crear comentario:', error);
      }
    });
  }

}
