import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SurvivorPickemsApiService } from '../_API/survivor-pickems-api.service';
import { SleeperApiService } from '../_API/sleeper-api.service';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatTabsModule } from "@angular/material/tabs";
import { GameSurvivorPoolContentComponent } from "../game-survivor-pool-content/game-survivor-pool-content.component";
import { GamePickemsContentComponent, PickemsPickStatus } from "../game-pickems-content/game-pickems-content.component";
import { GameSchedule, GameState, GameUser, PickemsDbRow, PickemsMatchup, PickemsMatchupCache, PickemsScore, SurvivorDbRow, SurvivorEntries, UnderdogStatus } from '../_Models/survivor.pickems.models';
import { MatTableDataSource } from '@angular/material/table';
import { firstValueFrom, forkJoin, Observable } from 'rxjs';
import { Constants } from '../_Tools/Constants';
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";
import { DisplayMode, PickemsSurvivorWarningInfoBoxComponent } from "../pickems-survivor-warning-info-box/pickems-survivor-warning-info-box.component";
import { PickemsSurvivorCalendarComponent } from "../pickems-survivor-calendar/pickems-survivor-calendar.component";
import { PickemsSurvivorTimerComponent } from "../pickems-survivor-timer/pickems-survivor-timer.component";

enum GameStatePhase {
  PreSeason, InSeason, PostSeason
}

@Component({
  selector: 'pickems-survivor-game',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatTabsModule, GameSurvivorPoolContentComponent, GamePickemsContentComponent, SimpleSpinnerComponent, PickemsSurvivorWarningInfoBoxComponent, PickemsSurvivorCalendarComponent],
  templateUrl: './pickems-survivor-game.component.html',
  styleUrl: './pickems-survivor-game.component.css'
})
export class PickemsSurvivorGameComponent {
  // provided by pickems-survivor-lobby
  // email, username, picture
  @Input('currentUser') currentUser: GameUser;
  @Input('demoMode') demoMode: boolean = false;

  @ViewChild(GameSurvivorPoolContentComponent) survivorPoolContent!: GameSurvivorPoolContentComponent;
  @ViewChild(GamePickemsContentComponent) pickemsContent!: GamePickemsContentComponent;

  public static FANTASY_WEEKS_REGULAR_SEASON = 14; // number of weeks in the fantasy regular season

  // state information
  public gameState: GameState; // nfl week rotates to the next on wednesdays at 2-3am. 
  public gamePhase: GameStatePhase; // Preseason / Reg Season / Post Season
  public gameSchedule: GameSchedule[];
  public gameUsers: any[] = []; // fields: user_email, username, avatar_url
  public gamesUnlockDate: Date; // utility variable. in pre-season displays when games unlock.

  // survivor pool vars
  public made_choices_sleeper_ids: string[] = [];
  public survivorEntries: SurvivorEntries[] = [];
  public dataSourceSurvivor: MatTableDataSource<SurvivorEntries>;
  public currentSurvivorUserEliminated: boolean = false;
  public currentSurvivorUserMissedStart: boolean = false;
  public currentSurvivorUserNeedsPickForThisWeek: boolean = false;

  // pickems vars
  public pickemsEntries: PickemsDbRow[] = [];
  public pickemsCurrentProfileSelectorValue: any;
  public pickemsCurrentWeekSelectorValue: number;
  public pickemsScores: PickemsScore[];
  public pickemsUnderdogWinTotals: any[];
  public dataSourcePickemsScores: MatTableDataSource<PickemsScore>;
  public pickemsMatchups: PickemsMatchup[];
  public pickemsMatchupsCache: PickemsMatchupCache;
  public activePickemsEmails: string[] = [];

  // loading booleans
  isGameStateLoaded: boolean = false;
  isDemoLoading: boolean = false;

  DisplayModeEnum = DisplayMode;

  constructor(private survivorPickemsApi: SurvivorPickemsApiService, private sleeperApi: SleeperApiService) { }

