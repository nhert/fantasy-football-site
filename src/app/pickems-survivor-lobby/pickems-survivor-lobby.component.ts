import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { map, startWith } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { SurvivorPickemsApiService } from '../_API/survivor-pickems-api.service';
import { firstValueFrom, Observable, of, Subscription } from 'rxjs';
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";
import { MatIcon } from "@angular/material/icon";
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { MatToolbarModule } from "@angular/material/toolbar";
import { PickemsSurvivorGameComponent } from "../pickems-survivor-game/pickems-survivor-game.component";
import { GameUser } from '../_Models/survivor.pickems.models';
import { PickemsSurvivorCalendarComponent } from "../pickems-survivor-calendar/pickems-survivor-calendar.component";
import { Constants } from '../_Tools/Constants';

@Component({
  selector: 'app-pickems-survivor-lobby',
  standalone: true,
  imports: [CommonModule, SimpleSpinnerComponent, MatIcon, FormsModule, ReactiveFormsModule, MatToolbarModule, PickemsSurvivorGameComponent],
  templateUrl: './pickems-survivor-lobby.component.html',
  styleUrl: './pickems-survivor-lobby.component.css'
})
export class PickemsSurvivorLobbyComponent {
  @Input('demoMode') demoMode: boolean = false;

  private auth = inject(AuthService);
  private doc = inject(DOCUMENT);

  userForm: FormGroup;

  isAuthenticated = false;

  isGameServerHealthChecked = false;
  isGameServerAvailable = false;

  isGameUserChecked = false;
  isGameUserNeedsCreation = false;

  isGameReady = false;

  protected currentUser: GameUser = {
    picture: "",
    email: "",
    username: ""
  }

  private readonly dummy_user_email = "dummy.user.test@com.com";
  private readonly demo_user_email = "demo.user@b3fl.com";

  protected existingUsernames: string[];

  private sub_Auth: Subscription;
  user$ = this.auth.user$;
  auth$ = this.auth.isAuthenticated$;
  /*
  CODE FORMATTED AS FOLLOWS
  { "nickname": "auth.nickname", 
   "name": "test@com.com", 
   "picture": "https://s.gravatar.com/avatar/..........", 
   "updated_at": "2026-06-13T17:29:01.685Z", 
   "email": "test@com.com", 
   "email_verified": false, 
   "sub": "auth0|........." }
  */
  code$ = this.user$.pipe(map((user) => JSON.stringify(user, null, 2)));

  test: string[] = ['test'];
  constructor(private survivorPickemsApi: SurvivorPickemsApiService, private fb: FormBuilder) {
    this.userForm = this.fb.group({
      // Field defaults to empty string with 3 validation rules
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(18),
        Validators.pattern('^[a-zA-Z0-9]+$'), // Only letters and numbers
        this.uniqueUsernameValidator()
      ]]
    });
  }

  get username() {
    return this.userForm.get('username');
  }

  ngOnInit(): void {
    if (Constants.PICKEMS_SURVIVOR_SKIP_AUTH || this.demoMode) {
      console.log("Pickems Survivor Lobby started in DEV MODE");
      this.authenticateInDevMode();
    } else {
      console.log("Pickems Survivor Lobby started in PRODUCTION MODE");
      this.authenticateAuth0();
    }
  }

  ngOnDestroy(): void {
    this.sub_Auth?.unsubscribe();
  }

  private authenticateInDevMode() {
    this.isAuthenticated = true;
    this.currentUser.email = this.demoMode ? this.demo_user_email : this.dummy_user_email;
    console.log("Hardcoding test account " + this.currentUser.email);
    this.checkGameServerStatus();
  }

  private authenticateAuth0() {
    this.sub_Auth = this.auth.isAuthenticated$.subscribe(async (authenticated: boolean) => {
      this.isAuthenticated = authenticated;
      if (authenticated) {
        const code = await firstValueFrom(this.code$);
        const userjson = JSON.parse(code);
        this.currentUser.email = userjson.email;
        this.currentUser.picture = userjson.picture;
        console.log("Logged in to B3FL Account! Welcome, " + this.currentUser.email);
        this.checkGameServerStatus();
      }
    });
  }

  private async checkGameServerStatus() {
    this.survivorPickemsApi.getGameServerStatus().subscribe({
      next: (res) => {
        this.isGameServerHealthChecked = true;
        this.isGameServerAvailable = true;
        console.log(res.message)
        this.checkForGameUserAccount();
      },
      error: (err) => {
        this.isGameServerHealthChecked = true;
        this.isGameServerAvailable = false;
        console.error("The Pickems & Survivor Pool Game Server is currently unavailable. Check with B3FL Tech Support.");
        console.error(err.message) // Displays error from service/interceptor
      }
    });
  }

  private checkForGameUserAccount() {
    this.survivorPickemsApi.getUserExists(this.currentUser.email).subscribe({
      next: (data) => {
        if (data && data.exists) { // found a user profile for this email
          console.log("A game profile was found for this user");
          this.currentUser.username = data.username;
          this.isGameUserNeedsCreation = false;
          this.isGameReady = true;
          this.isGameUserChecked = true;
        } else {
          console.log("A game profile must be created for this user");
          this.prepareForNicknameCreation();
        }
      },
      error: (err) => {
        this.isGameUserChecked = true;
        console.error("The Pickems & Survivor Pool Game Server is currently unavailable. Check with B3FL Tech Support.");
        console.error(err.message) // Displays error from service/interceptor
      }
    });
  }

  private prepareForNicknameCreation() {
    this.survivorPickemsApi.getExistingUsernames().subscribe(usernames => {
      this.existingUsernames = usernames;
      this.isGameUserChecked = true;
      this.isGameUserNeedsCreation = true;
    });
  }

  protected uniqueUsernameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      if (!this.existingUsernames) return null;

      // Convert array to lowercase for case-insensitive comparison
      const lowerCaseUsernames = this.existingUsernames.map(u => u.toLowerCase());
      const isTaken = lowerCaseUsernames.includes(control.value.toLowerCase());

      return isTaken ? { uniqueUsername: { value: control.value } } : null;
    };
  }

  // create a b3fl game account with nickname
  protected createAccount(): void {
    console.log(`acct name [${this.username.value}]`);
    const user = {
      email: this.currentUser.email,
      username: this.username.value
    }
    this.currentUser.username = this.username.value;
    this.survivorPickemsApi.addUser(user).subscribe({
      next: () => {
        this.isGameUserNeedsCreation = false;
        this.isGameReady = true;
      },
      error: (err) => {
        this.isGameUserNeedsCreation = true;
        console.error("The Pickems & Survivor Pool Game Server could not create an account for this user. Please try again.");
        console.error(err.message) // Displays error from service/interceptor
      }
    });
  }

  protected handleLogout(): void {
    if (!Constants.PICKEMS_SURVIVOR_SKIP_AUTH) {
      this.auth.logout({
        logoutParams: {
          returnTo: this.doc.location.origin,
        },
      });
    }
  }

  protected checkAuth(): Observable<boolean> {
    if (Constants.PICKEMS_SURVIVOR_SKIP_AUTH) {
      return of(this.isAuthenticated);
    } else {
      return this.auth$;
    }
  }
}
