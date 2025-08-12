import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-superadmin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex">
      <!-- Sidebar -->
      <div class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <!-- Logo -->
        <div class="flex items-center justify-between h-16 px-6 bg-primary-600">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <img
                class="h-8 w-8"
                src="/assets/images/logo.png"
                alt="CAB"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
              />
              <div
                class="h-8 w-8 bg-white rounded-full items-center justify-center text-primary-600 font-bold text-lg hidden"
              >
                C
              </div>
            </div>
            <div class="ml-3">
              <h1 class="text-white font-semibold text-lg">CAB</h1>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="mt-5 px-2">
          <div class="space-y-1">
            <a
              routerLink="/superadmin/dashboard"
              routerLinkActive="bg-primary-100 text-primary-700 border-r-2 border-primary-500"
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <i
                class="pi pi-chart-bar mr-3 text-gray-400 group-hover:text-gray-500"
              ></i>
              Dashboard
            </a>

            <a
              (click)="setActiveTab('productos')"
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <i
                class="pi pi-box mr-3 text-gray-400 group-hover:text-gray-500"
              ></i>
              Productos
            </a>

                        <a
              (click)="setActiveTab('materiasprimas')"
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <i
                class="pi pi-box mr-3 text-gray-400 group-hover:text-gray-500"
              ></i>
              Materias Primas
            </a>

            <a
              (click)="setActiveTab('proveedores')"
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <i
                class="pi pi-building mr-3 text-gray-400 group-hover:text-gray-500"
              ></i>
              Proveedores
            </a>

            <a
              (click)="setActiveTab('compras')"
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <i
                class="pi pi-shopping-cart mr-3 text-gray-400 group-hover:text-gray-500"
              ></i>
              Compras
            </a>

            <a
              (click)="setActiveTab('ventas')"
              class="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <i
                class="pi pi-dollar mr-3 text-gray-400 group-hover:text-gray-500"
              ></i>
              Ventas
            </a>
          </div>
        </nav>

        <!-- Bottom section -->
        <div
          class="absolute bottom-0 left-0 w-full p-4 border-t border-gray-200"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div
                class="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center"
              >
                <i class="pi pi-user text-primary-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-700">
                {{ currentUser?.nombre }}
              </p>
              <p class="text-xs text-gray-500">SuperAdmin</p>
            </div>
          </div>
          <button
            (click)="logout()"
            class="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <i class="pi pi-sign-out mr-2"></i>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <!-- Main content -->
      <div class="flex-1 ml-64">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center">
                <h1 class="text-xl font-semibold text-gray-900">
                  Panel de SuperAdministrador
                </h1>
              </div>
              <div class="flex items-center space-x-4">
                <button
                  (click)="showAccountModal = true"
                  class="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div
                    class="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center"
                  >
                    <i class="pi pi-user text-primary-600"></i>
                  </div>
                  <span class="hidden md:block">{{ currentUser?.nombre }}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- Page content -->
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Account Modal -->
    <div
      *ngIf="showAccountModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
      >
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Mi Cuenta</h3>
            <button
              (click)="showAccountModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <div
                class="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center"
              >
                <i class="pi pi-user text-primary-600 text-lg"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">
                  {{ currentUser?.nombre }}
                </p>
                <p class="text-sm text-gray-500">{{ currentUser?.correo }}</p>
              </div>
            </div>

            <div class="border-t pt-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-500">Rol</p>
                  <p class="font-medium">SuperAdministrador</p>
                </div>
                <div>
                  <p class="text-gray-500">Estado</p>
                  <p class="font-medium text-green-600">Activo</p>
                </div>
              </div>
            </div>

            <div class="border-t pt-4 flex space-x-3">
              <button
                (click)="editProfile()"
                class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Editar Perfil
              </button>
              <button
                (click)="logout()"
                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SuperadminLayout implements OnInit {
  currentUser: any = null;
  showAccountModal: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    // Verificar que el usuario sea SuperAdmin
    if (!this.currentUser || this.currentUser.rol !== 'SuperAdmin') {
      this.router.navigate(['/login']);
    }
  }

  setActiveTab(tab: string) {
    switch (tab) {
      case 'productos':
        this.router.navigate(['/superadmin/productos']);
        break;
      case 'materiasprimas':
        this.router.navigate(['/superadmin/materiasprimas']);
        break;
      case 'proveedores':
        this.router.navigate(['/superadmin/proveedores']);
        break;
      case 'compras':
        this.router.navigate(['/superadmin/compras']);
        break;
      case 'ventas':
        this.router.navigate(['/superadmin/ventas']);
        break;
      default:
        this.router.navigate(['/superadmin/dashboard']);
    }
  }

  editProfile() {
    this.showAccountModal = false;
    // Implement edit profile logic
    console.log('Editar perfil');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
