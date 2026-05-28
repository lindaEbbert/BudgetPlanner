import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

const MONTH_NAMES = [
  '',
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

@Component({
  selector: 'app-month-selector',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './month-selector.component.html',
  styleUrl: './month-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthSelectorComponent {
  readonly monthChange = output<{ month: number; year: number }>();

  private readonly now = new Date();
  readonly selectedMonth = signal(this.now.getMonth() + 1);
  readonly selectedYear = signal(this.now.getFullYear());

  readonly months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: MONTH_NAMES[i + 1],
  }));

  readonly years = [2024, 2025, 2026, 2027];

  onMonthChange(month: number): void {
    this.selectedMonth.set(month);
    this.monthChange.emit({ month, year: this.selectedYear() });
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.monthChange.emit({ month: this.selectedMonth(), year });
  }
}
