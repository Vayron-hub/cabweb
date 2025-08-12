import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';

interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  costo: number;
  stock: number;
  imagen?: string;
  activo: boolean;
  fechaCreacion?: Date;
}

interface Proveedor {
  id?: number;
  nombre: string;
  contacto: string[];
  producto: string;
  activo: boolean;
}

interface Compra {
  id?: number;
  numeroCompra: string;
  fechaCompra: Date;
  proveedorId: number;
  proveedor?: Proveedor;
  subTotal: number;
  total: number;
  estatus: string;
  observaciones?: string;
}

interface Venta {
  id?: number;
  numeroVenta: string;
  fechaVenta: Date;
  usuarioId: number;
  productId: number;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  subTotal: number;
  total: number;
  estatus: string;
  direccionEnvio?: string;
  observaciones?: string;
}

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 bg-white rounded-xl shadow-sm"
      >
        <div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            ¡Bienvenido SuperAdministrador!
          </h1>
          <p class="text-gray-600">
            Panel de control para gestión de productos, proveedores, compras y
            ventas.
          </p>
        </div>
        <i class="pi pi-cog text-primary-600 hidden md:block !text-6xl"></i>
      </div>

      <!-- Tabs Navigation -->
      <div class="bg-white rounded-xl shadow-sm">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6">
            <button
              *ngFor="let tab of tabs"
              (click)="activeTab = tab.id"
              [class]="getTabClass(tab.id)"
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
              <i [class]="tab.icon" class="mr-2"></i>
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Products Tab -->
        <div *ngIf="activeTab === 'productos'" class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800">
              Gestión de Productos
            </h2>
            <div class="flex gap-3">
              <button
                (click)="openProductModal()"
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <i class="pi pi-plus"></i>
                Nuevo Producto
              </button>
            </div>
          </div>

          <!-- Search and filters -->
          <div class="mb-6">
            <div class="relative">
              <i
                class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              ></i>
              <input
                type="text"
                [(ngModel)]="productSearchTerm"
                (input)="filterProductos()"
                placeholder="Buscar productos por nombre..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Products Table -->
          <div
            class="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Producto
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Precio/Costo
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Stock
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let producto of filteredProductos">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div
                          class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"
                        >
                          <i class="pi pi-box text-blue-600"></i>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {{ producto.nombre }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ producto.descripcion | slice : 0 : 50 }}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      \${{ producto.precio | number : '1.2-2' }}
                    </div>
                    <div class="text-sm text-gray-500">
                      Costo: \${{ producto.costo | number : '1.2-2' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900"
                      >{{ producto.stock }} unidades</span
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getStatusBadgeClass(producto.activo)">
                      {{ producto.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  >
                    <button
                      (click)="editProducto(producto)"
                      class="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      (click)="toggleProductoStatus(producto)"
                      class="text-yellow-600 hover:text-yellow-900 mr-3"
                    >
                      <i
                        [class]="
                          producto.activo ? 'pi pi-eye-slash' : 'pi pi-eye'
                        "
                      ></i>
                    </button>
                    <button
                      (click)="deleteProducto(producto)"
                      class="text-red-600 hover:text-red-900"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Providers Tab -->
        <div *ngIf="activeTab === 'proveedores'" class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800">
              Gestión de Proveedores
            </h2>
            <div class="flex gap-3">
              <button
                (click)="openProveedorModal()"
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <i class="pi pi-plus"></i>
                Nuevo Proveedor
              </button>
            </div>
          </div>

          <!-- Search -->
          <div class="mb-6">
            <div class="relative">
              <i
                class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              ></i>
              <input
                type="text"
                [(ngModel)]="proveedorSearchTerm"
                (input)="filterProveedores()"
                placeholder="Buscar proveedores por nombre..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Providers Table -->
          <div
            class="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Proveedor
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Contacto
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Producto
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let proveedor of filteredProveedores">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div
                          class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center"
                        >
                          <i class="pi pi-building text-green-600"></i>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {{ proveedor.nombre }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                      {{ proveedor.contacto[0] }}
                    </div>
                    <div
                      class="text-sm text-gray-500"
                      *ngIf="proveedor.contacto[1]"
                    >
                      {{ proveedor.contacto[1] }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {{ proveedor.producto }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getStatusBadgeClass(proveedor.activo)">
                      {{ proveedor.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  >
                    <button
                      (click)="editProveedor(proveedor)"
                      class="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button
                      (click)="toggleProveedorStatus(proveedor)"
                      class="text-yellow-600 hover:text-yellow-900 mr-3"
                    >
                      <i
                        [class]="
                          proveedor.activo ? 'pi pi-eye-slash' : 'pi pi-eye'
                        "
                      ></i>
                    </button>
                    <button
                      (click)="deleteProveedor(proveedor)"
                      class="text-red-600 hover:text-red-900"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Compras Tab -->
        <div *ngIf="activeTab === 'compras'" class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800">
              Gestión de Compras
            </h2>
            <button
              (click)="exportCompras()"
              class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <i class="pi pi-download"></i>
              Exportar
            </button>
          </div>

          <!-- Compras Table -->
          <div
            class="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Número
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Proveedor
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let compra of compras">
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                  >
                    {{ compra.numeroCompra }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ compra.fechaCompra | date : 'dd/MM/yyyy' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ compra.proveedor?.nombre || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    \${{ compra.total | number : '1.2-2' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getEstatusClass(compra.estatus)">
                      {{ compra.estatus }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Ventas Tab -->
        <div *ngIf="activeTab === 'ventas'" class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800">
              Gestión de Ventas
            </h2>
            <button
              (click)="exportVentas()"
              class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <i class="pi pi-download"></i>
              Exportar
            </button>
          </div>

          <!-- Ventas Table -->
          <div
            class="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Número
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Producto
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cantidad
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let venta of ventas">
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                  >
                    {{ venta.numeroVenta }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ venta.fechaVenta | date : 'dd/MM/yyyy' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ venta.producto?.nombre || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ venta.cantidad }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    \${{ venta.total | number : '1.2-2' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getEstatusClass(venta.estatus)">
                      {{ venta.estatus }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Product Modal -->
      <div
        *ngIf="showProductModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      >
        <div
          class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
        >
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}
            </h3>
            <form (ngSubmit)="saveProducto()">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Nombre</label
                >
                <input
                  type="text"
                  [(ngModel)]="currentProduct.nombre"
                  name="nombre"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Descripción</label
                >
                <textarea
                  [(ngModel)]="currentProduct.descripcion"
                  name="descripcion"
                  required
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Precio</label
                  >
                  <input
                    type="number"
                    [(ngModel)]="currentProduct.precio"
                    name="precio"
                    required
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Costo</label
                  >
                  <input
                    type="number"
                    [(ngModel)]="currentProduct.costo"
                    name="costo"
                    required
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Stock</label
                >
                <input
                  type="number"
                  [(ngModel)]="currentProduct.stock"
                  name="stock"
                  required
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="mb-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="currentProduct.activo"
                    name="activo"
                    class="mr-2"
                  />
                  <span class="text-sm font-medium text-gray-700">Activo</span>
                </label>
              </div>
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  (click)="closeProductModal()"
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {{ editingProduct ? 'Actualizar' : 'Crear' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Provider Modal -->
      <div
        *ngIf="showProveedorModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      >
        <div
          class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
        >
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor' }}
            </h3>
            <form (ngSubmit)="saveProveedor()">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Nombre</label
                >
                <input
                  type="text"
                  [(ngModel)]="currentProveedor.nombre"
                  name="nombre"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Email</label
                >
                <input
                  type="email"
                  [(ngModel)]="proveedorContacto.email"
                  name="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Teléfono</label
                >
                <input
                  type="text"
                  [(ngModel)]="proveedorContacto.telefono"
                  name="telefono"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Dirección</label
                >
                <textarea
                  [(ngModel)]="proveedorContacto.direccion"
                  name="direccion"
                  required
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Producto/Servicio</label
                >
                <input
                  type="text"
                  [(ngModel)]="currentProveedor.producto"
                  name="producto"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="mb-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    [(ngModel)]="currentProveedor.activo"
                    name="activo"
                    class="mr-2"
                  />
                  <span class="text-sm font-medium text-gray-700">Activo</span>
                </label>
              </div>
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  (click)="closeProveedorModal()"
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {{ editingProveedor ? 'Actualizar' : 'Crear' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SuperadminDashboard implements OnInit {
  activeTab: string = 'productos';

  tabs = [
    { id: 'productos', label: 'Productos', icon: 'pi pi-box' },
    { id: 'proveedores', label: 'Proveedores', icon: 'pi pi-building' },
    { id: 'compras', label: 'Compras', icon: 'pi pi-shopping-cart' },
    { id: 'ventas', label: 'Ventas', icon: 'pi pi-dollar' },
  ];

  // Products
  productos: Producto[] = [];
  filteredProductos: Producto[] = [];
  productSearchTerm: string = '';
  showProductModal: boolean = false;
  editingProduct: boolean = false;
  currentProduct: Producto = this.resetProduct();

  // Providers
  proveedores: Proveedor[] = [];
  filteredProveedores: Proveedor[] = [];
  proveedorSearchTerm: string = '';
  showProveedorModal: boolean = false;
  editingProveedor: boolean = false;
  currentProveedor: Proveedor = this.resetProveedor();
  proveedorContacto = { email: '', telefono: '', direccion: '' };

  // Purchases and Sales
  compras: Compra[] = [];
  ventas: Venta[] = [];

  private apiUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadProductos();
    this.loadProveedores();
    this.loadCompras();
    this.loadVentas();
  }

  // Products Methods
  loadProductos() {
    this.http.get<Producto[]>(`${this.apiUrl}/productos`).subscribe({
      next: (data) => {
        this.productos = data;
        this.filteredProductos = data;
      },
      error: (error) => {
        console.error('Error loading productos:', error);
      },
    });
  }

  filterProductos() {
    if (!this.productSearchTerm) {
      this.filteredProductos = this.productos;
    } else {
      this.filteredProductos = this.productos.filter((producto) =>
        producto.nombre
          .toLowerCase()
          .includes(this.productSearchTerm.toLowerCase())
      );
    }
  }

  openProductModal() {
    this.currentProduct = this.resetProduct();
    this.editingProduct = false;
    this.showProductModal = true;
  }

  editProducto(producto: Producto) {
    this.currentProduct = { ...producto };
    this.editingProduct = true;
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
    this.currentProduct = this.resetProduct();
    this.editingProduct = false;
  }

  saveProducto() {
    if (this.editingProduct) {
      this.http
        .put(
          `${this.apiUrl}/productos/${this.currentProduct.id}`,
          this.currentProduct
        )
        .subscribe({
          next: () => {
            this.loadProductos();
            this.closeProductModal();
          },
          error: (error) => console.error('Error updating producto:', error),
        });
    } else {
      this.http
        .post<Producto>(`${this.apiUrl}/productos`, this.currentProduct)
        .subscribe({
          next: () => {
            this.loadProductos();
            this.closeProductModal();
          },
          error: (error) => console.error('Error creating producto:', error),
        });
    }
  }

  toggleProductoStatus(producto: Producto) {
    const updatedProducto = { ...producto, activo: !producto.activo };
    this.http
      .put(`${this.apiUrl}/productos/${producto.id}`, updatedProducto)
      .subscribe({
        next: () => this.loadProductos(),
        error: (error) =>
          console.error('Error toggling producto status:', error),
      });
  }

  deleteProducto(producto: Producto) {
    if (
      confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)
    ) {
      this.http.delete(`${this.apiUrl}/productos/${producto.id}`).subscribe({
        next: () => this.loadProductos(),
        error: (error) => console.error('Error deleting producto:', error),
      });
    }
  }

  resetProduct(): Producto {
    return {
      nombre: '',
      descripcion: '',
      precio: 0,
      costo: 0,
      stock: 0,
      activo: true,
    };
  }

  exportProductos() {
    const csvContent = this.generateProductsCsv();
    this.downloadCsv(csvContent, 'productos.csv');
  }

  // Providers Methods
  loadProveedores() {
    this.http.get<Proveedor[]>(`${this.apiUrl}/proveedores`).subscribe({
      next: (data) => {
        this.proveedores = data;
        this.filteredProveedores = data;
      },
      error: (error) => {
        console.error('Error loading proveedores:', error);
      },
    });
  }

  filterProveedores() {
    if (!this.proveedorSearchTerm) {
      this.filteredProveedores = this.proveedores;
    } else {
      this.filteredProveedores = this.proveedores.filter((proveedor) =>
        proveedor.nombre
          .toLowerCase()
          .includes(this.proveedorSearchTerm.toLowerCase())
      );
    }
  }

  openProveedorModal() {
    this.currentProveedor = this.resetProveedor();
    this.proveedorContacto = { email: '', telefono: '', direccion: '' };
    this.editingProveedor = false;
    this.showProveedorModal = true;
  }

  editProveedor(proveedor: Proveedor) {
    this.currentProveedor = { ...proveedor };
    // Parse contacto array
    this.proveedorContacto = {
      email: proveedor.contacto[0] || '',
      telefono: proveedor.contacto[1] || '',
      direccion: proveedor.contacto[2] || '',
    };
    this.editingProveedor = true;
    this.showProveedorModal = true;
  }

  closeProveedorModal() {
    this.showProveedorModal = false;
    this.currentProveedor = this.resetProveedor();
    this.proveedorContacto = { email: '', telefono: '', direccion: '' };
    this.editingProveedor = false;
  }

  saveProveedor() {
    // Combine contacto info into array
    this.currentProveedor.contacto = [
      this.proveedorContacto.email,
      this.proveedorContacto.telefono,
      this.proveedorContacto.direccion,
    ];

    if (this.editingProveedor) {
      this.http
        .put(
          `${this.apiUrl}/proveedores/${this.currentProveedor.id}`,
          this.currentProveedor
        )
        .subscribe({
          next: () => {
            this.loadProveedores();
            this.closeProveedorModal();
          },
          error: (error) => console.error('Error updating proveedor:', error),
        });
    } else {
      this.http
        .post<Proveedor>(`${this.apiUrl}/proveedores`, this.currentProveedor)
        .subscribe({
          next: () => {
            this.loadProveedores();
            this.closeProveedorModal();
          },
          error: (error) => console.error('Error creating proveedor:', error),
        });
    }
  }

  toggleProveedorStatus(proveedor: Proveedor) {
    const updatedProveedor = { ...proveedor, activo: !proveedor.activo };
    this.http
      .put(`${this.apiUrl}/proveedores/${proveedor.id}`, updatedProveedor)
      .subscribe({
        next: () => this.loadProveedores(),
        error: (error) =>
          console.error('Error toggling proveedor status:', error),
      });
  }

  deleteProveedor(proveedor: Proveedor) {
    if (
      confirm(`¿Estás seguro de eliminar el proveedor "${proveedor.nombre}"?`)
    ) {
      this.http.delete(`${this.apiUrl}/proveedores/${proveedor.id}`).subscribe({
        next: () => this.loadProveedores(),
        error: (error) => console.error('Error deleting proveedor:', error),
      });
    }
  }

  resetProveedor(): Proveedor {
    return {
      nombre: '',
      contacto: [],
      producto: '',
      activo: true,
    };
  }

  exportProveedores() {
    const csvContent = this.generateProveedoresCsv();
    this.downloadCsv(csvContent, 'proveedores.csv');
  }

  // Purchases and Sales Methods
  loadCompras() {
    this.http.get<Compra[]>(`${this.apiUrl}/compras`).subscribe({
      next: (data) => {
        this.compras = data;
      },
      error: (error) => {
        console.error('Error loading compras:', error);
        // Mock data for demo
        this.compras = [
          {
            id: 1,
            numeroCompra: 'C-2025-001',
            fechaCompra: new Date(),
            proveedorId: 1,
            proveedor: {
              id: 1,
              nombre: 'TechComponents SA',
              contacto: [],
              producto: 'Componentes',
              activo: true,
            },
            subTotal: 17500,
            total: 20300,
            estatus: 'Completada',
          },
        ];
      },
    });
  }

  loadVentas() {
    this.http.get<Venta[]>(`${this.apiUrl}/ventas`).subscribe({
      next: (data) => {
        this.ventas = data;
      },
      error: (error) => {
        console.error('Error loading ventas:', error);
        // Mock data for demo
        this.ventas = [
          {
            id: 1,
            numeroVenta: 'V-2025-001',
            fechaVenta: new Date(),
            usuarioId: 3,
            productId: 1,
            producto: {
              nombre: 'CAB Clasificador Mini',
              descripcion: '',
              precio: 2500,
              costo: 1200,
              stock: 25,
              activo: true,
            },
            cantidad: 2,
            precioUnitario: 2500,
            subTotal: 5000,
            total: 5800,
            estatus: 'Entregada',
          },
        ];
      },
    });
  }

  exportCompras() {
    const csvContent = this.generateComprasCsv();
    this.downloadCsv(csvContent, 'compras.csv');
  }

  exportVentas() {
    const csvContent = this.generateVentasCsv();
    this.downloadCsv(csvContent, 'ventas.csv');
  }

  // Utility Methods
  getTabClass(tabId: string): string {
    const baseClass =
      'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    const activeClass = 'border-blue-500 text-blue-600';
    return this.activeTab === tabId ? activeClass : baseClass;
  }

  getStatusBadgeClass(active: boolean): string {
    return active
      ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'
      : 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800';
  }

  getEstatusClass(estatus: string): string {
    const statusClasses: { [key: string]: string } = {
      Pendiente:
        'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800',
      EnProceso:
        'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800',
      Completada:
        'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
      Entregada:
        'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
      Cancelada:
        'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800',
    };
    return (
      statusClasses[estatus] ||
      'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'
    );
  }

  // CSV Export Methods
  generateProductsCsv(): string {
    const headers =
      'ID,Nombre,Descripción,Precio,Costo,Stock,Estado,Fecha Creación\n';
    const rows = this.productos
      .map(
        (p) =>
          `${p.id},"${p.nombre}","${p.descripcion}",${p.precio},${p.costo},${
            p.stock
          },${p.activo ? 'Activo' : 'Inactivo'},${p.fechaCreacion || ''}`
      )
      .join('\n');
    return headers + rows;
  }

  generateProveedoresCsv(): string {
    const headers = 'ID,Nombre,Email,Teléfono,Dirección,Producto,Estado\n';
    const rows = this.proveedores
      .map(
        (p) =>
          `${p.id},"${p.nombre}","${p.contacto[0] || ''}","${
            p.contacto[1] || ''
          }","${p.contacto[2] || ''}","${p.producto}",${
            p.activo ? 'Activo' : 'Inactivo'
          }`
      )
      .join('\n');
    return headers + rows;
  }

  generateComprasCsv(): string {
    const headers =
      'ID,Número,Fecha,Proveedor,Subtotal,Total,Estado,Observaciones\n';
    const rows = this.compras
      .map(
        (c) =>
          `${c.id},"${c.numeroCompra}","${new Date(
            c.fechaCompra
          ).toLocaleDateString()}","${c.proveedor?.nombre || ''}",${
            c.subTotal
          },${c.total},"${c.estatus}","${c.observaciones || ''}"`
      )
      .join('\n');
    return headers + rows;
  }

  generateVentasCsv(): string {
    const headers =
      'ID,Número,Fecha,Producto,Cantidad,Precio Unitario,Subtotal,Total,Estado\n';
    const rows = this.ventas
      .map(
        (v) =>
          `${v.id},"${v.numeroVenta}","${new Date(
            v.fechaVenta
          ).toLocaleDateString()}","${v.producto?.nombre || ''}",${
            v.cantidad
          },${v.precioUnitario},${v.subTotal},${v.total},"${v.estatus}"`
      )
      .join('\n');
    return headers + rows;
  }

  downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
