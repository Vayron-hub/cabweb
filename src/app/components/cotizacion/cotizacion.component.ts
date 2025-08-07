import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EmailService, QuoteEmailData } from './../../services/email.service';

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
})
export class CotizacionComponent {
  selectedComponents: SelectedComponents = {
    esp32: '',
    servos: '',
    arduino: '',
    camera: '',
    mobileApp: false,
    webApp: false,
  };

  customerInfo: CustomerInfo = {
    name: '',
    email: '',
    phone: '',
    message: '',
  };

  // Precios actualizados en pesos mexicanos
  prices = {
    esp32: {
      basic: 700, // ~35 USD a peso mexicano
      advanced: 1100, // ~55 USD a peso mexicano
    },
    servos: {
      standard: 900, // ~45 USD a peso mexicano
      premium: 1700, // ~85 USD a peso mexicano
    },
    arduino: {
      uno: 500, // ~25 USD a peso mexicano
      nano: 360, // ~18 USD a peso mexicano
    },
    camera: {
      basic: 400, // ~20 USD a peso mexicano
      hd: 700, // ~35 USD a peso mexicano
    },
    apps: {
      mobile: 24000, // ~1200 USD a peso mexicano
      web: 16000, // ~800 USD a peso mexicano
    },
  };

  totalPrice: number = 0;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private messageService: MessageService,
    private emailService: EmailService
  ) {}

  selectComponent(category: string, option: string) {
    (this.selectedComponents as any)[category] = option;
    this.updateTotal();
  }

  updateTotal() {
    this.totalPrice = 0;

    // Calcular hardware
    if (this.selectedComponents.esp32) {
      this.totalPrice +=
        this.prices.esp32[
          this.selectedComponents.esp32 as keyof typeof this.prices.esp32
        ];
    }

    if (this.selectedComponents.servos) {
      this.totalPrice +=
        this.prices.servos[
          this.selectedComponents.servos as keyof typeof this.prices.servos
        ];
    }

    if (this.selectedComponents.arduino) {
      this.totalPrice +=
        this.prices.arduino[
          this.selectedComponents.arduino as keyof typeof this.prices.arduino
        ];
    }

    if (this.selectedComponents.camera) {
      this.totalPrice +=
        this.prices.camera[
          this.selectedComponents.camera as keyof typeof this.prices.camera
        ];
    }

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
    return (
      this.customerInfo.name.trim() !== '' &&
      this.customerInfo.email.trim() !== '' &&
      this.customerInfo.phone.trim() !== '' &&
      this.validateEmail(this.customerInfo.email)
    );
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async sendQuote() {
    if (!this.isFormValid() || this.totalPrice === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail:
          'Por favor complete todos los campos y seleccione al menos un componente',
      });
      return;
    }

    this.isLoading = true;

    // Preparar datos para envío
    const quoteData: QuoteEmailData = {
      customer: this.customerInfo,
      components: this.selectedComponents,
      prices: this.getSelectedPrices(),
      total: this.totalPrice,
      date: new Date().toISOString(),
    };

    quoteData.customer.phone = quoteData.customer.phone.toString();

    try {
      const emailSent = await this.emailService.sendQuoteEmail(quoteData);

      console.log('Datos a enviar a EmailService:', {
        customer: quoteData.customer,
        components: quoteData.components,
        prices: quoteData.prices,
        total: quoteData.total,
        date: quoteData.date,
      });

      if (emailSent) {
        this.messageService.add({
          severity: 'success',
          summary: 'Cotización Enviada',
          detail: `¡Gracias ${this.customerInfo.name}! Tu cotización ha sido enviada a ${this.customerInfo.email}. Te contactaremos pronto.`,
        });

        setTimeout(() => {
          this.resetForm();
        }, 3000);
      } else {
        throw new Error('Error al enviar el email');
      }
    } catch (error) {
      console.error('Error al enviar cotización:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Envío',
        detail:
          'No se pudo enviar la cotización. Por favor intenta nuevamente o contacta al soporte.',
      });
    } finally {
      this.isLoading = false;
    }
  }

  private getSelectedPrices(): any {
    const selectedPrices: any = {};

    // Precios de hardware
    if (this.selectedComponents.esp32) {
      selectedPrices.esp32 = this.getCurrentPrice('esp32');
    }

    if (this.selectedComponents.servos) {
      selectedPrices.servos = this.getCurrentPrice('servos');
    }

    if (this.selectedComponents.arduino) {
      selectedPrices.arduino = this.getCurrentPrice('arduino');
    }

    if (this.selectedComponents.camera) {
      selectedPrices.camera = this.getCurrentPrice('camera');
    }

    if (this.selectedComponents.mobileApp) {
      selectedPrices.mobileApp = this.prices.apps.mobile;
    }

    if (this.selectedComponents.webApp) {
      selectedPrices.webApp = this.prices.apps.web;
    }

    return selectedPrices;
  }

  private resetForm() {
    this.selectedComponents = {
      esp32: '',
      servos: '',
      arduino: '',
      camera: '',
      mobileApp: false,
      webApp: false,
    };

    this.customerInfo = {
      name: '',
      email: '',
      phone: '',
      message: '',
    };

    this.totalPrice = 0;
  }

  goBack() {
    this.router.navigate(['/']);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('es-MX');
  }
}