  ngOnInit(): void {
    /*
    {
        "week": 0,
        "leg": 0,
        "season": "2026",
        "season_type": "off",
        "league_season": "2026",
        "previous_season": "2025",
        "season_start_date": null,
        "display_week": 0,
        "league_create_season": "2026",
        "season_has_scores": true
    }
    */
    this.pickemsMatchupsCache = null;
    this.currentSurvivorUserEliminated = false;
    this.currentSurvivorUserMissedStart = false;
    this.currentSurvivorUserNeedsPickForThisWeek = false;

    this.sleeperApi.getNflState().then(state => {
      // Get the schedule
      this.survivorPickemsApi.getGameSchedule().subscribe(scheduleEntries => {
        this.setGameSchedule(scheduleEntries);

        this.survivorPickemsApi.getSurvivorPickemsGameStates().subscribe(states => {

          this.survivorPickemsApi.getServerTime().subscribe(time => {
            this.setGameState(state, time, scheduleEntries, states);
          });
        });
      });
    })
  }

  setGameSchedule(scheduleEntries) {
    this.gameSchedule = [];
    scheduleEntries.forEach(entry => {
      this.gameSchedule.push({
        week: entry.week,
        // The schedule.json file specifies times with EST/EDT timezone.
        // If "new Date" sees the timezone, it can convert to UTC using toISOString without using users locale/timezone
        start_datetime: new Date(entry.start_datetime).toISOString(),
        cutoff_datetime: new Date(entry.cutoff_datetime).toISOString()
      });
    });
  }

  setGameState(state, time, scheduleEntries, survivorPickemsState) {
    let nflStateWeek = state.week;
    const year = state.season;
    let server_time_utc_iso = time.server_time;

    if (this.demoMode) {
      console.log("RESETTING SERVER TIME FOR DEMO MODE");
      // nflStateWeek = 0;
      nflStateWeek = survivorPickemsState.last_processed_week >= 14 ? 14 : survivorPickemsState.last_processed_week + 1;
      server_time_utc_iso = this.demo_getCurrentTimeBasedOnSchedule(nflStateWeek, 3600000);
    }

    const scheduleEntry = this.getCurrentSchedule(server_time_utc_iso);

    // Its the pre-season
    if (scheduleEntry.week <= 0) {
      console.log("Pickems/Survivor Pool page has been loaded pre-season");
      this.gamePhase = GameStatePhase.PreSeason;
      this.gamesUnlockDate = new Date(scheduleEntries[0].start_datetime);
      this.getPreSeasonGameUsers();
    }
    // Its the fantasy regular season 
    else {
      // Its the post-season
      if (nflStateWeek > PickemsSurvivorGameComponent.FANTASY_WEEKS_REGULAR_SEASON) {
        console.log("Pickems/Survivor Pool page has been loaded post-season");
        this.gamePhase = GameStatePhase.PostSeason;
      } else {
        this.gamePhase = GameStatePhase.InSeason;
      }

      // initialize the gamestate variable
      // Remember: this isnt necessarily the sleeper nflstate week, this is the week for pickems/survivor which rotates forward on tuesday night / wednesday morning (2am).
      this.gameState = {
        season: year,
        week: scheduleEntry.week,
        server_current_datetime_utc_iso: server_time_utc_iso,
        current_start_datetime_utc_iso: scheduleEntry.start_datetime,
        current_start_local_date_display: new Date(scheduleEntry.start_datetime),
        current_cutoff_datetime_utc_iso: scheduleEntry.cutoff_datetime,
        current_cutoff_local_date_display: new Date(scheduleEntry.cutoff_datetime),
        last_processed_week: survivorPickemsState.last_processed_week,
        survivor_pool_outcome: survivorPickemsState.survivor_pool_outcome,
        survivor_pool_winning_owners: survivorPickemsState.survivor_pool_winning_owners,
        survivor_pool_winning_week: survivorPickemsState.survivor_pool_winning_week
      }

      this.getGameUsers();
    }
  }

