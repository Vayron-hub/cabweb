import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface SelectedComponents {
  esp32: string;
  servos: string;
  arduino: string;
  camera: string;
  mobileApp: boolean;
  webApp: boolean;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  message: string;
}

@Component({
  selector: 'app-cotizacion',
  imports: [CommonModule, FormsModule, CheckboxModule, ToastModule],
  providers: [MessageService],
  templateUrl: './cotizacion.component.html',
  styleUrls: ['./cotizacion.component.css']
})
export class CotizacionComponent {
  
  selectedComponents: SelectedComponents = {
    esp32: '',
    servos: '',
    arduino: '',
    camera: '',
    mobileApp: false,
    webApp: false
  };

  customerInfo: CustomerInfo = {
    name: '',
    email: '',
    phone: '',
    message: ''
  };

  prices = {
    esp32: {
      basic: 35,
      advanced: 55
    },
    servos: {
      standard: 45,
      premium: 85
    },
    arduino: {
      uno: 25,
      nano: 18
    },
    camera: {
      basic: 20,
      hd: 35
    },
    apps: {
      mobile: 1200,
      web: 800
    }
  };

  totalPrice: number = 0;

  constructor(
    private router: Router,
    private messageService: MessageService
  ) {}

  selectComponent(category: string, option: string) {
    (this.selectedComponents as any)[category] = option;
    this.updateTotal();
  }

  updateTotal() {
    this.totalPrice = 0;
    
    // Calcular hardware
    if (this.selectedComponents.esp32) {
      this.totalPrice += this.prices.esp32[this.selectedComponents.esp32 as keyof typeof this.prices.esp32];
    }
    
    if (this.selectedComponents.servos) {
      this.totalPrice += this.prices.servos[this.selectedComponents.servos as keyof typeof this.prices.servos];
    }
    
    if (this.selectedComponents.arduino) {
      this.totalPrice += this.prices.arduino[this.selectedComponents.arduino as keyof typeof this.prices.arduino];
    }
    
    if (this.selectedComponents.camera) {
      this.totalPrice += this.prices.camera[this.selectedComponents.camera as keyof typeof this.prices.camera];
    }
    
    // Calcular apps
    if (this.selectedComponents.mobileApp) {
      this.totalPrice += this.prices.apps.mobile;
    }
    
    if (this.selectedComponents.webApp) {
      this.totalPrice += this.prices.apps.web;
    }
  }

  getCurrentPrice(category: string): number {
    const selected = (this.selectedComponents as any)[category];
    if (!selected) return 0;
    
    return (this.prices as any)[category][selected] || 0;
  }

  isFormValid(): boolean {
    return this.customerInfo.name.trim() !== '' && 
           this.customerInfo.email.trim() !== '' && 
           this.customerInfo.phone.trim() !== '' &&
           this.validateEmail(this.customerInfo.email);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  sendQuote() {
    if (!this.isFormValid() || this.totalPrice === 0) {
      this.messageService.add({
        severity: 'error', 
        summary: 'Error', 
        detail: 'Por favor complete todos los campos y seleccione al menos un componente'
      });
      return;
    }

    // Preparar datos para envío
    const quoteData = {
      customer: this.customerInfo,
      components: this.selectedComponents,
      prices: this.getSelectedPrices(),
      total: this.totalPrice,
      date: new Date().toISOString()
    };

    // Simular envío de email
    console.log('Cotización enviada:', quoteData);
    
    // En un entorno real, aquí harías una llamada HTTP a tu backend
    this.simulateEmailSend(quoteData);
  }

  private getSelectedPrices() {
    const selectedPrices: any = {};
    
    Object.keys(this.selectedComponents).forEach(key => {
      const value = (this.selectedComponents as any)[key];
      if (value && typeof value === 'string') {
        selectedPrices[key] = this.getCurrentPrice(key);
      } else if (value === true) {
        selectedPrices[key] = (this.prices.apps as any)[key.replace('App', '')];
      }
    });
    
    return selectedPrices;
  }

  private simulateEmailSend(quoteData: any) {
    // Simular delay de envío
    setTimeout(() => {
      this.messageService.add({
        severity: 'success', 
        summary: 'Cotización Enviada', 
        detail: `¡Gracias ${this.customerInfo.name}! Tu cotización ha sido enviada a ${this.customerInfo.email}. Te contactaremos pronto.`
      });

      // Opcional: resetear formulario después del envío
      setTimeout(() => {
        this.resetForm();
      }, 3000);
    }, 1500);
  }

  private resetForm() {
    this.selectedComponents = {
      esp32: '',
      servos: '',
      arduino: '',
      camera: '',
      mobileApp: false,
      webApp: false
    };
    
    this.customerInfo = {
      name: '',
      email: '',
      phone: '',
      message: ''
    };
    
    this.totalPrice = 0;
  }

  goBack() {
    this.router.navigate(['/']);
  }
}