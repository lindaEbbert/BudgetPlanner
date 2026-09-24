import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { DeletedCategory } from '../../../shared/models';

// Asks what to do about a deleted category that has the wanted name: when creating,
// bring it back or create a new one; when renaming, only whether to rename anyway.
@Component({
  selector: 'app-deleted-category-choice',
  imports: [MatButtonModule, DatePipe],
  template: `
    <p role="status">
      Es gab schon eine Kategorie „{{ deletedCategory().name }}“, gelöscht am
      {{ deletedCategory().deletedAt | date: 'dd.MM.yyyy' }}.
    </p>
    @if (renaming()) {
      <button #firstChoice mat-stroked-button type="button" [disabled]="busy()" (click)="proceed.emit()">
        Wirklich umbenennen
      </button>
    } @else {
      <button #firstChoice mat-stroked-button type="button" [disabled]="busy()" (click)="restore.emit()">
        Alte Kategorie wiederherstellen
      </button>
      <button mat-stroked-button type="button" [disabled]="busy()" (click)="proceed.emit()">
        Neue Kategorie anlegen
      </button>
    }
    <button mat-button type="button" [disabled]="busy()" (click)="cancelled.emit()">Abbrechen</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeletedCategoryChoiceComponent {
  readonly deletedCategory = input.required<DeletedCategory>();
  readonly renaming = input(false);
  readonly busy = input(false);
  readonly restore = output();
  // Create or rename anyway; the deleted category stays deleted.
  readonly proceed = output();
  readonly cancelled = output();

  private readonly firstChoice = viewChild.required('firstChoice', { read: ElementRef });

  constructor() {
    // The choice replaces the button that was just clicked, so it takes over the focus.
    afterNextRender(() => this.firstChoice().nativeElement.focus());
  }
}
