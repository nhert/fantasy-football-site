import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { GameUser } from '../pickems-survivor-lobby/pickems-survivor-lobby.component';
import { GameState } from '../pickems-survivor-game/pickems-survivor-game.component';
import { MatSelect, MatSelectChange } from "@angular/material/select";
import { Constants } from '../_Tools/Constants';
import { MatOptionModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { SurvivorPickemsApiService } from '../_API/survivor-pickems-api.service';
import { FormsModule } from '@angular/forms';

export interface SurvivorEntries {
  playerUsername: string;
  week1: SurvivorDbRow;
  week2: SurvivorDbRow;
  week3: SurvivorDbRow;
  week4: SurvivorDbRow;
  week5: SurvivorDbRow;
  week6: SurvivorDbRow;
  week7: SurvivorDbRow;
  week8: SurvivorDbRow;
  week9: SurvivorDbRow;
  week10: SurvivorDbRow;
  week11: SurvivorDbRow;
  week12: SurvivorDbRow;
  week13: SurvivorDbRow;
  week14: SurvivorDbRow;
}

// represents a row from the survivor entries table with only essential columns
export interface SurvivorDbRow {
  owner: string,
  week: number,
  choice_sleeper_id: string,
  choice_gm_name: string,
}

@Component({
  selector: 'game-survivor-pool-content',
  standalone: true,
  imports: [MatTableModule, CommonModule, MatSelect, MatOptionModule, MatFormFieldModule],
  templateUrl: './game-survivor-pool-content.component.html',
  styleUrl: './game-survivor-pool-content.component.css'
})
export class GameSurvivorPoolContentComponent {
  @Input('currentUser') currentUser: GameUser;
  @Input('gameState') gameState: GameState;
  @Input('gameUsers') gameUsers: any[];
  @Input('survivorEntries') survivorEntries: SurvivorEntries[];
  @Input('made_choices_sleeper_ids') made_choices_sleeper_ids: string[];

  // Table related vars
  displayedColumns: string[] = [];
  readonly column_username = 'playerUsername';
  readonly column_week_prefix = 'week';
  isTablePrepared: boolean = false;
  dataSource: MatTableDataSource<SurvivorEntries>;
  selectedGmChoiceValue: any = null;
  disableUiControl: boolean = false;

  // Useful data
  readonly b3fl_users = Constants.getAllActiveUsers();

  constructor(private survivorPickemsApi: SurvivorPickemsApiService) { }

  ngOnInit() {
    this.prepData();
    this.isTablePrepared = true;
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
    this.disableUiControl = true;
    const selectedUser = this.selectedGmChoiceValue;
    this.survivorPickemsApi.updateSurvivorChoiceForUser(this.currentUser.email, this.gameState.week, selectedUser).subscribe(response => {
      this.disableUiControl = false;
      // TODO: UPDATE UI AFTER SUBMIT?
    });
  }

  // util methods

  private prepData() {
    this.dataSource = new MatTableDataSource<SurvivorEntries>(this.survivorEntries);
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

  protected getGameUserFromEmail(email: string) {
    this.gameUsers.filter((user: any) => user.user_email == email);
  }
}
