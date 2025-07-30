import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ZonaInfo {
  id: string | number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZonaService {
  private _selectedZona = new BehaviorSubject<ZonaInfo>({
    id: '', // Empezar con ID vacío, se asignará cuando se carguen las zonas
    nombre: ''
  });

  selectedZona$: Observable<ZonaInfo> = this._selectedZona.asObservable();

  setSelectedZona(zona: ZonaInfo) {
    this._selectedZona.next(zona);
  }

  clearSelectedZona() {
    this._selectedZona.next({
      id: '',
      nombre: ''
    });
  }

  getCurrentZona(): ZonaInfo {
    return this._selectedZona.value;
  }
}
