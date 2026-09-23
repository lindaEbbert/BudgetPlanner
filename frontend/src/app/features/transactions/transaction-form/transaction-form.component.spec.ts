import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
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

const petsCategory: Category = {
  id: 'cat-pets',
  userId: 'user-1',
  name: 'Haustiere',
  createdAt: '2026-09-17T00:00:00',
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

const uncategorizedTransaction: Transaction = {
  ...rentTransaction,
  id: 'tx-cinema-march',
  categoryId: undefined,
  fixedCostId: undefined,
  name: 'Kino',
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

async function leaveNameField(fixture: ComponentFixture<TransactionFormComponent>, name: string) {
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const nameInput = await loader.getHarness(
    MatInputHarness.with({ selector: '[formControlName="name"]' }),
  );
  await nameInput.setValue(name);
  await nameInput.blur();
}

function expectNoCreateCategoryRequest(httpMock: HttpTestingController) {
  httpMock.expectNone((req) => req.method === 'POST' && req.url.endsWith('/categories'));
}

async function getCategorySelect(fixture: ComponentFixture<TransactionFormComponent>) {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(
    MatSelectHarness.with({ selector: '[formControlName="categoryId"]' }),
  );
}

function getCategorySelectElement(fixture: ComponentFixture<TransactionFormComponent>) {
  return fixture.nativeElement.querySelector('mat-select[formControlName="categoryId"]');
}

function expectSuggestionRequest(httpMock: HttpTestingController) {
  return httpMock.expectOne((req) => req.url.endsWith('/transactions/category-suggestion'));
}

function expectNoSuggestionRequest(httpMock: HttpTestingController) {
  httpMock.expectNone((req) => req.url.endsWith('/transactions/category-suggestion'));
}

function expectCreateCategoryRequest(httpMock: HttpTestingController) {
  return httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/categories'));
}

async function getNewCategoryOffer(fixture: ComponentFixture<TransactionFormComponent>) {
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const nameField = await loader.getHarnessOrNull(
    MatFormFieldHarness.with({ floatingLabelText: 'Neue Kategorie' }),
  );
  if (!nameField) return null;
  return {
    nameInput: (await nameField.getControl(MatInputHarness))!,
    acceptButton: await loader.getHarness(MatButtonHarness.with({ text: 'Kategorie anlegen' })),
    rejectButton: await loader.getHarness(MatButtonHarness.with({ text: 'Verwerfen' })),
  };
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
    const categorySelect = await getCategorySelect(fixture);
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

describe('TransactionFormComponent – category suggestion', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  async function setupWithNewCategoryOffer() {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    await leaveNameField(fixture, 'Tierarzt');
    expectSuggestionRequest(httpMock).flush({ categoryId: null, newCategoryName: 'Haustiere' });
    const offer = (await getNewCategoryOffer(fixture))!;
    return { fixture, component, httpMock, offer };
  }

  it('fills an empty category with the suggested category after leaving the name field', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');

    await leaveNameField(fixture, 'Kino');

    const request = expectSuggestionRequest(httpMock);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Kino', type: 'EXPENSE' });
    request.flush({ categoryId: 'cat-leisure', newCategoryName: null });
    expect(component.form.controls.categoryId.value).toBe('cat-leisure');
  });

  it('lets the user pick a different category after the suggestion filled it in', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    await leaveNameField(fixture, 'Kino');
    expectSuggestionRequest(httpMock).flush({ categoryId: 'cat-leisure', newCategoryName: null });
    const categorySelect = await getCategorySelect(fixture);
    expect(await categorySelect.getValueText()).toBe('Freizeit');

    await categorySelect.clickOptions({ text: 'Wohnen' });

    expect(component.form.controls.categoryId.value).toBe('cat-housing');
  });

  it('leaves the form unchanged when there is no suggestion', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    await leaveNameField(fixture, 'Kino');

    expectSuggestionRequest(httpMock).flush({ categoryId: null, newCategoryName: null });

    expect(component.form.controls.categoryId.value).toBe('');
    expect(await getNewCategoryOffer(fixture)).toBeNull();
  });

  it('does not request a suggestion when the category is already set', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    component.form.controls.categoryId.setValue('cat-housing');

    await leaveNameField(fixture, 'Kino');

    expectNoSuggestionRequest(httpMock);
    expect(component.form.controls.categoryId.value).toBe('cat-housing');
  });

  it('does not request a suggestion while a fixed cost is assigned', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    component.form.controls.fixedCostId.setValue(uncategorizedGym.id);

    await leaveNameField(fixture, 'Fitnessstudio Mai');

    expectNoSuggestionRequest(httpMock);
    expect(component.form.controls.categoryId.value).toBe('');
  });

  it('requests the suggestion once the type is chosen after the name field was left', async () => {
    const { fixture, component, httpMock } = setup();
    await leaveNameField(fixture, 'Kino');
    expectNoSuggestionRequest(httpMock);

    component.form.controls.type.setValue('EXPENSE');

    expectSuggestionRequest(httpMock).flush({ categoryId: 'cat-leisure', newCategoryName: null });
    expect(component.form.controls.categoryId.value).toBe('cat-leisure');
  });

  it('does not request a suggestion for an initial balance, which has no category', async () => {
    const { fixture, component, httpMock } = setup();
    await leaveNameField(fixture, 'Startguthaben');

    component.form.controls.type.setValue('INITIAL');

    expectNoSuggestionRequest(httpMock);
  });

  it('ignores a late suggestion when the user picked a category while waiting', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    await leaveNameField(fixture, 'Kino');
    const request = expectSuggestionRequest(httpMock);

    component.form.controls.categoryId.setValue('cat-housing');
    request.flush({ categoryId: 'cat-leisure', newCategoryName: null });

    expect(component.form.controls.categoryId.value).toBe('cat-housing');
  });

  it('ignores a late suggestion when the type was changed to initial balance while waiting', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    await leaveNameField(fixture, 'Startguthaben');
    const request = expectSuggestionRequest(httpMock);

    component.form.controls.type.setValue('INITIAL');
    request.flush({ categoryId: 'cat-leisure', newCategoryName: null });

    expect(component.form.controls.categoryId.value).toBe('');
  });

  it('ignores a late suggestion when a fixed cost was assigned while waiting', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    await leaveNameField(fixture, 'Fitnessstudio Mai');
    const request = expectSuggestionRequest(httpMock);

    component.form.controls.fixedCostId.setValue(uncategorizedGym.id);
    request.flush({ categoryId: 'cat-leisure', newCategoryName: null });

    expect(component.form.controls.categoryId.value).toBe('');
  });

  it('drops the pending suggestion for an outdated name when the name field is left again', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    await leaveNameField(fixture, 'Kino');
    const outdatedRequest = expectSuggestionRequest(httpMock);

    await leaveNameField(fixture, 'Miete Juni');
    const latestRequest = expectSuggestionRequest(httpMock);

    expect(outdatedRequest.cancelled).toBe(true);
    latestRequest.flush({ categoryId: 'cat-housing', newCategoryName: null });
    expect(component.form.controls.categoryId.value).toBe('cat-housing');
  });

  it('keeps the form usable when the suggestion request fails', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    await leaveNameField(fixture, 'Kino');

    expectSuggestionRequest(httpMock).flush(null, { status: 502, statusText: 'Bad Gateway' });
    await fixture.whenStable();

    expect(component.form.controls.categoryId.value).toBe('');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(TestBed.inject(OverlayContainer).getContainerElement().textContent).toBe('');
    const categorySelect = await getCategorySelect(fixture);
    await categorySelect.clickOptions({ text: 'Freizeit' });
    expect(component.form.controls.categoryId.value).toBe('cat-leisure');
  });

  it('offers a new category with an editable name when no existing category fits', async () => {
    const { fixture, component, httpMock } = setup();
    component.form.controls.type.setValue('EXPENSE');
    await leaveNameField(fixture, 'Tierarzt');

    expectSuggestionRequest(httpMock).flush({ categoryId: null, newCategoryName: 'Haustiere' });

    const offer = await getNewCategoryOffer(fixture);
    expect(offer).not.toBeNull();
    expect(await offer!.nameInput.getValue()).toBe('Haustiere');
    expect(await offer!.nameInput.isDisabled()).toBe(false);
    expect(component.form.controls.categoryId.value).toBe('');
  });

  it('creates the new category with the edited name and selects it on accept', async () => {
    const { fixture, component, httpMock, offer } = await setupWithNewCategoryOffer();

    await offer.nameInput.setValue('Haustier');
    await offer.acceptButton.click();

    const createRequest = expectCreateCategoryRequest(httpMock);
    expect(createRequest.request.body).toEqual({ name: 'Haustier' });
    createRequest.flush({ ...petsCategory, name: 'Haustier' });
    const categorySelect = await getCategorySelect(fixture);
    expect(await categorySelect.getValueText()).toBe('Haustier');
    expect(component.form.controls.categoryId.value).toBe('cat-pets');
    expect(await getNewCategoryOffer(fixture)).toBeNull();
  });

  it('leaves the category empty and creates nothing when the new category is rejected', async () => {
    const { fixture, component, httpMock, offer } = await setupWithNewCategoryOffer();

    await offer.rejectButton.click();

    expectNoCreateCategoryRequest(httpMock);
    expect(component.form.controls.categoryId.value).toBe('');
    expect(await getNewCategoryOffer(fixture)).toBeNull();
  });

  it('keeps the new category offer open with a message when creating the category fails', async () => {
    const { fixture, component, httpMock, offer } = await setupWithNewCategoryOffer();

    await offer.acceptButton.click();
    expectCreateCategoryRequest(httpMock).flush(
      { error: 'Kategorie mit diesem Namen existiert bereits' },
      { status: 409, statusText: 'Conflict' },
    );

    const offerAfterFailure = await getNewCategoryOffer(fixture);
    expect(offerAfterFailure).not.toBeNull();
    expect(await offerAfterFailure!.nameInput.getValue()).toBe('Haustiere');
    expect(await offerAfterFailure!.acceptButton.isDisabled()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Kategorie konnte nicht angelegt werden.');
    expect(component.form.controls.categoryId.value).toBe('');
  });

  it('creates the new category only once when accept is clicked again while it is being created', async () => {
    const { httpMock, offer } = await setupWithNewCategoryOffer();

    await offer.acceptButton.click();
    await offer.acceptButton.click();

    expectCreateCategoryRequest(httpMock).flush(petsCategory);
  });

  it('withdraws the new category offer once the user picks a category', async () => {
    const { fixture, component } = await setupWithNewCategoryOffer();
    const categorySelect = await getCategorySelect(fixture);

    await categorySelect.clickOptions({ text: 'Freizeit' });

    expect(await getNewCategoryOffer(fixture)).toBeNull();
    expect(component.form.controls.categoryId.value).toBe('cat-leisure');
  });

  it('does not allow creating a new category with an empty name', async () => {
    const { offer } = await setupWithNewCategoryOffer();

    await offer.nameInput.setValue('');

    expect(await offer.acceptButton.isDisabled()).toBe(true);
  });

  it('requests no new suggestion while the new category offer is shown', async () => {
    const { fixture, httpMock, offer } = await setupWithNewCategoryOffer();
    await offer.nameInput.setValue('Haustier');

    await leaveNameField(fixture, 'Tierarzt Rechnung');

    expectNoSuggestionRequest(httpMock);
    expect(await offer.nameInput.getValue()).toBe('Haustier');
  });

  it('requests no new suggestion while the new category is being created', async () => {
    const { fixture, httpMock, offer } = await setupWithNewCategoryOffer();
    await offer.acceptButton.click();

    await leaveNameField(fixture, 'Tierarzt Rechnung');

    expectNoSuggestionRequest(httpMock);
    expectCreateCategoryRequest(httpMock).flush(petsCategory);
  });

  it('moves the focus to the category field when the new category is rejected', async () => {
    const { fixture, offer } = await setupWithNewCategoryOffer();

    await offer.rejectButton.click();

    expect(document.activeElement).toBe(getCategorySelectElement(fixture));
  });

  it('moves the focus to the category field after the new category was created', async () => {
    const { fixture, httpMock, offer } = await setupWithNewCategoryOffer();

    await offer.acceptButton.click();
    expectCreateCategoryRequest(httpMock).flush(petsCategory);
    await fixture.whenStable();

    expect(document.activeElement).toBe(getCategorySelectElement(fixture));
  });

  it('withdraws the new category offer when the type no longer has a category', async () => {
    const { fixture, component, httpMock } = await setupWithNewCategoryOffer();

    component.form.controls.type.setValue('INITIAL');
    component.form.controls.type.setValue('EXPENSE');

    expectSuggestionRequest(httpMock).flush({ categoryId: null, newCategoryName: null });
    expect(await getNewCategoryOffer(fixture)).toBeNull();
  });

  it('withdraws the new category offer when a fixed cost is assigned', async () => {
    const { fixture, component, httpMock } = await setupWithNewCategoryOffer();

    component.form.controls.fixedCostId.setValue(uncategorizedGym.id);

    expect(await getNewCategoryOffer(fixture)).toBeNull();
    expectNoCreateCategoryRequest(httpMock);
  });

  describe('when editing an existing transaction', () => {
    it('suggests a category for a transaction that was saved without one', async () => {
      const { fixture, component, httpMock } = setup(uncategorizedTransaction);

      await leaveNameField(fixture, 'Kino Mai');

      const request = expectSuggestionRequest(httpMock);
      expect(request.request.body).toEqual({ name: 'Kino Mai', type: 'EXPENSE' });
      request.flush({ categoryId: 'cat-leisure', newCategoryName: null });
      expect(component.form.controls.categoryId.value).toBe('cat-leisure');
    });

    it('requests no suggestion while the stored category is set', async () => {
      const { fixture, component, httpMock } = setup(rentTransaction);

      await leaveNameField(fixture, 'Miete April');

      expectNoSuggestionRequest(httpMock);
      expect(component.form.controls.categoryId.value).toBe('cat-leisure');
    });
  });
});
