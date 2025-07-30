import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    CardModule, 
    InputTextModule, 
    PasswordModule, 
    ButtonModule, 
    MessageModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  returnUrl: string = '';
  queryType: string = '';
  
  // Nuevas propiedades para mejorar UX
  showPassword: boolean = false;
  rememberMe: boolean = false;
  isLoading: boolean = false;
  showHelpModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private backendService: BackendService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
    this.queryType = this.route.snapshot.queryParams['type'] || '';
    
    // Cargar credenciales recordadas si existen
    this.loadRememberedCredentials();
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { username, password } = this.loginForm.value;
      
      // Usar el nuevo sistema de autenticación con backend
      this.authService.login(username, password).subscribe({
        next: (success) => {
          if (success) {
            console.log('✅ Login exitoso');
            
            // Guardar credenciales si el usuario quiere recordarlas
            if (this.rememberMe) {
              this.saveCredentials(username, password);
            } else {
              this.clearSavedCredentials();
            }
            
            // Navegación exitosa
            if (this.queryType) {
              this.router.navigate([this.returnUrl], { queryParams: { type: this.queryType } });
            } else {
              this.router.navigate([this.returnUrl]);
            }
          } else {
            this.errorMessage = 'Usuario o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.';
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('❌ Error en login:', error);
          this.errorMessage = 'Error al conectar con el servidor. Intenta nuevamente.';
          this.isLoading = false;
        }
      });
    }
  }

  // === MÉTODOS PARA MEJORAR UX ===
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  showForgotPassword(): void {
    alert('Función de recuperación de contraseña - Por implementar\n\nPor ahora, contacta al administrador del sistema.');
  }

  showHelp(): void {
    this.showHelpModal = true;
  }

  closeHelpModal(): void {
    this.showHelpModal = false;
  }

  // === MÉTODOS PARA RECORDAR CREDENCIALES ===
  
  private loadRememberedCredentials(): void {
    const savedCredentials = localStorage.getItem('rememberedCredentials');
    if (savedCredentials) {
      const { username, password } = JSON.parse(savedCredentials);
      this.loginForm.patchValue({ username, password });
      this.rememberMe = true;
    }
  }

  private saveCredentials(username: string, password: string): void {
    localStorage.setItem('rememberedCredentials', JSON.stringify({ username, password }));
  }

  private clearSavedCredentials(): void {
    localStorage.removeItem('rememberedCredentials');
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
