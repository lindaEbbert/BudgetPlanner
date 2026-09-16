import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSelectHarness } from '@angular/material/select/testing';
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

const rentTransaction: Transaction = {
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

  const fixture = TestBed.createComponent(TransactionFormComponent);
  const component = fixture.componentInstance;
  const httpMock = TestBed.inject(HttpTestingController);
  httpMock.expectOne((req) => req.url.endsWith('/categories')).flush(categories);
  httpMock.expectOne((req) => req.url.endsWith('/fixed-costs')).flush([rent, uncategorizedGym]);

  return { fixture, component, httpMock };
}

describe('TransactionFormComponent – fixed-cost assignment', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

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

  it('lets the user pick a different category after the fixed cost filled it in', async () => {
    const { fixture, component } = setup();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const fixedCostSelect = await loader.getHarness(
      MatSelectHarness.with({ selector: '[formControlName="fixedCostId"]' }),
    );
    const categorySelect = await loader.getHarness(
      MatSelectHarness.with({ selector: '[formControlName="categoryId"]' }),
    );
    await fixedCostSelect.clickOptions({ text: 'Miete' });
    expect(await categorySelect.getValueText()).toBe('Wohnen');

    await categorySelect.clickOptions({ text: 'Freizeit' });

    expect(await categorySelect.getValueText()).toBe('Freizeit');
    expect(component.form.controls.categoryId.value).toBe('cat-leisure');
  });

  describe('when editing an existing transaction', () => {
    it('keeps the stored category when the form opens', () => {
      const { component } = setup(rentTransaction);

      expect(component.form.controls.categoryId.value).toBe('cat-leisure');
    });

    it('fills the category from a newly selected fixed cost', () => {
      const { component } = setup({ ...rentTransaction, fixedCostId: undefined });

      component.form.controls.fixedCostId.setValue(rent.id);

      expect(component.form.controls.categoryId.value).toBe('cat-housing');
    });
  });
});