  // For display, show who has registered before season kicks off
  getPreSeasonGameUsers() {
    this.gameUsers = [];

    this.survivorPickemsApi.getAllUsers().subscribe(users => {
      const gameUsersNonDemo = users.gameUsers.filter(user => user.is_demo_user == 0);
      gameUsersNonDemo.forEach(user => {
        this.gameUsers.push(user);
      });

      this.isGameStateLoaded = true;
    });
  }

  getGameUsers() {
    this.gameUsers = [];
    this.activePickemsEmails = [];

    this.survivorPickemsApi.getAllUsers().subscribe(users => {
      const gameUsers = users.gameUsers;
      const activePickemsUsers = users.activeUsers;

      gameUsers.forEach(user => {
        this.gameUsers.push(user);
      });

      activePickemsUsers.forEach(user => {
        this.activePickemsEmails.push(user.user_email);
      });

      this.initializeGame();
    });
  }

  initializeGame() {
    this.setPickemsCurrentSelectorValuesToDefault();
    this.reloadAllEntries();
  }

  protected async reloadAllEntries() {
    await firstValueFrom(
      forkJoin([this.reloadSurvivorEntries(), this.reloadPickemsEntriesForWeek(this.gameState.week), this.reloadPickemsScores()])
    );
    this.isGameStateLoaded = true;
  }

  public reloadSurvivorEntries() {
    const entries$ = this.survivorPickemsApi.getAllSurvivorEntries();
    entries$.subscribe(entries => {
      // entries arrives from api with multiple rows per user, keyed on email+week
      // need to make this fit the datasource structure of row = <playerName, week1=sleeperid123, week2=sleeperid456, week3, .... , week 14>
      // each entries element is formatted as: 
      /*
        {
            "owner": "dummy.user.test@com.com",
            "week": 1,
            "choice_sleeper_id": "",
            "choice_gm_name": ""
        }
      */
      this.determineChoicesMadeByCurrentUser(entries);
      this.determineCurrentUserGameState(entries);
      this.convertToSurvivorEntriesElement(entries);

      if (this.demoMode) {
        this.survivorPoolContent?.demo_refreshDisplay();
      }
    });

    return entries$;
  }

  public reloadPickemsEntriesForWeek(week: number): Observable<any> {
    console.log(`running reloadPickemsEntriesForWeek with week ${week}`);
    let forkJoin$;

    if (week == 1 || week > this.gameState.week) {
      forkJoin$ = forkJoin([this.survivorPickemsApi.getAllPickemsEntriesForWeek(week), this.sleeperApi.getPickemsMatchupsForWeek(week, this.pickemsMatchupsCache)]);

      forkJoin$.subscribe(([entries, matchups]) => {
        this.convertToPickemsDbElement(entries);
        this.setPickemsMatchups(matchups, week);
        this.pickemsContent?.pickemsLoadMarkComplete();

        console.log("reloading Matchups DONE. Skipped Underdog statuses because it is week 1.");
      });
    } else {
      forkJoin$ = forkJoin([this.survivorPickemsApi.getAllPickemsEntriesForWeek(week), this.sleeperApi.getPickemsMatchupsForWeek(week, this.pickemsMatchupsCache), this.survivorPickemsApi.getPlayerWinTotalsForWeek(week)]);

      forkJoin$.subscribe(([entries, matchups, winTotalsForWeek]) => {
        this.pickemsUnderdogWinTotals = winTotalsForWeek;
        this.convertToPickemsDbElement(entries);
        this.setPickemsMatchups(matchups, week);
        this.pickemsContent?.pickemsLoadMarkComplete();

        console.log("reloading Matchups DONE");
      });
    }

    return forkJoin$;
  }

  public updatePickemsSelectorValuesAndReloadEntries(payload: any) {
    this.updatePickemsCurrentSelectorValues(payload);
    this.reloadPickemsEntriesForWeek(this.pickemsCurrentWeekSelectorValue);
  }

  public reloadPickemsScores() {
    const entries$ = this.survivorPickemsApi.getPickemsScores();
    entries$.subscribe(entries => {
      this.convertToPickemsScoreElement(entries);
    });

    return entries$;
  }

