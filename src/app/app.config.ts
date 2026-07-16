import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app-routing.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { SafePipe } from './_Tools/SafePipe';
import { provideAuth0 } from '@auth0/auth0-angular';
import { Constants } from './_Tools/Constants';
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled', // 'enabled' or 'top'
      anchorScrolling: 'enabled'            // Enables #hashes scrolling if needed
    })),
    provideClientHydration(),
    provideAnimations(),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideAuth0(Constants.AUTH0_CONFIG),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    importProvidersFrom(SafePipe)
  ]
};
