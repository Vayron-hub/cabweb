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
  selector: 'app-registro',
  standalone: true,
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
  templateUrl: './registro.html',
})
export class Registro implements OnInit {
  registroForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  returnUrl: string = '';
  queryType: string = '';
  
  // Propiedades para mejorar UX
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  showHelpModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private backendService: BackendService
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.email, Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
    this.queryType = this.route.snapshot.queryParams['type'] || '';
  }

  // Validador personalizado para confirmar contraseñas
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  onSubmit() {
    if (this.registroForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const { nombre, correo, password } = this.registroForm.value;
      const userData = { nombre, correo, password };

      console.log('📝 Iniciando registro para:', { nombre, correo });

      // Usar el nuevo método de registro y login automático
      this.authService.registerAndLogin(userData).subscribe({
        next: (success) => {
          this.isLoading = false;
          
          if (success) {
            console.log('✅ Registro y login exitosos');
            this.successMessage = '¡Registro exitoso! Bienvenido al sistema.';
            
            // Esperar un momento para mostrar el mensaje de éxito
            setTimeout(() => {
              // Navegación exitosa
              if (this.queryType) {
                this.router.navigate([this.returnUrl], { queryParams: { type: this.queryType } });
              } else {
                this.router.navigate([this.returnUrl]);
              }
            }, 1500);
            
          } else {
            this.errorMessage = 'Error al registrar usuario. Verifica que el correo no esté ya registrado.';
          }
        },
        error: (error) => {
          console.error('❌ Error en registro:', error);
          this.isLoading = false;
          
          if (error.status === 409) {
            this.errorMessage = 'Este correo electrónico ya está registrado. Intenta con otro correo.';
          } else if (error.status === 400) {
            this.errorMessage = 'Datos inválidos. Verifica la información ingresada.';
          } else {
            this.errorMessage = 'Error al conectar con el servidor. Intenta nuevamente.';
          }
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.registroForm.controls).forEach(key => {
        this.registroForm.get(key)?.markAsTouched();
      });
    }
  }

  // === MÉTODOS PARA VALIDACIÓN ===
  
  getFieldError(fieldName: string): string {
    const field = this.registroForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} es obligatorio`;
      if (field.errors['email']) return 'Ingresa un correo electrónico válido';
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${minLength} caracteres`;
      }
      if (field.errors['passwordMismatch']) return 'Las contraseñas no coinciden';
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: {[key: string]: string} = {
      'nombre': 'El nombre',
      'correo': 'El correo electrónico',
      'password': 'La contraseña',
      'confirmPassword': 'La confirmación de contraseña'
    };
    return displayNames[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registroForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  // === MÉTODOS PARA MEJORAR UX ===
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  showHelp(): void {
    this.showHelpModal = true;
  }

  closeHelpModal(): void {
    this.showHelpModal = false;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
