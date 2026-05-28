import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FixedCostService } from '../fixed-cost.service';

@Component({
  selector: 'app-fixed-cost-form',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './fixed-costs-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixedCostFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly fixedCostService = inject(FixedCostService);
  private readonly dialogRef = inject(MatDialogRef<FixedCostFormComponent>);

  readonly intervalUnits = [
    { value: 'MONTH', label: 'Monatlich' },
    { value: 'YEAR', label: 'Jährlich' },
    { value: 'WEEK', label: 'Wöchentlich' },
    { value: 'DAY', label: 'Täglich' },
  ];

  readonly form = this.fb.group({
    name: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    intervalUnit: ['MONTH', Validators.required],
    intervalValue: [1, [Validators.required, Validators.min(1)]],
    startDate: [null as Date | null, Validators.required],
    description: [''],
  });

  save(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();

    this.fixedCostService.createFixedCost({
      name: value.name!,
      amount: value.amount!,
      intervalUnit: value.intervalUnit as 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
      intervalValue: value.intervalValue!,
      startDate: value.startDate!.toISOString().split('T')[0],
      description: value.description || undefined,
    }).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => console.error('Fixkosten-Fehler:', err),
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
