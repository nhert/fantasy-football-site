import { Component, OnDestroy, OnInit } from '@angular/core';
import { SimpleTableComponent } from "../simple-table/simple-table.component";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { SleeperApiService } from '../_API/sleeper-api.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Constants } from '../_Tools/Constants';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { Utils } from '../_Tools/Utils';
import { Stats } from '../_Tools/Stats';
import { MatCardModule } from '@angular/material/card';
import { StatsCardComponent } from "../stats-card/stats-card.component";
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";

@Component({
  selector: 'app-matchup-history',
  standalone: true,
  templateUrl: './matchup-history.component.html',
  styleUrl: './matchup-history.component.css',
  imports: [SimpleTableComponent, MatProgressSpinnerModule, CommonModule, FormsModule, MatLabel, MatInputModule, MatFormFieldModule, MatSelectModule, MatDividerModule, ReactiveFormsModule, MatCardModule, StatsCardComponent, SimpleSpinnerComponent]
})
export class MatchupHistoryComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  columnHeaders: string[];
  dataSource: any[];
  displayedData: any[]
  allUsers = Constants.getAllUsersAlphabetical();

  // Select form values
  managerLeftValue: string;
  managerRightValue: string;
  timespanValue: string;
  leagueValue: string;

  // Records stats
  stats: Stats;

  constructor(private sleeperApi: SleeperApiService) { }

  ngOnDestroy(): void {
    this.loading = false;
  }

  // When component starts, immediately call API method.
  ngOnInit(): void {
    this.loading = false;
    this.setSelectDefaults();
  }

  getCSVFileName() {
    if (this.isValid()) {
      return Constants.getUserReal(this.managerLeftValue).name + "_vs_" + Constants.getUserReal(this.managerRightValue).name;
    } else {
      return "Download";
    }
  }

  setSelectDefaults() {
    this.timespanValue = 'all';
    this.leagueValue = 'all';
  }

  managerDropdownChanged() {
    if (this.isValid()) {
      this.load();
    }
  }

  isValid() {
    return (this.managerLeftValue && this.managerRightValue) &&
      (this.managerLeftValue != this.managerRightValue);
  }

  refreshDisplayedData() {
    if (!this.dataSource || this.dataSource.length <= 0) return;

    let tableData = this.dataSource;
    // If timespan dropdown is anything other than all, filter.
    if (this.timespanValue != "all") {
      var typeCheck = this.timespanValue == "legacyOnly" ? "NFL.com" : "Sleeper";
      tableData = tableData.filter(obj => {
        return obj.type === typeCheck
      })
    }

    if (this.leagueValue != "all") {
      var typeCheck = this.leagueValue;
      tableData = tableData.filter(obj => {
        return obj.league_type === typeCheck
      })
    }

    let displayed = [];
    tableData.forEach(record => {
      displayed.push({
        "Result": Utils.beautifyForOutcomeColumn(record.outcome),
        "Pts For": record.owner_score,
        "Pts Against": record.opponent_score,
        "Year": record.year,
        "Week": record.week,
        "Platform": record.type,
        "League": record.league_type,
        "Game Type": record.game_type
      });
    });

    this.stats = new Stats(tableData);
    this.displayedData = displayed;
    this.columnHeaders = this.displayedData && this.displayedData.length > 0 ? Object.keys(this.displayedData[0]) : [];
  }

  load() {
    this.loading = true;
    this.displayedData = [];

    // spinner on
    this.sleeperApi.getMatchupData(this.managerLeftValue, this.managerRightValue).then(data => {
      this.loading = false;
      this.dataSource = data;
      this.refreshDisplayedData();
    });
  }

}
