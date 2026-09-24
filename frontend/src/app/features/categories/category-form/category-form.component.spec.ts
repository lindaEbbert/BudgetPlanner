import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { vi } from 'vitest';
import { CategoryFormComponent } from './category-form.component';
import { Category } from '../../../shared/models';

const housing: Category = {
  id: 'cat-housing',
  userId: 'user-1',
  name: 'Wohnen',
  createdAt: '2026-01-01T00:00:00',
};

const deletedRent = { id: 'cat-rent', name: 'Miete', deletedAt: '2026-09-17T08:15:00' };

const deletedCategoryConflict = {
  error: 'Es gibt eine gelöschte Kategorie mit diesem Namen',
  deletedCategory: deletedRent,
};

function setup(editedCategory: Category | null = null) {
  const close = vi.fn();
  TestBed.configureTestingModule({
    imports: [CategoryFormComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialogRef, useValue: { close } },
      { provide: MAT_DIALOG_DATA, useValue: editedCategory },
    ],
  });

  const fixture = TestBed.createComponent(CategoryFormComponent);
  const httpMock = TestBed.inject(HttpTestingController);
  const loader = TestbedHarnessEnvironment.loader(fixture);
  return { fixture, httpMock, loader, close };
}

type Setup = ReturnType<typeof setup>;

async function submitName({ loader }: Setup, name: string, submitText: string) {
  const nameInput = await loader.getHarness(MatInputHarness);
  await nameInput.setValue(name);
  await (await loader.getHarness(MatButtonHarness.with({ text: submitText }))).click();
}

function button({ loader }: Setup, text: string) {
  return loader.getHarness(MatButtonHarness.with({ text }));
}

function buttonOrNull({ loader }: Setup, text: string) {
  return loader.getHarnessOrNull(MatButtonHarness.with({ text }));
}

function expectCategoryRequest(httpMock: HttpTestingController, method: string, url: string) {
  return httpMock.expectOne((req) => req.method === method && req.url.endsWith(url));
}

async function answerWithDeletedCategory({ fixture }: Setup, request: TestRequest) {
  request.flush(deletedCategoryConflict, { status: 409, statusText: 'Conflict' });
  await fixture.whenStable();
}

describe('CategoryFormComponent – name of a deleted category', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  describe('when creating a category', () => {
    async function setupWithChoice() {
      const s = setup();
      await submitName(s, 'miete', 'Erstellen');
      await answerWithDeletedCategory(s, expectCategoryRequest(s.httpMock, 'POST', '/categories'));
      return s;
    }

    it('offers to restore the deleted category or to create a new one', async () => {
      const s = await setupWithChoice();

      expect(s.fixture.nativeElement.textContent).toContain('„Miete“');
      expect(await buttonOrNull(s, 'Alte Kategorie wiederherstellen')).not.toBeNull();
      expect(await buttonOrNull(s, 'Neue Kategorie anlegen')).not.toBeNull();
      expect(await buttonOrNull(s, 'Abbrechen')).not.toBeNull();
      expect(s.close).not.toHaveBeenCalled();
    });

    it('restores the deleted category and closes the dialog', async () => {
      const s = await setupWithChoice();

      await (await button(s, 'Alte Kategorie wiederherstellen')).click();

      expectCategoryRequest(s.httpMock, 'POST', '/categories/cat-rent/restore').flush({
        ...housing,
        id: 'cat-rent',
        name: 'Miete',
      });
      expect(s.close).toHaveBeenCalledWith(true);
    });

    it('creates a new category despite the deleted one and closes the dialog', async () => {
      const s = await setupWithChoice();

      await (await button(s, 'Neue Kategorie anlegen')).click();

      const createRequest = expectCategoryRequest(s.httpMock, 'POST', '/categories');
      expect(createRequest.request.body).toEqual({ name: 'miete', ignoreDeletedCategory: true });
      createRequest.flush({ ...housing, id: 'cat-new', name: 'miete' });
      expect(s.close).toHaveBeenCalledWith(true);
    });

    it('creates nothing on cancel and keeps the dialog open with the entered name', async () => {
      const s = await setupWithChoice();

      await (await button(s, 'Abbrechen')).click();

      expect(s.close).not.toHaveBeenCalled();
      expect(await (await s.loader.getHarness(MatInputHarness)).getValue()).toBe('miete');
      expect(await buttonOrNull(s, 'Alte Kategorie wiederherstellen')).toBeNull();
      expect(await buttonOrNull(s, 'Erstellen')).not.toBeNull();
    });

    it('withdraws the choice once the name is edited', async () => {
      const s = await setupWithChoice();

      await (await s.loader.getHarness(MatInputHarness)).setValue('Mieten');

      expect(await buttonOrNull(s, 'Neue Kategorie anlegen')).toBeNull();
      expect(await buttonOrNull(s, 'Erstellen')).not.toBeNull();
    });

    it('moves the focus to the restore button once the choice appears', async () => {
      await setupWithChoice();

      expect(document.activeElement?.textContent?.trim()).toBe('Alte Kategorie wiederherstellen');
    });

    it('moves the focus back to the name field on cancel', async () => {
      const s = await setupWithChoice();

      await (await button(s, 'Abbrechen')).click();
      await s.fixture.whenStable();

      expect(document.activeElement).toBe(s.fixture.nativeElement.querySelector('input'));
    });
  });

  describe('when renaming a category', () => {
    async function setupWithWarning() {
      const s = setup(housing);
      await submitName(s, 'Miete', 'Speichern');
      await answerWithDeletedCategory(
        s,
        expectCategoryRequest(s.httpMock, 'PUT', '/categories/cat-housing'),
      );
      return s;
    }

    it('warns that the category existed before and offers no restore', async () => {
      const s = await setupWithWarning();

      expect(s.fixture.nativeElement.textContent).toContain('„Miete“');
      expect(await buttonOrNull(s, 'Wirklich umbenennen')).not.toBeNull();
      expect(await buttonOrNull(s, 'Alte Kategorie wiederherstellen')).toBeNull();
      expect(s.close).not.toHaveBeenCalled();
    });

    it('renames despite the deleted category once confirmed', async () => {
      const s = await setupWithWarning();

      await (await button(s, 'Wirklich umbenennen')).click();

      const renameRequest = expectCategoryRequest(s.httpMock, 'PUT', '/categories/cat-housing');
      expect(renameRequest.request.body).toEqual({ name: 'Miete', ignoreDeletedCategory: true });
      renameRequest.flush({ ...housing, name: 'Miete' });
      expect(s.close).toHaveBeenCalledWith(true);
    });

    it('changes nothing on cancel and keeps the dialog open with the entered name', async () => {
      const s = await setupWithWarning();

      await (await button(s, 'Abbrechen')).click();

      expect(s.close).not.toHaveBeenCalled();
      expect(await (await s.loader.getHarness(MatInputHarness)).getValue()).toBe('Miete');
      expect(await buttonOrNull(s, 'Wirklich umbenennen')).toBeNull();
      expect(await buttonOrNull(s, 'Speichern')).not.toBeNull();
    });
  });
});