  // Gets the current server time in ISO UTC and then resets the timers to count down from that time to the current deadline
  public reloadServerTime() {
    this.survivorPickemsApi.getServerTime().subscribe(time => {
      this.gameState.server_current_datetime_utc_iso = time.server_time;
      this.survivorPoolContent?.resetTimer();
      this.pickemsContent?.resetTimer();
    });
  }

  private determineChoicesMadeByCurrentUser(entries) {
    // sort entries for just currentUser and get list of choice_sleeper_id
    const curUserEntries = entries.filter(entry => entry.owner == this.currentUser.email);

    this.made_choices_sleeper_ids = [];
    curUserEntries.forEach(element => {
      this.made_choices_sleeper_ids.push(element.choice_sleeper_id);
    });
  }

  // Check if the current user has been eliminated from Survivor Pool, and lock inputs if so.
  private determineCurrentUserGameState(entries: any[]) {
    this.currentSurvivorUserEliminated = false;
    this.currentSurvivorUserMissedStart = false;
    this.currentSurvivorUserNeedsPickForThisWeek = false;

    const currentUserRecord = entries.filter(obj => obj.owner == this.currentUser.email);
    const isRecordPresent = currentUserRecord && currentUserRecord.length > 0;

    if (isRecordPresent) { // user has existing records, check if any lost
      const foundLossRecord = currentUserRecord.find(entry => entry.outcome == "LOSS" || entry.outcome == "MISSED");
      if (foundLossRecord) {
        this.currentSurvivorUserEliminated = true;
      }

      const foundCurrentWeekRecord = currentUserRecord.find(entry => entry.week == this.gameState.week);
      if (!foundCurrentWeekRecord) {
        this.currentSurvivorUserNeedsPickForThisWeek = true;
      }
    } else if (!isRecordPresent && this.gameState.week > 1) {
      // user joined after survivor pool started and has no records
      this.currentSurvivorUserMissedStart = true;
    } else if (!isRecordPresent && this.gameState.week == 1) {
      // user has no record, and its the first week (they should be prompted to make an entry before deadline)
      this.currentSurvivorUserNeedsPickForThisWeek = true;
    }
  }

  protected convertToPickemsDbElement(entries: any[]) {
    this.pickemsEntries = [];
    entries.forEach(entry => {
      this.pickemsEntries.push({
        owner: entry.owner,
        week: entry.week,
        choice_sleeper_id: entry.choice_sleeper_id,
        choice_gm_name: entry.choice_gm_name,
        outcome: entry.outcome,
        score: entry.score,
        is_double_down: entry.is_double_down,
        is_triple_down: entry.is_triple_down,
        is_auto_pick: entry.is_auto_pick
      });
    });
  }

  protected setPickemsMatchups(matchups: any, week: number) {
    this.pickemsMatchups = [];
    // aLeague is an array where each element is a length 2 array containing players in that matchup
    if (matchups && matchups.aLeague && matchups.bLeague) {
      this.createPickemsEntriesElements(matchups.aLeague, Constants.A_LEAGUE_NAME, week);
      this.createPickemsEntriesElements(matchups.bLeague, Constants.B_LEAGUE_NAME, week);
      this.setPickemsMatchupsCache(matchups.cache);
    } else {
      console.warn("Could not find pickems matchups");
    }
  }

