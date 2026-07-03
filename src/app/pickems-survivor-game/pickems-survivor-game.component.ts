import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SurvivorPickemsApiService } from '../_API/survivor-pickems-api.service';
import { SleeperApiService } from '../_API/sleeper-api.service';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatTabsModule } from "@angular/material/tabs";
import { GameSurvivorPoolContentComponent } from "../game-survivor-pool-content/game-survivor-pool-content.component";
import { GamePickemsContentComponent } from "../game-pickems-content/game-pickems-content.component";
import { GamePickemsStandingsContentComponent } from "../game-pickems-standings-content/game-pickems-standings-content.component";
import { GameSchedule, GameState, GameUser, SurvivorDbRow, SurvivorEntries } from '../_Models/survivor.pickems.models';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, take } from 'rxjs';

enum GameStatePhase {
  PreSeason, InSeason, PostSeason
}

@Component({
  selector: 'pickems-survivor-game',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatTabsModule, GameSurvivorPoolContentComponent, GamePickemsContentComponent, GamePickemsStandingsContentComponent],
  templateUrl: './pickems-survivor-game.component.html',
  styleUrl: './pickems-survivor-game.component.css'
})
export class PickemsSurvivorGameComponent {
  // provided by pickems-survivor-lobby
  // email, username, picture
  @Input('currentUser') currentUser: GameUser;

  @ViewChild(GameSurvivorPoolContentComponent) survivorPoolContent!: GameSurvivorPoolContentComponent;

  public static FANTASY_WEEKS_REGULAR_SEASON = 14; // number of weeks in the fantasy regular season

  // state information
  public gameState: GameState; // nfl week rotates to the next on wednesdays at 2-3am. 
  public gamePhase: GameStatePhase; // Preseason / Reg Season / Post Season
  public gameSchedule: GameSchedule[];
  public gameUsers: any[] = [];
  public firstGameDate: Date; // utility variable. in pre-season displays first game of the season.

  // survivor pool vars
  public made_choices_sleeper_ids: string[] = [];
  public survivorEntries: SurvivorEntries[] = [];
  public dataSource: MatTableDataSource<SurvivorEntries>;
  public currentSurvivorUserEliminated: boolean = false;
  public currentSurvivorUserMissedStart: boolean = false;

