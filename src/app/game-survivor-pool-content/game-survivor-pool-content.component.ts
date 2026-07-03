import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSelect, MatSelectChange } from "@angular/material/select";
import { Constants } from '../_Tools/Constants';
import { MatOptionModule } from "@angular/material/core";
import { SurvivorPickemsApiService } from '../_API/survivor-pickems-api.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ToastrService } from 'ngx-toastr';
import { GameState, GameUser, SurvivorEntries } from '../_Models/survivor.pickems.models';
import { PickemsSurvivorTimerComponent } from "../pickems-survivor-timer/pickems-survivor-timer.component";

@Component({
  selector: 'game-survivor-pool-content',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatSelect, MatOptionModule, MatFormFieldModule, PickemsSurvivorTimerComponent],
  templateUrl: './game-survivor-pool-content.component.html',
  styleUrl: './game-survivor-pool-content.component.css'
})
export class GameSurvivorPoolContentComponent {
  @Output('reloadData') reloadData = new EventEmitter<void>(); // Call reload method on parent component to reload table data and refresh.
  @Output('reloadServerTime') reloadServerTime = new EventEmitter<void>(); // Call reload method on parent component to reload table data and refresh.

  @Input('userEliminated') userEliminated: boolean;
  @Input('userMissedStart') userMissedStart: boolean;
  @Input('dataSource') dataSource: MatTableDataSource<SurvivorEntries>; // data source for the survivor pool table
  @Input('currentUser') currentUser: GameUser;
  @Input('gameState') gameState: GameState;
  @Input('made_choices_sleeper_ids') made_choices_sleeper_ids: string[];
  @Input('gameUsers') gameUsers: any[];

  @ViewChild(PickemsSurvivorTimerComponent) timerComponent!: PickemsSurvivorTimerComponent;

  // dependencies
  private toastr = inject(ToastrService);
  readonly b3fl_users = Constants.getAllActiveUsers();

  // Table related vars
  displayedColumns: string[] = []; // built programmatically 
  readonly column_username = 'playerUsername';
  readonly column_week_prefix = 'week';

  selectedGmChoiceValue: any = null; // bound to mat-select 

  // flags
  isTablePrepared: boolean = false;
  isLoading: boolean = false;
  disableUiControl: boolean = false;

  constructor(private survivorPickemsApi: SurvivorPickemsApiService) { }

  ngOnInit() {
    this.prepData();
    this.isTablePrepared = true;
  }

  ngAfterViewInit() {
    this.resetTimer();
  }

  // handlers

  protected handleSubmitChoiceClick() {
    if (this.selectedGmChoiceValue && this.currentUser && this.gameState) {
      this.submitGmSurvivorChoice();
    }
  }

  protected onGmSelectionChange(event: MatSelectChange) {
    this.selectedGmChoiceValue = event.value;
  }

  // api

  private submitGmSurvivorChoice() {
    if (this.isLoading) return;

    const selectedUser = this.selectedGmChoiceValue;

    this.survivorPickemsApi.getServerTime().subscribe(time => {
      // recheck server time at submission to be sure we aren't past the deadline
      const curServerTimeUTC = time.server_time;

      // latest server UTC timestamp is before the cutoff time
      if (curServerTimeUTC < this.gameState.current_cutoff_datetime_utc_iso) {
        this.survivorPickemsApi.updateSurvivorChoiceForUser(this.currentUser.email, this.gameState.week, selectedUser).subscribe({
          next: () => {
            this.reloadTableData();
            this.successToast('Saved Successfully', `Your Survivor Pool choice of ${selectedUser.name} for week ${this.gameState.week} has been saved!`);
          },
          error: (err) => {
            this.errorToast('Error While Saving', err.message);
          }
        });
      } else {
        this.errorToast("Error While Saving", "The submission deadline has already passed!");
      }
    });
  }

  private reloadTableData() {
    if (this.reloadData) {
      this.reloadData.emit();
    }
  }

  // util methods

  private prepData() {
    this.generateDisplayedColumnsForNWeeks(this.gameState.week);
  }

  private generateDisplayedColumnsForNWeeks(weeks: number) {
    this.displayedColumns = [];
    this.displayedColumns = this.displayedColumns.concat(this.column_username);
    for (let i = 0; i < weeks; i++) {
      this.displayedColumns = this.displayedColumns.concat(this.column_week_prefix + (i + 1));
    }
  }

  protected getAlphabetizedUsersForALeague() {
    return this.b3fl_users.filter((user: any) => user.currentLeague == Constants.A_LEAGUE_NAME).sort((a, b) => a.name.localeCompare(b.name));
  }

  protected getAlphabetizedUsersForBLeague() {
    return this.b3fl_users.filter((user: any) => user.currentLeague == Constants.B_LEAGUE_NAME).sort((a, b) => a.name.localeCompare(b.name));
  }

  protected isSleeperIdInListOfSurvivorChoices(sleeperId: string): boolean {
    return this.made_choices_sleeper_ids.includes(sleeperId);
  }

  // for mat-select of gms
  compareUsers(o1: any, o2: any): boolean {
    return o1 && o2 ? o1.sleeperId_current === o2.sleeperId_current : o1 === o2;
  }

  protected getGameUserFromEmail(email: string): any {
    return this.gameUsers.find(user => user.user_email == email);
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

  // Automatically catches up when user re-focuses or wakes up the tab
  @HostListener('document:visibilitychange', [])
  onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // For critical contests, re-fetch server state entirely upon wake
      this.reloadServerTime.emit();
    }
  }

  resetTimer() {
    if (this.gameState) {
      let curServerTime = this.gameState.server_current_datetime_utc_iso;
      let cutoffTime = this.gameState.current_cutoff_datetime_utc_iso;

      // get remaining seconds
      const remainingSeconds = this.getUTCSecondsDiff(curServerTime, cutoffTime);
      console.log(`Timer being initialized with curServerTime=${curServerTime} and cutoffTime=${cutoffTime}`);
      //console.log("Setting the survivor pool timer to " + remainingSeconds + " seconds");

      if (remainingSeconds > 0) {
        this.disableUiControl = false;
      } else {
        this.disableUiControl = true;
      }

      this.timerComponent.startTimer(remainingSeconds);
    }
  }

  getUTCSecondsDiff(isoString1: string, isoString2: string): number {
    const date1 = new Date(isoString1).getTime();
    const date2 = new Date(isoString2).getTime();
    return (date2 - date1) / 1000;
  }

  handleDisableUiComponents() {
    this.disableUiControl = true;
  }

  protected shouldDisableUiInput() {
    return this.disableUiControl || this.userEliminated || this.userMissedStart;
  }

  protected isSurvivorPoolFinished() {
    return this.gameState.survivor_pool_outcome != "UNKNOWN";
  }

  protected getListOfSurvivorPoolWinningUsernames() {
    if (this.gameState.survivor_pool_outcome != "UNKNOWN" && this.gameState.survivor_pool_winning_owners) {
      const arrayOfEmails = this.gameState.survivor_pool_winning_owners.split(",");
      const arrayOfUsernames = [];

      for (var email of arrayOfEmails) {
        arrayOfUsernames.push(this.getGameUserFromEmail(email).username);
      }

      return arrayOfUsernames.join(", ");
    }

    return "";
  }

  protected getSurvivorPoolOutcome() {
    if (this.gameState.survivor_pool_outcome === "WON") {
      return "The pool was WON by a single player";
    } else if (this.gameState.survivor_pool_outcome === "TIE") {
      return "The pool was TIED by multiple players";
    }

    return "The pool is unfinished";
  }
}