  private createPickemsEntriesElements(matchups, league_type, week: number) {
    const currentUserPickemsEntries = this.pickemsEntries.filter(entry => entry.owner == this.currentUser.email);
    const currentSelectedProfileEntries = this.pickemsEntries.filter(entry => entry.owner == this.pickemsCurrentProfileSelectorValue.user_email);

    for (var matchup of matchups) {
      const player1 = matchup[0];
      const player2 = matchup[1];

      this.pickemsMatchups.push({
        league_type: league_type,
        allow_pick: this.getCurrentUserAllowedToMakePickemsPick(player1.userId, player2.userId, currentUserPickemsEntries),
        pickems_score: this.getPickemsScore(week, player1.userId, player2.userId, currentSelectedProfileEntries),

        manager_1_sleeper_id: player1.userId,
        manager_1_real_name: player1.managerName,
        manager_1_sleeper_name: player1.sleeperName,
        manager_1_team_name: player1.teamName,
        manager_1_avatar_url: player1.avatarUrl,
        manager_1_starters: player1.startingPlayers,
        manager_1_points: player1.points,
        manager_1_pick_status: this.getCurrentPickemsProfilePickStatus(player1.userId, currentSelectedProfileEntries),
        manager_1_underdog_status: this.getManagerUnderdogStatus(week, player1.userId, player2.userId),
        manager_1_record_at_week: this.getManagerRecordForWeek(week, player1.userId),

        manager_2_sleeper_id: player2.userId,
        manager_2_real_name: player2.managerName,
        manager_2_sleeper_name: player2.sleeperName,
        manager_2_team_name: player2.teamName,
        manager_2_avatar_url: player2.avatarUrl,
        manager_2_starters: player2.startingPlayers,
        manager_2_points: player2.points,
        manager_2_pick_status: this.getCurrentPickemsProfilePickStatus(player2.userId, currentSelectedProfileEntries),
        manager_2_underdog_status: this.getManagerUnderdogStatus(week, player2.userId, player1.userId),
        manager_2_record_at_week: this.getManagerRecordForWeek(week, player2.userId),
      });
    }
  }

  // whether or not to show the three buttons for pick/double/triple above matchup
  private getCurrentUserAllowedToMakePickemsPick(playerId1: string, playerId2: string, currentUserPickemsEntries: PickemsDbRow[]): boolean {
    // if the dropdown / entries are not your own, return false
    if (!this.isCurrentUserSelectedInPickemsProfileDropdown()) {
      return false;
    }

    if (this.pickemsCurrentWeekSelectorValue < this.gameState.week) {
      return false;
    }

    // if you have already made a pick in the matchup, return false
    const countEntriesForPlayer1Or2 = currentUserPickemsEntries.filter(entry => entry.choice_sleeper_id == playerId1 || entry.choice_sleeper_id == playerId2).length;
    if (countEntriesForPlayer1Or2 > 0) {
      return false;
    }

    return true;
  }

  private getPickemsScore(week, player1Id, player2Id, currentSelectedProfileEntries): number {
    if (!currentSelectedProfileEntries) {
      return 0;
    }

    const scoreEntry = currentSelectedProfileEntries.find(entry => entry.choice_sleeper_id == player1Id || entry.choice_sleeper_id == player2Id);
    if (!scoreEntry) {
      return 0;
    }

    return scoreEntry.score;
  }

  private getManagerRecordForWeek(week, managerId: string) {
    if (week == 1) {
      return "0-0-0";
    } else if (week > this.gameState.week) {
      return "?-?-?";
    }
    // otherwise, calculate
    const wins = this.pickemsUnderdogWinTotals.find(obj => obj.sleeper_id == managerId).wins;
    const losses = this.pickemsUnderdogWinTotals.find(obj => obj.sleeper_id == managerId).losses;
    const ties = this.pickemsUnderdogWinTotals.find(obj => obj.sleeper_id == managerId).ties;
    return wins + "-" + losses + "-" + ties;
  }

  private getManagerUnderdogStatus(week: number, managerId: string, comparisonManagerId: string): UnderdogStatus {
    // If we are viewing week 1, or a week in the future, underdog status cannot be determined.
    if (week == 1 || week > this.gameState.week) {
      return UnderdogStatus.UNKNOWN;
    }
    const choice_win_total = this.pickemsUnderdogWinTotals.find(obj => obj.sleeper_id == managerId).wins;
    const opp_win_total = this.pickemsUnderdogWinTotals.find(obj => obj.sleeper_id == comparisonManagerId).wins;

    //console.log(`${choice_win_total} vs ${opp_win_total}`);

    if (+choice_win_total < +opp_win_total) {
      return UnderdogStatus.UNDERDOG;
    } else if (+choice_win_total > +opp_win_total) {
      return UnderdogStatus.FAVOURITE;
    } else {
      return UnderdogStatus.EVEN;
    }
  }