  // loading booleans
  isGameStateLoaded: boolean = false;

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
    this.currentSurvivorUserEliminated = false;
    this.currentSurvivorUserMissedStart = false;
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
        // The schedule.json file specifies times with EST timezone.
        // If "new Date" sees the timezone, it can convert to UTC using toISOString without using users locale/timezone
        start_datetime: new Date(entry.start_datetime).toISOString(),
        cutoff_datetime: new Date(entry.cutoff_datetime).toISOString()
      });
    });
  }

  setGameState(state, time, scheduleEntries, survivorPickemsState) {
    let week = state.week;
    const year = state.season;
    let server_time_utc_iso = time.server_time;

    //TODO: REMOVE THIS. FOR TESTING.
    week = 1;
    server_time_utc_iso = "2026-12-11T01:14:40.000Z";
    /*
      Testing values for server time

      2026-12-11T01:14:40.000Z  - 20 seconds before cutoff time week 14
    */

    // Its the pre-season
    if (week <= 0) {
      console.log("Pickems/Survivor Pool page has been loaded pre-season");
      this.gamePhase = GameStatePhase.PreSeason;
      this.firstGameDate = new Date(scheduleEntries[0].cutoff_datetime);
      this.isGameStateLoaded = true;
    }
    // Its the post-season
    else if (week > PickemsSurvivorGameComponent.FANTASY_WEEKS_REGULAR_SEASON) {
      console.log("Pickems/Survivor Pool page has been loaded post-season");
      this.gamePhase = GameStatePhase.PostSeason;
      this.isGameStateLoaded = true;
    }
    // Its the fantasy regular season 
    else {
      const scheduleEntry = this.getCurrentSchedule(server_time_utc_iso);

      // initialize the gamestate variable
      // Remember: this isnt necessarily the sleeper nflstate week, this is the week for pickems/survivor which rotates forward on tuesday night / wednesday morning (2am).
      this.gameState = {
        season: year,
        week: scheduleEntry.week,
        server_current_datetime_utc_iso: server_time_utc_iso,
        current_start_datetime_utc_iso: scheduleEntry.start_datetime,
        current_cutoff_datetime_utc_iso: scheduleEntry.cutoff_datetime,
        last_processed_week: survivorPickemsState.last_processed_week,
        survivor_pool_outcome: survivorPickemsState.survivor_pool_outcome,
        survivor_pool_winning_owners: survivorPickemsState.survivor_pool_winning_owners,
      }
      this.gamePhase = GameStatePhase.InSeason;

      //console.log("state set");
      //console.log(this.gameState.server_current_datetime_iso + " -> " + new Date(this.gameState.server_current_datetime_iso));
      //console.log(this.gameState.current_cutoff_datetime_iso + " -> " + new Date(this.gameState.current_cutoff_datetime_iso));

      this.initializeGame();
    }
  }

  initializeGame() {
    this.survivorPickemsApi.getSurvivorChoicesMadeByUser(this.currentUser.email).subscribe(entries => {
      entries.forEach(element => {
        this.made_choices_sleeper_ids.push(element.choice_sleeper_id);
      });

      this.survivorPickemsApi.getAllUsers().subscribe(users => {
        users.forEach(user => {
          this.gameUsers.push(user);
        });

        this.reloadEntries();
      });
    });
  }

  public reloadEntries() {
    this.survivorPickemsApi.getAllSurvivorEntries().subscribe(entries => {
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
      this.determineCurrentUserEliminated(entries);
      this.convertToSurvivorEntriesElement(entries);
      this.isGameStateLoaded = true;
    });
  }

  public reloadServerTime() {
    this.survivorPickemsApi.getServerTime().subscribe(time => {
      this.gameState.server_current_datetime_utc_iso = time.server_time;
      this.survivorPoolContent.resetTimer();
    });
  }

  private determineCurrentUserEliminated(entries: any[]) {
    this.currentSurvivorUserEliminated = false;
    this.currentSurvivorUserMissedStart = false;

    const currentUserRecord = entries.filter(obj => obj.owner == this.currentUser.email);
    const isRecordPresent = currentUserRecord && currentUserRecord.length > 0;

    if (isRecordPresent) { // user has existing records, check if any lost
      const foundLossRecord = currentUserRecord.find(entry => entry.outcome === "LOSS");
      if (foundLossRecord) {
        this.currentSurvivorUserEliminated = true;
      }
    } else if (!isRecordPresent && this.gameState.week > 1) {
      // user joined after survivor pool started and has no records
      this.currentSurvivorUserMissedStart = true;
    }
  }

  // TODO: OPTIMIZE THIS
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
      let newRow: SurvivorEntries = {
        playerEmail: key,
        playerUsername: this.getGameUserFromEmail(key).username,
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
    this.refreshDataSource();
  }

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
    sortedArray.sort((a, b) => a.playerUsername.localeCompare(b.playerUsername));
    this.survivorEntries = this.survivorEntries.concat(sortedArray);
  }

  private refreshDataSource() {
    this.dataSource = new MatTableDataSource<SurvivorEntries>(this.survivorEntries);
  }

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

  // Get the schedule info for the current nfl week
  protected getCurrentSchedule(server_time_iso: string): GameSchedule {
    const emptyEntry: GameSchedule = {
      week: -1,
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
      }, emptyEntry);
    }

    return emptyEntry;
  }

  protected getGameUserFromEmail(email: string): any {
    return this.gameUsers.find(user => user.user_email == email);
  }

}
