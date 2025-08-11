import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackendService, newComent } from '../../services/backend.service';
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
  Activo: boolean;
}

export interface User {
  id: string | number;
  nombre: string;
  email: string;
  rol: string;
  ultimoAcceso?: Date;
}

@Component({
  selector: 'app-client-comentarios',
  imports: [CommonModule, DialogModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './cliente-comentarios.html',
})
export class ClienteComentarios implements OnInit {
  @Input() currentUser: User = {
    id: '',
    nombre: '',
    email: '',
    rol: '',
  };

  constructor(
    private backendService: BackendService,
  ) { }

  comentarios: Comentario[] = [];
  usercomentarios: Comentario[] = [];
  visible: boolean = false;
  hoverCalificacion: number = 0; // Agregar esta propiedad

  ngOnInit() {
    this.loadComentarios();
    this.getCurrentUser();
    this.loadUserComentarios();
  }

  newComentario: newComent = {
    texto: '',
    fechaHora: '',
    usuarioId: Number(this.currentUser.id),
    calificacion: 0,
    activo: true,
  };

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

  loadUserComentarios() {
    this.backendService.getComentarios().subscribe(
      comentarios => {
        this.usercomentarios = comentarios.filter(com => com.usuarioId === this.currentUser.id);
      },
      error => {
        console.error('Error al cargar los comentarios del usuario:', error);
      }
    );
  }

  getCurrentUser() {
    const user = this.backendService.getCurrentUser();
    if (user) {
      this.currentUser = {
        id: user.id || '',
        nombre: user.nombre || '',
        email: user.correo || '',
        rol: user.rol,
      };
      this.newComentario.usuarioId = this.currentUser.id as number;
    } else {
      // Handle the case when user is null
      console.warn('Usuario no encontrado');
      // Keep the existing default user or redirect to login
    }
  }

  setCalificacion(calificacion: number) {
    this.newComentario.calificacion = calificacion;
  }

  showDialog() {
    this.visible = true;
  }

  onDialogHide() {
    this.visible = false;
    // Forzar la limpieza del overlay
    setTimeout(() => {
      const overlays = document.querySelectorAll('.p-dialog-mask');
      overlays.forEach(overlay => overlay.remove());
    }, 100);
  }

  hideDialog() {
    this.visible = false;
    this.newComentario = {
      texto: '',
      fechaHora: '',
      usuarioId: this.currentUser.id as number,
      calificacion: 0,
      activo: true
    };
    this.hoverCalificacion = 0; // Reset hover state
    
    setTimeout(() => {
      const overlays = document.querySelectorAll('.p-dialog-mask');
      overlays.forEach(overlay => overlay.remove());
    }, 100);
  }

  
  postComentario() {
    const comentarioToSend = {
      Texto: this.newComentario.texto,
      FechaHora: new Date().toISOString(),
      UsuarioId: this.currentUser.id as number,
      Calificacion: this.newComentario.calificacion,
      Activo: this.newComentario.activo
    } as any;

    console.log('Enviando comentario:', comentarioToSend);
    this.backendService.createComentario(comentarioToSend).subscribe({
      next: (response) => {
        console.log('Comentario creado:', response);
        this.hideDialog();
        this.loadComentarios();
        this.loadUserComentarios();
      },
      error: (error) => {
        console.error('Error al crear comentario:', error);
      }
    });
  }
}