  // given the current selected pickems profile, determine if the profile has made this pick or placed a double/triple
  // return enum which is used by the UI for display purposes
  private getCurrentPickemsProfilePickStatus(playerId: string, currentSelectedProfileEntries: PickemsDbRow[]): PickemsPickStatus {
    const pick = currentSelectedProfileEntries.find(entry => entry.choice_sleeper_id == playerId);
    if (pick) {
      if (pick.is_auto_pick) {
        return PickemsPickStatus.AUTO;
      } else if (pick.is_double_down) {
        return PickemsPickStatus.DOUBLE;
      } else if (pick.is_triple_down) {
        return PickemsPickStatus.TRIPLE;
      } else {
        return PickemsPickStatus.PICK;
      }
    }
    return PickemsPickStatus.NONE;
  }

  private isCurrentUserSelectedInPickemsProfileDropdown(): boolean {
    return this.pickemsCurrentProfileSelectorValue.user_email == this.currentUser.email;
  }

  private setPickemsMatchupsCache(cache: any) {
    if (cache && cache.aLeagueRosterMap && cache.bLeagueRosterMap && cache.userInfoMap) {
      this.pickemsMatchupsCache = {
        aLeagueRosterMap: cache.aLeagueRosterMap,
        bLeagueRosterMap: cache.bLeagueRosterMap,
        userInfoMap: cache.userInfoMap
      }
    }
  }

  protected convertToPickemsScoreElement(entries: any[]) {
    this.pickemsScores = [];
    entries.forEach(entry => {
      const user = this.getGameUserFromEmail(entry.owner);
      this.pickemsScores.push({
        owner: entry.owner,
        username: user.username,
        avatarUrl: user.avatar_url ?? Constants.PICKEMS_SURVIVOR_DEFAULT_AVATAR_URL,
        score: entry.total_score,
      });
    });
    this.refreshDataSourcePickemsScore();
  }

  private refreshDataSourcePickemsScore() {
    this.dataSourcePickemsScores = new MatTableDataSource<PickemsScore>(this.pickemsScores);
  }

  // TODO: OPTIMIZE THIS SPAGHETTI
  // Accept multiple rows of entry data per user, and pivot this so that there is a single row per user with one column per entry
  protected convertToSurvivorEntriesElement(entries: any[]) {
    // key = email
    const survivorRowsGroupedByUser = new Map<string, SurvivorDbRow[]>();

    // collect the rows from survivor db into a map keyed on user email
    entries.forEach(entry => {
      let email = entry.owner;
      if (!survivorRowsGroupedByUser.has(email)) {
        survivorRowsGroupedByUser.set(email, [{ owner: email, week: entry.week, choice_sleeper_id: entry.choice_sleeper_id, choice_gm_name: entry.choice_gm_name, outcome: entry.outcome }]);
      } else {
        let values = survivorRowsGroupedByUser.get(email);
        values.push({ owner: email, week: entry.week, choice_sleeper_id: entry.choice_sleeper_id, choice_gm_name: entry.choice_gm_name, outcome: entry.outcome });
        survivorRowsGroupedByUser.set(email, values);
      }
    });

    let tempEntriesArray: SurvivorEntries[] = [];
    // convert the map into the SurvivorEntries data type
    survivorRowsGroupedByUser.forEach((rows: SurvivorDbRow[], key: string) => {
      let survivorRecordByWeek: SurvivorDbRow[] = [];
      for (var i = 1; i <= 14; i++) {
        survivorRecordByWeek.push(this.getSurvivorDbRowRecordWithWeek(rows, i));
      }

      let winCount: number = survivorRecordByWeek.filter(record => record.outcome == "WIN").length;
      const gameUser = this.getGameUserFromEmail(key);

      let newRow: SurvivorEntries = {
        playerEmail: key,
        playerUsername: gameUser.username,
        avatarUrl: gameUser.avatar_url ?? Constants.PICKEMS_SURVIVOR_DEFAULT_AVATAR_URL,
        winCount: winCount,
        week1: this.getSurvivorDbRowRecordWithWeek(rows, 1),
        week2: this.getSurvivorDbRowRecordWithWeek(rows, 2),
        week3: this.getSurvivorDbRowRecordWithWeek(rows, 3),
        week4: this.getSurvivorDbRowRecordWithWeek(rows, 4),
        week5: this.getSurvivorDbRowRecordWithWeek(rows, 5),
        week6: this.getSurvivorDbRowRecordWithWeek(rows, 6),
        week7: this.getSurvivorDbRowRecordWithWeek(rows, 7),
        week8: this.getSurvivorDbRowRecordWithWeek(rows, 8),
        week9: this.getSurvivorDbRowRecordWithWeek(rows, 9),
        week10: this.getSurvivorDbRowRecordWithWeek(rows, 10),
        week11: this.getSurvivorDbRowRecordWithWeek(rows, 11),
        week12: this.getSurvivorDbRowRecordWithWeek(rows, 12),
        week13: this.getSurvivorDbRowRecordWithWeek(rows, 13),
        week14: this.getSurvivorDbRowRecordWithWeek(rows, 14),
      }
      tempEntriesArray.push(newRow);
    });

    this.sortSurvivorEntries(tempEntriesArray);
    this.refreshDataSourceSurvivor();
  }

