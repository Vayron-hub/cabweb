import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ChartData {
  labels: string[];
  datasets: any[];
}

export interface ActivityData {
  id: number;
  type: string;
  description: string;
  timestamp: Date;
  location: string;
  status: 'completed' | 'pending' | 'in-progress';
}

export interface StatisticData {
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }

  getChartData(type: string): Observable<ChartData> {
    const mockData = this.getMockChartData(type);
    return of(mockData);
  }

  getRecentActivities(): Observable<ActivityData[]> {
    const activities: ActivityData[] = [
      {
        id: 1,
        type: 'Recolección',
        description: 'Recolección completada en Zona Norte',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), 
        location: 'Zona Norte',
        status: 'completed'
      },
      {
        id: 2,
        type: 'Mantenimiento',
        description: 'Mantenimiento de contenedores programado',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), 
        location: 'Centro',
        status: 'in-progress'
      },
      {
        id: 3,
        type: 'Reporte',
        description: 'Nuevo reporte de residuos especiales',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), 
        location: 'Zona Sur',
        status: 'pending'
      },
      {
        id: 4,
        type: 'Recolección',
        description: 'Ruta optimizada para la tarde',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), 
        location: 'Zona Este',
        status: 'completed'
      }
    ];
    
    return of(activities);
  }

  getStatistics(type: string): Observable<StatisticData[]> {
    const stats = this.getMockStatistics(type);
    return of(stats);
  }

  private getMockChartData(type: string): ChartData {
    switch (type) {
      case 'zona':
        return {
          labels: ['Zona Norte', 'Zona Sur', 'Zona Este', 'Zona Oeste', 'Centro'],
          datasets: [{
            label: 'Toneladas Recolectadas',
            data: [65, 59, 80, 81, 56],
            backgroundColor: [
              'rgba(46, 125, 50, 0.8)',
              'rgba(56, 142, 60, 0.8)',
              'rgba(76, 175, 80, 0.8)',
              'rgba(102, 187, 106, 0.8)',
              'rgba(129, 199, 132, 0.8)'
            ],
            borderColor: [
              'rgba(46, 125, 50, 1)',
              'rgba(56, 142, 60, 1)',
              'rgba(76, 175, 80, 1)',
              'rgba(102, 187, 106, 1)',
              'rgba(129, 199, 132, 1)'
            ],
            borderWidth: 2
          }]
        };
      
      case 'basura':
        return {
          labels: ['Orgánica', 'Reciclable', 'No Reciclable', 'Especiales', 'Textiles'],
          datasets: [{
            label: 'Porcentaje de Residuos',
            data: [40, 30, 20, 7, 3],
            backgroundColor: [
              'rgba(46, 125, 50, 0.8)',
              'rgba(56, 142, 60, 0.8)',
              'rgba(76, 175, 80, 0.8)',
              'rgba(102, 187, 106, 0.8)',
              'rgba(129, 199, 132, 0.8)'
            ],
            borderColor: [
              'rgba(46, 125, 50, 1)',
              'rgba(56, 142, 60, 1)',
              'rgba(76, 175, 80, 1)',
              'rgba(102, 187, 106, 1)',
              'rgba(129, 199, 132, 1)'
            ],
            borderWidth: 2
          }]
        };
      
      case 'horario':
        return {
          labels: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
          datasets: [{
            label: 'Rutas Completadas',
            data: [2, 8, 12, 15, 18, 12, 6],
            backgroundColor: 'rgba(46, 125, 50, 0.2)',
            borderColor: 'rgba(46, 125, 50, 1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        };
      
      default:
        return {
          labels: [],
          datasets: []
        };
    }
  }

  private getMockStatistics(type: string): StatisticData[] {
    switch (type) {
      case 'zona':
        return [
          {
            title: 'Zonas Activas',
            value: 5,
            unit: 'zonas',
            trend: 'stable',
            percentage: 0
          },
          {
            title: 'Total Recolectado',
            value: 341,
            unit: 'toneladas',
            trend: 'up',
            percentage: 12
          },
          {
            title: 'Eficiencia',
            value: 94,
            unit: '%',
            trend: 'up',
            percentage: 3
          }
        ];
      
      case 'basura':
        return [
          {
            title: 'Tipos de Residuos',
            value: 5,
            unit: 'categorías',
            trend: 'stable',
            percentage: 0
          },
          {
            title: 'Reciclaje',
            value: 67,
            unit: '%',
            trend: 'up',
            percentage: 8
          },
          {
            title: 'Reducción',
            value: 23,
            unit: 'toneladas',
            trend: 'up',
            percentage: 15
          }
        ];
      
      case 'horario':
        return [
          {
            title: 'Rutas Diarias',
            value: 24,
            unit: 'rutas',
            trend: 'stable',
            percentage: 0
          },
          {
            title: 'Horario Pico',
            value: 14,
            unit: 'hrs',
            trend: 'stable',
            percentage: 0
          },
          {
            title: 'Puntualidad',
            value: 96,
            unit: '%',
            trend: 'up',
            percentage: 2
          }
        ];
      
      default:
        return [];
    }
  }
}
