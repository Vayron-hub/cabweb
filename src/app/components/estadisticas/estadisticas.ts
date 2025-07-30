import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css'
})
export class EstadisticasComponent implements OnInit {
  isLoadingStats = false;
  selectedLocation = 'Edificio D';
  
  // Datos para gráficos de estadísticas específicos
  deteccionesPorHora: number[] = [85, 65, 75, 90];
  clasificacionesExitosas: number[] = [92, 78, 88, 95];
  flujoTransporte: number[] = [70, 45, 60, 80];
  actividadUsuarios: number[] = [88, 72, 95, 63];

  constructor() {}

  ngOnInit() {}

  exportStatisticsData() {
    console.log('Exportando estadísticas...');
  }

  refreshStatistics() {
    this.isLoadingStats = true;
    setTimeout(() => {
      this.isLoadingStats = false;
    }, 2000);
  }
}