  // Sort entries so that if current user has any, it appears at the top, followed by alphabetical order for the rest
  private sortSurvivorEntries(tempArray: SurvivorEntries[]) {
    let sortedArray: SurvivorEntries[] = [];
    this.survivorEntries = [];

    const usersOwnSurvivorEntries = tempArray.find(obj => obj.playerEmail == this.currentUser.email);
    if (usersOwnSurvivorEntries) { // current user has an entry, put it first in the table
      this.survivorEntries.push(usersOwnSurvivorEntries);
      sortedArray = tempArray.filter(obj => obj.playerEmail != this.currentUser.email);
    } else { // no entries for current user
      sortedArray = tempArray;
    }
    sortedArray.sort((a, b) => {
      return b.winCount - a.winCount || a.playerUsername.localeCompare(b.playerUsername);
    });
    this.survivorEntries = this.survivorEntries.concat(sortedArray);
  }

  // Refresh the mat-table data source with latest data
  private refreshDataSourceSurvivor() {
    this.dataSourceSurvivor = new MatTableDataSource<SurvivorEntries>(this.survivorEntries);
  }

  // Accepts multiple db rows for a single user, and returns the one that matches the week parameter provided.
  private getSurvivorDbRowRecordWithWeek(rows: SurvivorDbRow[], week: number): SurvivorDbRow {
    let record: SurvivorDbRow = {
      owner: "",
      week: week,
      choice_sleeper_id: "",
      choice_gm_name: "",
      outcome: "UNKNOWN"
    };
    rows.forEach(row => {
      if (row.week == week) {
        record = row;
      }
    });
    return record;
  }

  // Get the schedule info for the current nfl week based on current server time
  protected getCurrentSchedule(server_time_iso: string): GameSchedule {
    // If we cant find an entry in the schedule, it means we are in the pre-season
    const preSeasonEntry: GameSchedule = {
      week: 0,
      start_datetime: "",
      cutoff_datetime: ""
    }

    if (this.gameSchedule) {
      //console.log(this.gameSchedule);
      //console.log(`reducing with ${server_time_iso} ...`);
      return this.gameSchedule.reduce<GameSchedule>((closest, current) => {
        // 1. Skip if the record's start date has already happened (is in the past)
        if (current.start_datetime > server_time_iso) {
          return closest;
        }

        // 2. If we haven't found any future record yet, this is our current best candidate
        if (!closest) {
          return current;
        }

        // 3. Keep the record that has the earlier (closest) future date
        return current.start_datetime > closest.start_datetime ? current : closest;
      }, preSeasonEntry);
    }

    return preSeasonEntry;
  }

  protected getGameUserFromEmail(email: string): any {
    return this.gameUsers.find(user => user.user_email == email);
  }

