import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TransactionFormComponent } from './transaction-form.component';
import { Category, FixedCost, Transaction } from '../../../shared/models';

const categories: Category[] = [
  { id: 'cat-housing', userId: 'user-1', name: 'Wohnen', createdAt: '2026-01-01T00:00:00' },
  { id: 'cat-leisure', userId: 'user-1', name: 'Freizeit', createdAt: '2026-01-01T00:00:00' },
];

const rent: FixedCost = {
  id: 'fc-rent',
  userId: 'user-1',
  categoryId: 'cat-housing',
  name: 'Miete',
  amount: 850,
  intervalUnit: 'MONTH',
  intervalValue: 1,
  startDate: '2026-01-01',
  isActive: true,
};

const uncategorizedGym: FixedCost = {
  ...rent,
  id: 'fc-gym',
  categoryId: null,
  name: 'Fitnessstudio',
  amount: 30,
};

const rentPayment: Transaction = {
  id: 'tx-rent-march',
  userId: 'user-1',
  categoryId: 'cat-leisure',
  fixedCostId: 'fc-rent',
  name: 'Miete März',
  amount: 850,
  type: 'EXPENSE',
  transactionDate: '2026-03-01',
  isVoided: false,
  createdAt: '2026-03-01T00:00:00',
};

function setup(editedTransaction: Transaction | null = null) {
  TestBed.configureTestingModule({
    imports: [TransactionFormComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNativeDateAdapter(),
      { provide: MatDialogRef, useValue: { close: () => {} } },
      { provide: MAT_DIALOG_DATA, useValue: editedTransaction },
    ],
  });

  const component = TestBed.createComponent(TransactionFormComponent).componentInstance;
  const httpMock = TestBed.inject(HttpTestingController);
  httpMock.expectOne((req) => req.url.endsWith('/categories')).flush(categories);
  httpMock.expectOne((req) => req.url.endsWith('/fixed-costs')).flush([rent, uncategorizedGym]);

  return { component, httpMock };
}

describe('TransactionFormComponent – fixed-cost assignment', () => {
  it('fills the category from the selected fixed cost', () => {
    const { component } = setup();

    component.form.controls.fixedCostId.setValue(rent.id);

    expect(component.form.controls.categoryId.value).toBe('cat-housing');
  });

  it('leaves the category unchanged when the selected fixed cost has no category', () => {
    const { component } = setup();
    component.form.controls.categoryId.setValue('cat-leisure');

    component.form.controls.fixedCostId.setValue(uncategorizedGym.id);

    expect(component.form.controls.categoryId.value).toBe('cat-leisure');
  });

  it('keeps a category the user picks after the fixed cost filled it in', () => {
    const { component } = setup();
    component.form.controls.fixedCostId.setValue(rent.id);

    component.form.controls.categoryId.setValue('cat-leisure');

    expect(component.form.controls.categoryId.enabled).toBe(true);
    expect(component.form.controls.categoryId.value).toBe('cat-leisure');
  });

  describe('when editing an existing transaction', () => {
    it('keeps the stored category when the form opens', () => {
      const { component } = setup(rentPayment);

      expect(component.form.controls.categoryId.value).toBe('cat-leisure');
    });

    it('fills the category from a newly selected fixed cost', () => {
      const { component } = setup({ ...rentPayment, fixedCostId: undefined });

      component.form.controls.fixedCostId.setValue(rent.id);

      expect(component.form.controls.categoryId.value).toBe('cat-housing');
    });
  });
});
