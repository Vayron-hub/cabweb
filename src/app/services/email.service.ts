import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';

export interface QuoteEmailData {
  customer: {
    name: string;
    email: string;
    phone: string;
    message: string;
  };
  components: any;
  prices: any;
  total: number;
  date: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private readonly PUBLIC_KEY = 'iTy-uBnoQq_GAGTRb'; // Reemplazar con tu clave
  private readonly SERVICE_ID = 'service_v3nxv38'; // Reemplazar con tu service ID
  private readonly TEMPLATE_ID = 'template_k6czuau'; // Reemplazar con tu template ID

  constructor() {
    // Inicializar EmailJS
    emailjs.init(this.PUBLIC_KEY);
  }

  async sendQuoteEmail(quoteData: QuoteEmailData): Promise<boolean> {
    try {
      // Depuración: mostrar datos que se van a enviar
      console.log('Datos de cotización a enviar:', {
        customer: quoteData.customer,
        components: quoteData.components,
        prices: quoteData.prices,
        total: quoteData.total,
      });

      const customerPhone = quoteData.customer.phone.toString();

      const templateParams = {
        email: quoteData.customer.email, 
        customer_name: quoteData.customer.name,
        customer_email: quoteData.customer.email,
        customer_phone: customerPhone,
        customer_message:
          quoteData.customer.message || 'Sin comentarios adicionales',

      esp32_type: this.getComponentText('esp32', quoteData.components.esp32) || 'No seleccionado',
      servos_type: this.getComponentText('servos', quoteData.components.servos) || 'No seleccionado',
      arduino_type: this.getComponentText('arduino', quoteData.components.arduino) || 'No seleccionado',
      camera_type: this.getComponentText('camera', quoteData.components.camera) || 'No seleccionado',
      mobile_app: quoteData.components.mobileApp ? 'Sí' : 'No',
      web_app: quoteData.components.webApp ? 'Sí' : 'No',
      
      esp32_price: quoteData.prices.esp32 || 0,
      servos_price: quoteData.prices.servos || 0,
      arduino_price: quoteData.prices.arduino || 0,
      camera_price: quoteData.prices.camera || 0,
      mobile_app_price: quoteData.components.mobileApp ? (quoteData.prices.mobileApp || 0) : 0,
      web_app_price: quoteData.components.webApp ? (quoteData.prices.webApp || 0) : 0,
      
      total_price: quoteData.total,
      components_list: this.generateComponentsList(quoteData),
      
      quote_date: new Date().toLocaleString('es-MX')
    };

    console.log('Parámetros actualizados:', templateParams);

    const response = await emailjs.send(
      this.SERVICE_ID,
      this.TEMPLATE_ID,
      templateParams
    );

      console.log('Respuesta de EmailJS:', response);

      // EmailJS devuelve status 200 si se envía correctamente
      if (response.status === 200) {
        console.log(
          '✅ Email enviado exitosamente a:',
          quoteData.customer.email
        );
        return true;
      } else {
        console.error('❌ Error en EmailJS - Status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error completo al enviar email:', error);
      // Mostrar detalles del error
      if (error instanceof Error) {
        console.error('Mensaje de error:', error.message);
        console.error('Stack trace:', error.stack);
      }
      return false;
    }
  }

  private getComponentText(category: string, value: string): string {
    if (!value) return 'No seleccionado';

    const componentTexts: { [key: string]: { [key: string]: string } } = {
      esp32: {
        basic: 'ESP32-CAM Básico',
        advanced: 'ESP32-S3 Avanzado',
      },
      servos: {
        standard: 'Servos Estándar (3x SG90)',
        premium: 'Servos Premium (3x MG996R)',
      },
      arduino: {
        uno: 'Arduino Uno',
        nano: 'Arduino Nano',
      },
      camera: {
        basic: 'Cámara USB 720p',
        hd: 'Cámara USB 1080p HD',
      },
    };

    return componentTexts[category]?.[value] || value;
  }

  private generateComponentsList(quoteData: QuoteEmailData): string {
    const components = [];

    if (quoteData.components.esp32) {
      components.push(
        `• ${this.getComponentText(
          'esp32',
          quoteData.components.esp32
        )}: $${quoteData.prices.esp32.toLocaleString('es-MX')} MXN`
      );
    }

    if (quoteData.components.servos) {
      components.push(
        `• ${this.getComponentText(
          'servos',
          quoteData.components.servos
        )}: $${quoteData.prices.servos.toLocaleString('es-MX')} MXN`
      );
    }

    if (quoteData.components.arduino) {
      components.push(
        `• ${this.getComponentText(
          'arduino',
          quoteData.components.arduino
        )}: $${quoteData.prices.arduino.toLocaleString('es-MX')} MXN`
      );
    }

    if (quoteData.components.camera) {
      components.push(
        `• ${this.getComponentText(
          'camera',
          quoteData.components.camera
        )}: $${quoteData.prices.camera.toLocaleString('es-MX')} MXN`
      );
    }

    if (quoteData.components.mobileApp) {
      components.push(
        `• Aplicación Móvil: $${quoteData.prices.mobileApp.toLocaleString(
          'es-MX'
        )} MXN`
      );
    }

    if (quoteData.components.webApp) {
      components.push(
        `• Aplicación Web: $${quoteData.prices.webApp.toLocaleString(
          'es-MX'
        )} MXN`
      );
    }

    return components.join('\n');
  }
}