  protected setPickemsCurrentSelectorValuesToDefault() {
    this.pickemsCurrentProfileSelectorValue = this.gameUsers.find(user => user.user_email == this.currentUser.email);
    this.pickemsCurrentWeekSelectorValue = this.gameState.week;
  }

  private updatePickemsCurrentSelectorValues(payload: any) {
    this.pickemsCurrentProfileSelectorValue = payload.profile;
    this.pickemsCurrentWeekSelectorValue = payload.week;
  }

  // DEMO-ONLY RELATED METHODS

  private demo_getCurrentTimeBasedOnSchedule(week, offset) {
    if (week > 14) week = 14;
    // get the cutoff time based on input week, then get a current time X mins before the cutoff
    const sched = this.gameSchedule.find(s => s.week == week);

    const dateObj = new Date(sched.cutoff_datetime);
    dateObj.setTime(dateObj.getTime() - offset);
    return dateObj.toISOString();
  }

  // simulates the natural server progression to next week that happens via cron job, but triggered manually.
  // Will get whatever week were currently on and add 1, rotate server_time to a time close to the new cutoff date and refresh display.
  protected async demo_NextWeek() {
    //console.log("demo_NextWeek");
    this.isDemoLoading = true;

    await firstValueFrom(this.survivorPickemsApi.demo_PerformWeekEndLogic());

    let curWeek = this.gameState.week;
    let serverTime = this.demo_getCurrentTimeBasedOnSchedule(curWeek, 3600000);
    let scheduleEntry = this.getCurrentSchedule(serverTime);

    if (this.survivorPoolContent)
      this.survivorPoolContent.didUserSuccessfullySubmit = false;

    if (this.gameState.week != 14) { // rotate to next week if not last week
      curWeek++;
      serverTime = this.demo_getCurrentTimeBasedOnSchedule(curWeek, 3600000);
      scheduleEntry = this.getCurrentSchedule(serverTime);
    }

    this.survivorPickemsApi.getSurvivorPickemsGameStates().subscribe(survivorPickemsState => {
      // initialize the gamestate variable
      // Remember: this isnt necessarily the sleeper nflstate week, this is the week for pickems/survivor which rotates forward on tuesday night / wednesday morning (2am).

      this.gameState = {
        season: 2025,
        week: scheduleEntry.week,
        server_current_datetime_utc_iso: serverTime,
        current_start_datetime_utc_iso: scheduleEntry.start_datetime,
        current_start_local_date_display: new Date(scheduleEntry.start_datetime),
        current_cutoff_datetime_utc_iso: scheduleEntry.cutoff_datetime,
        current_cutoff_local_date_display: new Date(scheduleEntry.cutoff_datetime),
        last_processed_week: survivorPickemsState.last_processed_week,
        survivor_pool_outcome: survivorPickemsState.survivor_pool_outcome,
        survivor_pool_winning_owners: survivorPickemsState.survivor_pool_winning_owners,
        survivor_pool_winning_week: survivorPickemsState.survivor_pool_winning_week
      }
      this.gamePhase = GameStatePhase.InSeason;

      this.getGameUsers();
      this.survivorPoolContent?.resetTimer();
      this.pickemsContent?.resetTimer();
      if (this.pickemsContent) {
        this.pickemsContent.selectedWeek = curWeek;
      }
      this.isDemoLoading = false;
    });
  }

  protected async demo_Reset() {
    //console.log("demo_Reset");
    this.isDemoLoading = true;
    // will remove db records for users, gamestate, entries
    await firstValueFrom(this.survivorPickemsApi.demo_Reset());
    window.location.reload();
  }

  protected demo_TestTimer() {
    //console.log("demo_TestTimer");

    let curWeek = this.gameState.week;
    let serverTime = this.demo_getCurrentTimeBasedOnSchedule(curWeek, 1000 * 20);

    this.gameState.server_current_datetime_utc_iso = serverTime;
    this.survivorPoolContent?.resetTimer();
    this.pickemsContent?.resetTimer();
  }
}
