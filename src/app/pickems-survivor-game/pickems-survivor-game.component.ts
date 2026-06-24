import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SurvivorPickemsApiService } from '../_API/survivor-pickems-api.service';
import { SleeperApiService } from '../_API/sleeper-api.service';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatTabsModule } from "@angular/material/tabs";
import { GameSurvivorPoolContentComponent, SurvivorDbRow, SurvivorEntries } from "../game-survivor-pool-content/game-survivor-pool-content.component";
import { GamePickemsContentComponent } from "../game-pickems-content/game-pickems-content.component";
import { GamePickemsStandingsContentComponent } from "../game-pickems-standings-content/game-pickems-standings-content.component";
import { GameUser } from '../pickems-survivor-lobby/pickems-survivor-lobby.component';

export interface GameState {
  season: number,
  week: number,
  current_cutoff_datetime: Date
}

export interface GameSchedule {
  week: number,
  cutoff_datetime: string
}

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
    this.sleeperApi.getNflState().then(state => {
      let week = state.week;
      //TODO: REMOVE THIS. FOR TESTING.
      week = 14;
      const year = state.season;

      // Get the schedule
      this.survivorPickemsApi.getGameSchedule().subscribe(scheduleEntries => {
        this.gameSchedule = scheduleEntries;
        //console.log(this.gameSchedule);

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
          // initialize the gamestate variable
          this.gameState = {
            season: year,
            week: week,
            current_cutoff_datetime: null
          }

          const scheduleEntry = this.getCurrentSchedule();
          //console.log(scheduleEntry);
          this.gameState.current_cutoff_datetime = scheduleEntry.cutoff_datetime;

          this.initializeGame();
        }
      });
    })
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

        this.survivorPickemsApi.getAllSurvivorEntries().subscribe(entries => {
          // entries arrives from api with multiple rows per user.
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
          this.convertToSurvivorEntriesElement(entries);
          this.gamePhase = GameStatePhase.InSeason;
          this.isGameStateLoaded = true;
        });
      });
    });
  }

  protected convertToSurvivorEntriesElement(entries: any[]) {
    this.survivorEntries = [];
    // key = email
    const survivorRowsGroupedByUser = new Map<string, SurvivorDbRow[]>();

    // collect the rows from survivor db into a map keyed on user email
    entries.forEach(entry => {
      let email = entry.owner;
      if (!survivorRowsGroupedByUser.has(email)) {
        survivorRowsGroupedByUser.set(email, [{ owner: email, week: entry.week, choice_sleeper_id: entry.choice_sleeper_id, choice_gm_name: entry.choice_gm_name }]);
      } else {
        let values = survivorRowsGroupedByUser.get(email);
        values.push({ owner: email, week: entry.week, choice_sleeper_id: entry.choice_sleeper_id, choice_gm_name: entry.choice_gm_name });
        survivorRowsGroupedByUser.set(email, values);
      }
    });
    //console.log(survivorRowsGroupedByUser);

    // convert the map into the SurvivorEntries data type
    survivorRowsGroupedByUser.forEach((rows: SurvivorDbRow[], key: string) => {
      let newRow: SurvivorEntries = {
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
      this.survivorEntries.push(newRow);
    });

    //console.log(this.survivorEntries);
  }

  private getSurvivorDbRowRecordWithWeek(rows: SurvivorDbRow[], week: number): SurvivorDbRow {
    let record: SurvivorDbRow = {
      owner: "",
      week: week,
      choice_sleeper_id: "",
      choice_gm_name: "",
    };
    rows.forEach(row => {
      if (row.week == week) {
        record = row;
      }
    });
    return record;
  }

  // Get the schedule info for the current nfl week
  protected getCurrentSchedule() {
    const emptyEntry = {
      week: -1,
      cutoff_datetime: new Date()
    }

    if (this.gameState && this.gameSchedule) {
      let weekIndex = this.gameState.week - 1;

      if (weekIndex < 0 || weekIndex > PickemsSurvivorGameComponent.FANTASY_WEEKS_REGULAR_SEASON - 1) {
        return emptyEntry;
      } else {
        return {
          week: this.gameSchedule[weekIndex].week,
          cutoff_datestring: this.gameSchedule[weekIndex].cutoff_datetime,
          //TODO: NEED TO CHECK THIS AND SEE HOW IT WORKS IN OTHER TIMEZONES
          cutoff_datetime: new Date(this.gameSchedule[weekIndex].cutoff_datetime)
        }
      }
    }
    return emptyEntry;
  }

  protected getGameUserFromEmail(email: string): any {
    return this.gameUsers.find(user => user.user_email == email);
  }

}
