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
import { MatExpansionModule } from "@angular/material/expansion";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { PickemsSurvivorWarningInfoBoxComponent } from "../pickems-survivor-warning-info-box/pickems-survivor-warning-info-box.component";
import { DisplayMode } from '../pickems-survivor-warning-info-box/pickems-survivor-warning-info-box.component';

@Component({
  selector: 'game-survivor-pool-content',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatSelect, MatOptionModule, MatFormFieldModule, PickemsSurvivorTimerComponent, MatExpansionModule, MatListModule, MatTooltipModule, MatCardModule, MatIconModule, PickemsSurvivorWarningInfoBoxComponent],
  templateUrl: './game-survivor-pool-content.component.html',
  styleUrl: './game-survivor-pool-content.component.css'
})
export class GameSurvivorPoolContentComponent {
  @Output('reloadData') reloadData = new EventEmitter<void>(); // Call reload method on parent component to reload table data and refresh.
  @Output('reloadServerTime') reloadServerTime = new EventEmitter<void>(); // Call reload method on parent component to reload the server time then refresh timer.

  @Input('userEliminated') userEliminated: boolean;
  @Input('userMissedStart') userMissedStart: boolean;
  @Input('userNeedsToMakePickThisWeek') userNeedsToMakePickThisWeek: boolean;
  @Input('dataSource') dataSource: MatTableDataSource<SurvivorEntries>; // data source for the survivor pool table
  @Input('currentUser') currentUser: GameUser;
  @Input('gameState') gameState: GameState;
  @Input('made_choices_sleeper_ids') made_choices_sleeper_ids: string[];
  @Input('gameUsers') gameUsers: any[];

  // Demo related inputs
  @Input('demoMode') demoMode: boolean = false;
  @Output('demoNextWeek') demoNextWeek = new EventEmitter<void>();
  @Output('demoReset') demoReset = new EventEmitter<void>();
  @Output('demoTestTimer') demoTestTimer = new EventEmitter<void>();

  @ViewChild(PickemsSurvivorTimerComponent) timerComponent!: PickemsSurvivorTimerComponent;
  @ViewChild(MatSelect) gmSelectorComponent!: MatSelect;

  public DisplayModeEnum = DisplayMode;

  // dependencies
  private toastr = inject(ToastrService);
  readonly b3fl_users = Constants.getAllActiveUsers();

  // Table related vars
  displayedColumns: string[] = []; // built programmatically 
  readonly column_username = 'playerUsername';
  readonly column_week_prefix = 'week';

  // flags
  isTablePrepared: boolean = false;
  isLoading: boolean = false;
  passedDeadlineDisableUi: boolean = false;
  didUserSuccessfullySubmit: boolean = false;
  showDemoModeEnabled: boolean = Constants.PICKEMS_SURVIVOR_SHOW_DEMO_MODE;

  constructor(private survivorPickemsApi: SurvivorPickemsApiService) { }

  ngOnInit() {
    this.prepTable();
    this.isTablePrepared = true;
    this.didUserSuccessfullySubmit = false;
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

  resetTimer() {
    this.timerComponent?.refreshTimer();
  }

  // handlers

  protected handleSubmitChoiceClick() {
    if (this.gmSelectorComponent && this.gmSelectorComponent.value && this.currentUser && this.gameState) {
      this.submitGmSurvivorChoice();
    }
  }

  // api

  private submitGmSurvivorChoice() {
    if (this.isLoading) return;

    const selectedUser = this.gmSelectorComponent.value;

    this.isLoading = true;
    this.survivorPickemsApi.getServerTime().subscribe(time => {
      // recheck server time at submission to be sure we aren't past the deadline
      const curServerTimeUTC = time.server_time;

      // latest server UTC timestamp is before the cutoff time
      if (curServerTimeUTC < this.gameState.current_cutoff_datetime_utc_iso) {
        this.survivorPickemsApi.updateSurvivorChoiceForUser(this.currentUser.email, this.gameState.week, selectedUser).subscribe({
          next: () => {
            this.reloadTableData();
            this.successToast('Saved Successfully', `Your Survivor Pool choice of ${selectedUser.name} for week ${this.gameState.week} has been saved!`);
            this.didUserSuccessfullySubmit = true;
            this.resetGmSelector();
            this.isLoading = false;
          },
          error: (err) => {
            this.errorToast('Error While Saving', err.message);
            this.isLoading = false;
          }
        });
      } else {
        this.errorToast("Error While Saving", "The submission deadline has passed!");
        this.isLoading = false;
      }
    });
  }

  private resetGmSelector() {
    this.gmSelectorComponent.value = null;
  }

  private reloadTableData() {
    if (this.reloadData) {
      this.reloadData.emit();
    }
  }

  private prepTable() {
    this.generateDisplayedColumnsForNWeeks(this.getNumTableWeeksToDisplay());
  }

  private getNumTableWeeksToDisplay(): number {
    if (this.isSurvivorPoolFinished()) {
      // Return the week that the pool was won if it has finished.
      // Don't show up to the current NFL week because it will just be empty columns.
      return this.gameState.survivor_pool_winning_week;
    }
    return this.gameState.week;
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
      timeOut: 8000,
      progressBar: true
    });
  }

  protected errorToast(title: string, message: string) {
    this.toastr.error(message, title, {
      timeOut: 8000,
      progressBar: true
    });
  }

  //called by timer to disable ui controls the moment timer elapses
  handleDisableUiComponents() {
    this.passedDeadlineDisableUi = true;
  }

  protected shouldDisableUiInput() {
    return this.passedDeadlineDisableUi || !this.getIsCurrentUserAlive();
  }

  protected isSurvivorPoolFinished() {
    return this.gameState.survivor_pool_outcome != "UNKNOWN";
  }

  //TODO: THIS GETS CALLED MULTIPLE TIMES PER FRAME
  protected getListOfSurvivorPoolWinningUsernames() {
    if (this.gameState.survivor_pool_outcome != "UNKNOWN" && this.gameState.survivor_pool_winning_owners) {
      const arrayOfEmails = this.gameState.survivor_pool_winning_owners.split(",");
      const arrayOfUsernames = [];

      //console.log("arrayOfEmails=");
      //console.log(arrayOfEmails);
      for (var email of arrayOfEmails) {
        arrayOfUsernames.push(this.getGameUserFromEmail(email)?.username);
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

  protected getShouldShowWarningToMakePick() {
    // if player is not eliminated, and they do NOT have an entry for this week, and it is not after the deadline, and they did not just click the submit button successfully without reloading the page
    const alive = this.getIsCurrentUserAlive();
    return alive && !this.passedDeadlineDisableUi && this.userNeedsToMakePickThisWeek && !this.didUserSuccessfullySubmit;
  }

  // User is not eliminated and user did not miss the week 1 submission deadline
  protected getIsCurrentUserAlive() {
    return !this.userEliminated && !this.userMissedStart;
  }

  // DEMO-ONLY RELATED METHODS

  // called by parent method to manually refresh 
  public demo_refreshDisplay() {
    this.prepTable();
  }
}
