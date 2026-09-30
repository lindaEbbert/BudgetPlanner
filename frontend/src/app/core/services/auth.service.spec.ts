import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  return {
    authService: TestBed.inject(AuthService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('AuthService', () => {
  afterEach(() => localStorage.clear());

  it('posts the new account to /auth/register without storing a token', () => {
    const { authService, httpMock } = setup();
    const newAccount = { name: 'Linda', email: 'linda@example.com', password: 'geheim123' };

    let response: unknown;
    authService.register(newAccount).subscribe((r) => (response = r));

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/register'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newAccount);
    req.flush({ message: 'Benutzer erstellt', id: 'user-1' }, { status: 201, statusText: 'Created' });

    expect(response).toEqual({ message: 'Benutzer erstellt', id: 'user-1' });
    expect(authService.isLoggedIn()).toBe(false);
    httpMock.verify();
  });
});
