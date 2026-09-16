import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { provideNativeDateAdapter } from '@angular/material/core';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideNativeDateAdapter(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor]))
  ]
};
