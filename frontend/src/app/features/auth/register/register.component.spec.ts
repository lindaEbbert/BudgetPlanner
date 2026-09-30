import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

const validAccount = {
  name: 'Linda',
  email: 'linda@example.com',
  password: 'geheim123',
  passwordRepeat: 'geheim123',
};

function setup() {
  TestBed.configureTestingModule({
    imports: [RegisterComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });

  const fixture = TestBed.createComponent(RegisterComponent);
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  return {
    fixture,
    navigate,
    httpMock: TestBed.inject(HttpTestingController),
    authService: TestBed.inject(AuthService),
    loader: TestbedHarnessEnvironment.loader(fixture),
  };
}

async function fillForm(fixture: ComponentFixture<RegisterComponent>, values = validAccount) {
  const loader = TestbedHarnessEnvironment.loader(fixture);
  for (const [control, value] of Object.entries(values)) {
    const input = await loader.getHarness(
      MatInputHarness.with({ selector: `[formControlName="${control}"]` }),
    );
    await input.setValue(value);
    await input.blur();
  }
}

async function getSubmitButton(fixture: ComponentFixture<RegisterComponent>) {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(
    MatButtonHarness.with({ selector: 'button[type="submit"]' }),
  );
}

async function submit(fixture: ComponentFixture<RegisterComponent>) {
  await (await getSubmitButton(fixture)).click();
}

function expectRegisterRequest(httpMock: HttpTestingController) {
  return httpMock.expectOne((req) => req.url.endsWith('/auth/register'));
}

function expectLoginRequest(httpMock: HttpTestingController) {
  return httpMock.expectOne((req) => req.url.endsWith('/auth/login'));
}

function getAlertText(fixture: ComponentFixture<RegisterComponent>): string | null {
  fixture.detectChanges();
  const alert: HTMLElement | null = fixture.nativeElement.querySelector('[role="alert"]');
  return alert?.textContent?.trim() ?? null;
}

describe('RegisterComponent', () => {
  afterEach(() => localStorage.clear());

  it('keeps the submit button disabled until the form is valid', async () => {
    const { fixture } = setup();
    expect(await (await getSubmitButton(fixture)).isDisabled()).toBe(true);

    await fillForm(fixture);
    expect(await (await getSubmitButton(fixture)).isDisabled()).toBe(false);
  });

  it('shows an error on the repeat field when the passwords differ', async () => {
    const { fixture, loader } = setup();
    await fillForm(fixture, { ...validAccount, passwordRepeat: 'anderes123' });

    const repeatField = await loader.getHarness(
      MatFormFieldHarness.with({ floatingLabelText: 'Passwort wiederholen' }),
    );
    expect(await repeatField.getTextErrors()).toEqual(['Passwörter stimmen nicht überein']);
    expect(await (await getSubmitButton(fixture)).isDisabled()).toBe(true);
  });

  it('rejects passwords shorter than 6 characters', async () => {
    const { fixture, loader } = setup();
    await fillForm(fixture, { ...validAccount, password: '12345', passwordRepeat: '12345' });

    const passwordField = await loader.getHarness(
      MatFormFieldHarness.with({ floatingLabelText: 'Passwort' }),
    );
    expect(await passwordField.getTextErrors()).toEqual(['Mindestens 6 Zeichen']);
    expect(await (await getSubmitButton(fixture)).isDisabled()).toBe(true);
  });

  it('registers, logs in with the same credentials and navigates to the dashboard', async () => {
    const { fixture, httpMock, navigate, authService } = setup();
    await fillForm(fixture);
    await submit(fixture);

    const registerReq = expectRegisterRequest(httpMock);
    expect(registerReq.request.body).toEqual({
      name: 'Linda',
      email: 'linda@example.com',
      password: 'geheim123',
    });
    expect(await (await getSubmitButton(fixture)).isDisabled()).toBe(true);
    registerReq.flush({ message: 'Benutzer erstellt', id: 'user-1' });

    const loginReq = expectLoginRequest(httpMock);
    expect(loginReq.request.body).toEqual({ email: 'linda@example.com', password: 'geheim123' });
    loginReq.flush({ access_token: 'token-123' });

    expect(authService.getToken()).toBe('token-123');
    expect(navigate).toHaveBeenCalledWith(['/']);
    httpMock.verify();
  });

  it('shows the API message when the e-mail is already taken and keeps the input', async () => {
    const { fixture, httpMock, navigate } = setup();
    await fillForm(fixture);
    await submit(fixture);

    expectRegisterRequest(httpMock).flush(
      { error: 'E-Mail bereits vergeben' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(getAlertText(fixture)).toBe('E-Mail bereits vergeben');
    expect(fixture.componentInstance.registerForm.getRawValue()).toEqual(validAccount);
    expect(await (await getSubmitButton(fixture)).isDisabled()).toBe(false);
    httpMock.expectNone((req) => req.url.endsWith('/auth/login'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows a generic message for other registration errors', async () => {
    const { fixture, httpMock } = setup();
    await fillForm(fixture);
    await submit(fixture);

    expectRegisterRequest(httpMock).error(new ProgressEvent('error'), { status: 0 });

    expect(getAlertText(fixture)).toBe('Registrierung fehlgeschlagen');
  });

  it('sends the user to /login when the account was created but the login fails', async () => {
    const { fixture, httpMock, navigate } = setup();
    await fillForm(fixture);
    await submit(fixture);

    expectRegisterRequest(httpMock).flush({ message: 'Benutzer erstellt', id: 'user-1' });
    expectLoginRequest(httpMock).flush(
      { error: 'Ungültige Anmeldedaten' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(getAlertText(fixture)).toBeNull();
  });

  it('links back to the login page', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="/login"]');
    expect(link).not.toBeNull();
  });
});
