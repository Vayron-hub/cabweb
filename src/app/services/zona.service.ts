import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ZonaInfo {
  id: string | number;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class ZonaService {
  private _selectedZona = new BehaviorSubject<ZonaInfo>({
    id: '',
    nombre: '',
  });

  selectedZona$: Observable<ZonaInfo> = this._selectedZona.asObservable();

  constructor() {
    try {
      const raw = localStorage.getItem('selectedZona');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id !== undefined && parsed.nombre !== undefined) {
          this._selectedZona.next(parsed);
        }
      }
    } catch (e) {}

    window.addEventListener('storage', (ev) => {
      if (ev.key === 'selectedZona') {
        try {
          if (ev.newValue) {
            const parsed = JSON.parse(ev.newValue);
            if (
              parsed &&
              parsed.id !== undefined &&
              parsed.nombre !== undefined
            ) {
              this._selectedZona.next(parsed);
            }
          } else {
            this._selectedZona.next({ id: '', nombre: '' });
          }
        } catch {}
      }
    });
  }

  setSelectedZona(zona: ZonaInfo) {
    this._selectedZona.next(zona);
    try {
      localStorage.setItem('selectedZona', JSON.stringify(zona));
    } catch {}
  }

  clearSelectedZona() {
    this._selectedZona.next({
      id: '',
      nombre: '',
    });
    try {
      localStorage.removeItem('selectedZona');
    } catch {}
  }

  getCurrentZona(): ZonaInfo {
    return this._selectedZona.value;
  }
}
