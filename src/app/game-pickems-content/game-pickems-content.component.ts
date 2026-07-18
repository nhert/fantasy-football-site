import { Component, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { GameState, GameUser, PickemsDbRow, PickemsMatchup, PickemsScore } from '../_Models/survivor.pickems.models';
import { PickemsSurvivorTimerComponent } from "../pickems-survivor-timer/pickems-survivor-timer.component";
import { MatInputModule } from "@angular/material/input";
import { MatSelect, MatSelectChange, MatSelectModule } from "@angular/material/select";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from "@angular/material/expansion";
import { Constants } from '../_Tools/Constants';
import { MatButton, MatButtonModule, MatIconButton } from "@angular/material/button";
import { SurvivorPickemsApiService } from '../_API/survivor-pickems-api.service';
import { ToastrService } from 'ngx-toastr';
import { DisplayMode, PickemsSurvivorWarningInfoBoxComponent } from "../pickems-survivor-warning-info-box/pickems-survivor-warning-info-box.component";

const NUM_MATCHUPS_PER_WEEK: number = 13; // total number of matchups per week
const MAX_WEEKS: number = 14;

export enum PickemsPickStatus {
  NONE,
  PICK,
  DOUBLE,
  TRIPLE
}

@Component({
  selector: 'game-pickems-content',
  standalone: true,
  imports: [PickemsSurvivorTimerComponent, MatInputModule, MatSelectModule, MatCardModule, MatIconModule, CommonModule, MatExpansionModule, MatIconModule, MatButtonModule, PickemsSurvivorWarningInfoBoxComponent],
  templateUrl: './game-pickems-content.component.html',
  styleUrl: './game-pickems-content.component.css'
})
export class GamePickemsContentComponent {
  @Input('pickemsEntries') pickemsEntries: PickemsDbRow[]; // data source for the survivor pool table
  @Input('weeklyMatchups') weeklyMatchups: PickemsMatchup[];
  @Input('currentUser') currentUser: GameUser;
  @Input('gameState') gameState: GameState;
  @Input('gameUsers') gameUsers: any[];
  @Output('reloadPickemsMatchupsForWeek') reloadPickemsMatchupsForWeek = new EventEmitter<any>();

  // On init, set the starting values of the selectors to these values
  @Input('initialProfileValue') initialProfileValue: any;
  @Input('initialWeekValue') initialWeekValue: number;
  @Output('updatePickemsSelectorValues') updatePickemsSelectorValues = new EventEmitter<any>();

  @Output('reloadServerTime') reloadServerTime = new EventEmitter<void>(); // Call reload method on parent component to reload table data and refresh.
  @ViewChild(PickemsSurvivorTimerComponent) timerComponent!: PickemsSurvivorTimerComponent;

  selectedWeek: number; // double bound to selector current value
  selectedProfile: any; // double bound to selector current value

  isPickemsLoaded: boolean = false;
  isPickemsGridPrepared: boolean = false;
  isLoading: boolean = false;

  public StatusEnum = PickemsPickStatus;
  public DisplayModeEnum = DisplayMode;

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
      // For critical contests, re-fetch server state entirely upon wake
      this.reloadServerTime.emit();
    }
  }

  resetTimer() {
    this.timerComponent?.refreshTimer();
  }

  initializePickems() {
    // On initial page load, set week to the current schedule week.
    this.selectedWeek = this.initialWeekValue;
    this.selectedProfile = this.initialProfileValue;

    this.isPickemsGridPrepared = true;
  }

  handleDisableUiComponents() {
    // TODO: timer expired so stop allowing edits
  }

  get shouldShowWarningToMakePick() {
    return this.isCurrentUserSelectedInProfileDropdown()
      && this.weeklyMatchups.filter(matchup => matchup.manager_1_pick_status == PickemsPickStatus.NONE && matchup.manager_2_pick_status == PickemsPickStatus.NONE).length > 0
      && this.selectedWeek == this.gameState.week;
  }
  get aLeagueMatchups() {
    return this.weeklyMatchups.filter(matchup => matchup.league_type == Constants.A_LEAGUE_NAME);
  }
  get bLeagueMatchups() {
    return this.weeklyMatchups.filter(matchup => matchup.league_type == Constants.B_LEAGUE_NAME);
  }
  get hasDoubleDownAvailable() {
    return this.weeklyMatchups.filter(matchup => matchup.manager_1_pick_status == PickemsPickStatus.DOUBLE || matchup.manager_2_pick_status == PickemsPickStatus.DOUBLE).length == 0;
  }
  get hasTripleDownAvailable() {
    return this.weeklyMatchups.filter(matchup => matchup.manager_1_pick_status == PickemsPickStatus.TRIPLE || matchup.manager_2_pick_status == PickemsPickStatus.TRIPLE).length == 0;
  }

  onClickMakePick(sleeper_id) {
    console.log("pick made " + sleeper_id);
    this.trySubmitPickemsPick(sleeper_id);
  }

  private trySubmitPickemsPick(choice_sleeper_id) {
    if (this.isLoading) return;
    if (!choice_sleeper_id) return;

    const choice_gm_name: string = Constants.USERS.find(user => user.sleeperId_current == choice_sleeper_id)?.name;
    if (!choice_gm_name) return;

    this.isLoading = true;
    this.survivorPickemsApi.getServerTime().subscribe(time => {
      // recheck server time at submission to be sure we aren't past the deadline
      const curServerTimeUTC = time.server_time;

      // latest server UTC timestamp is before the cutoff time
      if (curServerTimeUTC < this.gameState.current_cutoff_datetime_utc_iso) {
        this.survivorPickemsApi.makePickemsEntryForUser(this.currentUser.email, this.selectedWeek, choice_sleeper_id, choice_gm_name).subscribe({
          next: () => {
            this.reloadUIAfterMakePick(choice_sleeper_id, false, false);
            this.successToast('Saved Successfully', `Your Pickems choice of ${choice_gm_name} for week ${this.selectedWeek} has been saved!`);
            this.isLoading = false;
          },
          error: (err) => {
            this.errorToast('Error While Saving', err.message);
            this.isLoading = false;
          }
        });
      } else {
        this.errorToast("Error While Saving", "The submission deadline has already passed!");
        this.isLoading = false;
      }
    });
  }

  onClickDoubleDown(sleeper_id) {
    console.log("double down made " + sleeper_id);
    this.trySubmitPickemsBonusPick(sleeper_id, true, false);
  }

  onClickTripleDown(sleeper_id) {
    console.log("triple down made " + sleeper_id);
    this.trySubmitPickemsBonusPick(sleeper_id, false, true);
  }

  private trySubmitPickemsBonusPick(choice_sleeper_id, isDouble, isTriple) {
    if (this.isLoading) return;
    if (!choice_sleeper_id) return;

    const choice_gm_name: string = Constants.USERS.find(user => user.sleeperId_current == choice_sleeper_id)?.name;
    if (!choice_gm_name) return;

    this.isLoading = true;
    this.survivorPickemsApi.getServerTime().subscribe(time => {
      // recheck server time at submission to be sure we aren't past the deadline
      const curServerTimeUTC = time.server_time;

      // latest server UTC timestamp is before the cutoff time
      if (curServerTimeUTC < this.gameState.current_cutoff_datetime_utc_iso) {
        this.survivorPickemsApi.makePickemsEntryWithBonusesForUser(this.currentUser.email, this.selectedWeek, choice_sleeper_id, choice_gm_name, isDouble, isTriple).subscribe({
          next: () => {
            this.reloadUIAfterMakePick(choice_sleeper_id, isDouble, isTriple);
            if (isDouble) {
              this.successToast('Saved Successfully', `Your Pickems double down on ${choice_gm_name} for week ${this.selectedWeek} has been saved!`);
            } else if (isTriple) {
              this.successToast('Saved Successfully', `Your Pickems triple down on ${choice_gm_name} for week ${this.selectedWeek} has been saved!`);
            }
            this.isLoading = false;
          },
          error: (err) => {
            this.errorToast('Error While Saving', err.message);
            this.isLoading = false;
          }
        });
      } else {
        this.errorToast("Error While Saving", "The submission deadline has already passed!");
        this.isLoading = false;
      }
    });
  }

  // remove the entry and refresh
  onClickOnMadePickChip(sleeperId) {
    if (this.isCurrentUserSelectedInProfileDropdown() && this.selectedWeek >= this.gameState.week) {
      //console.log("remove: " + sleeperId);
      this.tryRemovePickemsPick(sleeperId);
    }
  }

  private tryRemovePickemsPick(choice_sleeper_id) {
    if (this.isLoading) return;
    if (!choice_sleeper_id) return;

    const choice_gm_name: string = Constants.USERS.find(user => user.sleeperId_current == choice_sleeper_id)?.name;
    if (!choice_gm_name) return;

    this.isLoading = true;
    this.survivorPickemsApi.getServerTime().subscribe(time => {
      // recheck server time at submission to be sure we aren't past the deadline
      const curServerTimeUTC = time.server_time;

      // latest server UTC timestamp is before the cutoff time
      if (curServerTimeUTC < this.gameState.current_cutoff_datetime_utc_iso) {
        this.survivorPickemsApi.deletePickemsEntryForUser(this.currentUser.email, this.selectedWeek, choice_sleeper_id).subscribe({
          next: () => {
            this.reloadUIAfterRemovePick(choice_sleeper_id);
            this.successToast('Saved Successfully', `Your Pickems choice of ${choice_gm_name} for week ${this.selectedWeek} has been removed!`);
            this.isLoading = false;
          },
          error: (err) => {
            this.errorToast('Error While Saving', err.message);
            this.isLoading = false;
          }
        });
      } else {
        this.errorToast("Error While Saving", "The submission deadline has already passed!");
        this.isLoading = false;
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
    this.updateParentComponentWithCurrentSelectorValues();
    this.reloadPickemsMatchupsForWeek.emit();
  }

  // does not reload page
  onProfileSelectionChange(event: MatSelectChange) {
    this.updateParentComponentWithCurrentSelectorValues();
    this.reloadPickemsMatchupsForWeek.emit();
  }

  private updateParentComponentWithCurrentSelectorValues() {
    const currentValuesPayload = {
      profile: this.selectedProfile,
      week: this.selectedWeek
    }
    // Tell the parent component what our current selector values are. Switching between tabs recalls ngOnInit and wipes out selector values so need to remember them on parent.
    this.updatePickemsSelectorValues.emit(currentValuesPayload);
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
