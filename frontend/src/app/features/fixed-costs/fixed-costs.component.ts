import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FixedCostService } from './fixed-cost.service';
import { FixedCost, FixedCostProjection } from '../../shared/models';
import { FixedCostFormComponent } from './fixed-costs-form/fixed-costs-form.component';

@Component({
  selector: 'app-fixed-costs',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './fixed-costs.component.html',
  styleUrl: './fixed-costs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixedCostsComponent {
  private readonly fixedCostService = inject(FixedCostService);
  private readonly dialog = inject(MatDialog);

  readonly fixedCosts = signal<FixedCost[]>([]);
  readonly projections = signal<FixedCostProjection[]>([]);
  readonly projectionTotal = signal(0);

  private readonly now = new Date();
  readonly currentMonth = this.now.getMonth() + 1;
  readonly currentYear = this.now.getFullYear();

  readonly listColumns = ['name', 'amount', 'interval', 'startDate', 'actions'];
  readonly projectionColumns = ['name', 'interval', 'projectedAmount'];

  constructor() {
    this.loadFixedCosts();
    this.loadProjections(this.currentMonth, this.currentYear);
  }

  loadFixedCosts(): void {
    this.fixedCostService.getFixedCosts().subscribe((fc) => this.fixedCosts.set(fc));
  }

  loadProjections(month: number, year: number): void {
    this.fixedCostService.getProjections(month, year).subscribe((resp) => {
      this.projections.set(resp.projections);
      this.projectionTotal.set(resp.total);
    });
  }

  getIntervalLabel(fc: FixedCost): string {
    const labels: Record<string, string> = {
      DAY: 'tägl.',
      WEEK: 'wöch.', // TODO: Täglich und Wöchentlich ausblenden
      MONTH: 'mtl.',
      YEAR: 'jährl.',
    };
    const prefix = fc.intervalValue === 1 ? '' : `alle${fc.intervalValue} `;
    return `${prefix}${labels[fc.intervalUnit] ?? fc.intervalUnit}`;
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(FixedCostFormComponent, { width: '480px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.loadFixedCosts();
        this.loadProjections(this.currentMonth, this.currentYear);
      }
    });
  }

  deleteFixedCost(id: string): void {
    if (confirm('Fixkosten wirklich löschen?')) {
      this.fixedCostService.deleteFixedCost(id).subscribe(() => {
        this.loadFixedCosts();
        this.loadProjections(this.currentMonth, this.currentYear);
      });
    }
  }
}
