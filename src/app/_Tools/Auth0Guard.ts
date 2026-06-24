import { inject } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { PlatformService } from "./platform.service";
import { AuthService } from "@auth0/auth0-angular";
import { Constants } from '../_Tools/Constants';

// This custom AuthGuard is set up to avoid "ERROR ReferenceError: location is not defined" errors in console.
export const Auth0Guard = async () => {
    const platformService = inject(PlatformService);

    if (!platformService.getIsBrowser()) {
        return false;
    }
    const authService = inject(AuthService);

    const isAuthenticated = await firstValueFrom(authService.isAuthenticated$);

    if (!isAuthenticated) {
        authService.loginWithRedirect();
        return false;
    }
    return true;
};
