import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

// Validates the repeat field against its sibling, so the error shows up at the repeat field.
function matchesPassword(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('password')?.value;
  return control.value === password ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    // Same minimum as the login form, otherwise the new account could not log in there
    password: ['', [Validators.required, Validators.minLength(6)]],
    passwordRepeat: ['', [Validators.required, matchesPassword]],
  });

  constructor() {
    // Re-check the repeat field whenever the password itself changes
    this.registerForm.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.registerForm.controls.passwordRepeat.updateValueAndValidity());
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { name, email, password } = this.registerForm.getRawValue();
    const credentials = { email: email!, password: password! };
    let accountCreated = false;

    this.authService
      .register({ name: name!, ...credentials })
      .pipe(
        switchMap(() => {
          accountCreated = true;
          return this.authService.login(credentials);
        }),
      )
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          if (accountCreated) {
            // The account exists, so registering again would only fail with 409
            this.router.navigate(['/login']);
            return;
          }
          this.errorMessage.set(
            err.status === 409 && err.error?.error
              ? err.error.error
              : 'Registrierung fehlgeschlagen',
          );
          this.isLoading.set(false);
        },
      });
  }
}
