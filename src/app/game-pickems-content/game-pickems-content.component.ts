import { Component, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { GameState, GameUser, PickemsDbRow, PickemsMatchup, PickemsScore, UnderdogStatus } from '../_Models/survivor.pickems.models';
import { PickemsSurvivorTimerComponent } from "../pickems-survivor-timer/pickems-survivor-timer.component";
import { MatInputModule } from "@angular/material/input";
import { MatSelect, MatSelectChange, MatSelectModule } from "@angular/material/select";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from "@angular/material/expansion";
import { Constants } from '../_Tools/Constants';
import { MatButtonModule } from "@angular/material/button";
import { SurvivorPickemsApiService } from '../_API/survivor-pickems-api.service';
import { ToastrService } from 'ngx-toastr';
import { DisplayMode, PickemsSurvivorWarningInfoBoxComponent } from "../pickems-survivor-warning-info-box/pickems-survivor-warning-info-box.component";
import { PickemsMatchupGridComponent } from "../pickems-matchup-grid/pickems-matchup-grid.component";
import { GamePickemsStandingsContentComponent } from "../game-pickems-standings-content/game-pickems-standings-content.component";
import { MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";

const MAX_WEEKS: number = 14;
const TOTAL_MATCHUP_COUNT = 13;

export enum PickemsPickStatus {
  NONE,
  PICK,
  DOUBLE,
  TRIPLE,
  AUTO
}

@Component({
  selector: 'game-pickems-content',
  standalone: true,
  imports: [PickemsSurvivorTimerComponent, MatInputModule, MatSelectModule, MatCardModule, MatIconModule, CommonModule, MatExpansionModule, MatIconModule, MatButtonModule, PickemsSurvivorWarningInfoBoxComponent, PickemsMatchupGridComponent, GamePickemsStandingsContentComponent, MatTooltipModule, SimpleSpinnerComponent],
  templateUrl: './game-pickems-content.component.html',
  styleUrl: './game-pickems-content.component.css'
})
export class GamePickemsContentComponent {
  @Input('pickemsEntries') pickemsEntries: PickemsDbRow[]; // data source for the survivor pool table
  @Input('weeklyMatchups') weeklyMatchups: PickemsMatchup[];
  @Input('currentUser') currentUser: GameUser;
  @Input('gameState') gameState: GameState;
  @Input('gameUsers') gameUsers: any[];
  @Input('activeEmails') activeEmails: string[];
  @Output('reloadPickemsMatchupsForWeek') reloadPickemsMatchupsForWeek = new EventEmitter<any>();

  // On init, set the starting values of the selectors to these values
  @Input('initialProfileValue') initialProfileValue: any;
  @Input('initialWeekValue') initialWeekValue: number;

  @Output('reloadServerTime') reloadServerTime = new EventEmitter<void>(); // Call reload method on parent component to reload table data and refresh.
  @Output('reloadPickemsScores') reloadPickemsScores = new EventEmitter<void>();
  @Input('dataSourcePickemsScores') dataSourcePickemsScores: MatTableDataSource<PickemsScore>; // data source for the survivor pool table
  @ViewChild(PickemsSurvivorTimerComponent) timerComponent!: PickemsSurvivorTimerComponent;

  @Input('demoMode') demoMode: boolean = false;
  @Input('demoLoading') demoLoading: boolean = false;
  @Output('demoNextWeek') demoNextWeek = new EventEmitter<void>();
  @Output('demoReset') demoReset = new EventEmitter<void>();
  @Output('demoTestTimer') demoTestTimer = new EventEmitter<void>();

  selectedWeek: number; // double bound to selector current value
  selectedProfile: any; // double bound to selector current value
  profileSelectorOptions: any[] = [];

  isPickemsLoaded: boolean = false;
  isPickemsGridPrepared: boolean = false;
  isPickLoading: boolean = false; // when user makes a pick, removes a pick, etc this blocks double submits
  isPickemsEntriesLoading: boolean = false; // when user changes the values in profile/week selector, this determines whether the pickems reload is complete.
  passedDeadlineDisableUi: boolean = false;
  userMadePickNoPageRefreshYet: boolean = false;
  showDemoModeEnabled: boolean = Constants.PICKEMS_SURVIVOR_SHOW_DEMO_MODE;

  public StatusEnum = PickemsPickStatus;
  public DisplayModeEnum = DisplayMode;
  public UnderdogEnum = UnderdogStatus;

  private toastr = inject(ToastrService);

  readonly weekOptions: number[] = Array.from({ length: MAX_WEEKS }, (_, i) => i + 1);

  constructor(private survivorPickemsApi: SurvivorPickemsApiService) { }

  ngOnInit(): void {
    this.initializePickems();
    this.isPickemsLoaded = true;
  }

  ngAfterViewInit() {
    this.reloadServerTime.emit();
  }

  // Automatically catches up when user re-focuses or wakes up the tab
  @HostListener('document:visibilitychange', [])
  onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.reloadServerTime.emit();
    }
  }

  reloadPickemsScoresInParent() {
    this.reloadPickemsScores.emit();
  }

  resetTimer() {
    this.timerComponent?.refreshTimer();
  }

  initializePickems() {
    this.profileSelectorOptions = this.activePickemsGameUsers;
    // If current user isnt in dropdown, add them so they can make entries if they havent yet.
    if (!this.activeEmails.includes(this.currentUser.email)) {
      this.profileSelectorOptions.push(this.gameUsers.find(u => u.user_email == this.currentUser.email));
    }
    this.profileSelectorOptions.sort((a, b) => a.username.localeCompare(b.username));

    // On initial page load, set week to the current schedule week.
    this.selectedWeek = this.initialWeekValue;
    this.selectedProfile = this.initialProfileValue;

    this.isPickemsGridPrepared = true;
  }

  handleDisableUiComponents() {
    this.passedDeadlineDisableUi = true;
  }

  get shouldShowWarningToMakePick() {
    return !this.passedDeadlineDisableUi
      && this.isCurrentUserSelectedInProfileDropdown()
      && this.numberOfMissingPicksForCurrentUserCurrentLoadedWeek > 0
      && this.selectedWeek == this.gameState.week;
  }
  get shouldShowGreenPicksAllMade() {
    return !this.passedDeadlineDisableUi
      && this.isCurrentUserSelectedInProfileDropdown()
      && this.numberOfMissingPicksForCurrentUserCurrentLoadedWeek == 0
      && this.selectedWeek == this.gameState.week;
  }
  get shouldShowWarningNotRegistered() {
    return !this.passedDeadlineDisableUi
      && this.isCurrentUserSelectedInProfileDropdown()
      && !this.activeEmails.includes(this.currentUser.email)
      && (this.numberOfMissingPicksForCurrentUserCurrentLoadedWeek == TOTAL_MATCHUP_COUNT)
      && this.selectedWeek == this.gameState.week;
  }
  get numberOfMissingPicksForCurrentUserCurrentLoadedWeek() {
    return this.weeklyMatchups.filter(matchup => matchup.manager_1_pick_status == PickemsPickStatus.NONE && matchup.manager_2_pick_status == PickemsPickStatus.NONE).length;
  }
  get aLeagueMatchups() {
    return this.weeklyMatchups.filter(matchup => matchup.league_type == Constants.A_LEAGUE_NAME);
  }
  get bLeagueMatchups() {
    return this.weeklyMatchups.filter(matchup => matchup.league_type == Constants.B_LEAGUE_NAME);
  }
  get activePickemsGameUsers() {
    return this.gameUsers.filter(user => this.activeEmails.includes(user.user_email));
  }
  get hasDoubleDownAvailable() {
    return this.weeklyMatchups.filter(matchup => matchup.manager_1_pick_status == PickemsPickStatus.DOUBLE || matchup.manager_2_pick_status == PickemsPickStatus.DOUBLE).length == 0;
  }
  get hasTripleDownAvailable() {
    return this.weeklyMatchups.filter(matchup => matchup.manager_1_pick_status == PickemsPickStatus.TRIPLE || matchup.manager_2_pick_status == PickemsPickStatus.TRIPLE).length == 0;
  }
  get isCurrentWeekAndPassedDeadline() {
    return this.selectedWeek == this.gameState.week && this.passedDeadlineDisableUi;
  }
  get isShowPickemsScores() {
    return this.selectedWeek <= this.gameState.last_processed_week;
  }

  protected trySubmitPickemsPick(pickPayload: any) {
    if (this.isPickLoading) return;

    console.log(pickPayload);

    if (!pickPayload) return;
    const matchup_id = pickPayload.matchup_id, choice_sleeper_id = pickPayload.sleeper_id;
    if (!choice_sleeper_id || !matchup_id) return;

    const choice_gm_name: string = Constants.USERS.find(user => user.sleeperId_current == choice_sleeper_id)?.name;
    if (!choice_gm_name) return;

    if (this.isCurrentWeekAndPassedDeadline) return;

    this.isPickLoading = true;
    this.survivorPickemsApi.getServerTime().subscribe(time => {
      // recheck server time at submission to be sure we aren't past the deadline
      const curServerTimeUTC = time.server_time;

      // latest server UTC timestamp is before the cutoff time
      if (curServerTimeUTC < this.gameState.current_cutoff_datetime_utc_iso) {
        this.survivorPickemsApi.makePickemsEntryForUser(this.currentUser.email, this.selectedWeek, matchup_id, choice_sleeper_id, choice_gm_name).subscribe({
          next: () => {
            this.reloadUIAfterMakePick(choice_sleeper_id, false, false);
            this.successToast('Saved Successfully', `You picked ${choice_gm_name} for week ${this.selectedWeek}!`);
            this.isPickLoading = false;
          },
          error: (err) => {
            this.errorToast('Error While Saving', err.error.error);
            this.isPickLoading = false;
          }
        });
      } else {
        this.errorToast("Error While Saving", "The submission deadline has passed!");
        this.isPickLoading = false;
      }
    });
  }

  protected trySubmitPickemsDoublePick(pickPayload: any) {
    this.trySubmitPickemsBonusPick(pickPayload, true, false);
  }

  protected trySubmitPickemsTriplePick(pickPayload: any) {
    this.trySubmitPickemsBonusPick(pickPayload, false, true);
  }

  private trySubmitPickemsBonusPick(pickPayload, isDouble, isTriple) {
    if (this.isPickLoading) return;

    if (!pickPayload) return;
    const matchup_id = pickPayload.matchup_id, choice_sleeper_id = pickPayload.sleeper_id;
    if (!choice_sleeper_id || !matchup_id) return;

    const choice_gm_name: string = Constants.USERS.find(user => user.sleeperId_current == choice_sleeper_id)?.name;
    if (!choice_gm_name) return;

    if (this.isCurrentWeekAndPassedDeadline) return;

    this.isPickLoading = true;
    this.survivorPickemsApi.getServerTime().subscribe(time => {
      // recheck server time at submission to be sure we aren't past the deadline
      const curServerTimeUTC = time.server_time;

      // latest server UTC timestamp is before the cutoff time
      if (curServerTimeUTC < this.gameState.current_cutoff_datetime_utc_iso) {
        this.survivorPickemsApi.makePickemsEntryWithBonusesForUser(this.currentUser.email, this.selectedWeek, matchup_id, choice_sleeper_id, choice_gm_name, isDouble, isTriple).subscribe({
          next: () => {
            this.reloadUIAfterMakePick(choice_sleeper_id, isDouble, isTriple);
            if (isDouble) {
              this.successToast('Saved Successfully', `You doubled down on ${choice_gm_name} for week ${this.selectedWeek}!`);
            } else if (isTriple) {
              this.successToast('Saved Successfully', `You tripled down on ${choice_gm_name} for week ${this.selectedWeek}!`);
            }
            this.isPickLoading = false;
          },
          error: (err) => {
            this.errorToast('Error While Saving', err.error.error);
            this.isPickLoading = false;
          }
        });
      } else {
        this.errorToast("Error While Saving", "The submission deadline has passed!");
        this.isPickLoading = false;
      }
    });
  }

  protected tryRemovePickemsPick(choice_sleeper_id: string) {
    if (this.isPickLoading) return;
    if (!choice_sleeper_id) return;

    if (!this.isCurrentUserSelectedInProfileDropdown() || this.selectedWeek < this.gameState.week || this.isCurrentWeekAndPassedDeadline) return;

    const choice_gm_name: string = Constants.USERS.find(user => user.sleeperId_current == choice_sleeper_id)?.name;
    if (!choice_gm_name) return;

    this.isPickLoading = true;
    this.survivorPickemsApi.getServerTime().subscribe(time => {
      // recheck server time at submission to be sure we aren't past the deadline
      const curServerTimeUTC = time.server_time;

      // latest server UTC timestamp is before the cutoff time
      if (curServerTimeUTC < this.gameState.current_cutoff_datetime_utc_iso) {
        this.survivorPickemsApi.deletePickemsEntryForUser(this.currentUser.email, this.selectedWeek, choice_sleeper_id).subscribe({
          next: () => {
            this.reloadUIAfterRemovePick(choice_sleeper_id);
            this.successToast('Pick Removed Successfully', `You removed the selection of ${choice_gm_name} for week ${this.selectedWeek}!`);
            this.isPickLoading = false;
          },
          error: (err) => {
            this.errorToast('Error While Saving', err.error.error);
            this.isPickLoading = false;
          }
        });
      } else {
        this.errorToast("Error While Saving", "The submission deadline has passed!");
        this.isPickLoading = false;
      }
    });
  }

  private isCurrentUserSelectedInProfileDropdown() {
    return this.selectedProfile && this.selectedProfile.user_email == this.currentUser.email;
  }

  // instead of doing a full page reload after someone makes a pick, just update the UI. 
  // On page refresh or selector change, full data gets reloaded.
  // ONLY called when user interacting with their own pickems entries.
  private reloadUIAfterRemovePick(choice_sleeper_id) {
    // find the pickems matchup that we interacted with and then set allow_pick = true
    const matchup = this.weeklyMatchups.find(matchup => matchup.manager_1_sleeper_id == choice_sleeper_id || matchup.manager_2_sleeper_id == choice_sleeper_id);
    if (matchup) {
      matchup.allow_pick = true;
      matchup.manager_1_pick_status = PickemsPickStatus.NONE;
      matchup.manager_2_pick_status = PickemsPickStatus.NONE;
    }
  }

  // instead of doing a full page reload after someone makes a pick, just update the UI. 
  // On page refresh or selector change, full data gets reloaded.
  // ONLY called when user interacting with their own pickems entries.
  private reloadUIAfterMakePick(choice_sleeper_id, isDouble, isTriple) {
    const matchup = this.weeklyMatchups.find(matchup => matchup.manager_1_sleeper_id == choice_sleeper_id || matchup.manager_2_sleeper_id == choice_sleeper_id);
    if (matchup) {
      matchup.allow_pick = false;
      // show the pick
      if (matchup.manager_1_sleeper_id == choice_sleeper_id) {
        if (isDouble) {
          matchup.manager_1_pick_status = PickemsPickStatus.DOUBLE;
        } else if (isTriple) {
          matchup.manager_1_pick_status = PickemsPickStatus.TRIPLE;
        } else {
          matchup.manager_1_pick_status = PickemsPickStatus.PICK;
        }
      } else if (matchup.manager_2_sleeper_id == choice_sleeper_id) {
        if (isDouble) {
          matchup.manager_2_pick_status = PickemsPickStatus.DOUBLE;
        } else if (isTriple) {
          matchup.manager_2_pick_status = PickemsPickStatus.TRIPLE;
        } else {
          matchup.manager_2_pick_status = PickemsPickStatus.PICK;
        }
      }
    }
  }

  // if deleted

  protected getGameUserFromEmail(email: string): any {
    return this.gameUsers.find(user => user.user_email == email);
  }

  // reloads entries
  onWeekSelectionChange(event: MatSelectChange) {
    this.updateParentComponentWithCurrentSelectorValuesAndReload();
  }

  // does not reload page
  onProfileSelectionChange(event: MatSelectChange) {
    this.updateParentComponentWithCurrentSelectorValuesAndReload();
  }

  // allows the UI to be displayed once loading is complete
  public pickemsLoadMarkComplete() {
    this.isPickemsEntriesLoading = false;
  }

  private updateParentComponentWithCurrentSelectorValuesAndReload() {
    this.isPickemsEntriesLoading = true;

    const currentValuesPayload = {
      profile: this.selectedProfile,
      week: this.selectedWeek
    }
    // Tell the parent component what our current selector values are. Switching between tabs recalls ngOnInit and wipes out selector values so need to remember them on parent.
    this.reloadPickemsMatchupsForWeek.emit(currentValuesPayload);
  }

  protected successToast(title: string, message: string) {
    this.toastr.success(message, title, {
      timeOut: 5000,
      progressBar: true
    });
  }

  protected errorToast(title: string, message: string) {
    this.toastr.error(message, title, {
      timeOut: 5000,
      progressBar: true
    });
  }


}
