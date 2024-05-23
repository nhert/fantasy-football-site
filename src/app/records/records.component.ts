import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatLabel, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SimpleTableComponent } from '../simple-table/simple-table.component';
import { Constants } from '../_Tools/Constants';
import { SleeperApiService } from '../_API/sleeper-api.service';
import { Stats } from '../_Tools/Stats';
import { Utils } from '../_Tools/Utils';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ThemePalette } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { StatsCardComponent } from "../stats-card/stats-card.component";
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";

@Component({
  selector: 'app-records',
  standalone: true,
  templateUrl: './records.component.html',
  styleUrl: './records.component.css',
  imports: [SimpleTableComponent, MatProgressSpinnerModule, CommonModule, FormsModule, MatLabel, MatInputModule, MatFormFieldModule, MatSelectModule, MatDividerModule, ReactiveFormsModule, MatCheckboxModule, MatCardModule, StatsCardComponent, SimpleSpinnerComponent]
})
export class RecordsComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  columnHeaders: string[];
  dataSource: any[];
  displayedData: any[]
  allUsers = Constants.getAllUsersAlphabetical();

  // Select form values
  managerValue: string;
  timespanValue: string;
  leagueValue: string;
  showEliminatedGamesValue: boolean;
  primary: ThemePalette = 'primary';

  // Records stats
  stats: Stats;
  paramUser: string = "";

  constructor(private sleeperApi: SleeperApiService, private route: ActivatedRoute) { }

  ngOnDestroy(): void {
    this.loading = false;
  }

  // When component starts, immediately call API method.
  ngOnInit(): void {
    this.loading = false;
    this.handleQueryParams();
    this.setSelectDefaults();
  }

  getCSVFileName() {
    if (this.isValid()) {
      return Constants.getUserReal(this.managerValue).name + "_records_";
    } else {
      return "Download";
    }
  }

  handleQueryParams() {
    this.paramUser = this.route.snapshot.queryParamMap.get('user');
  }

  setSelectDefaults() {
    this.timespanValue = 'all';
    this.leagueValue = 'all';
    this.showEliminatedGamesValue = true;
    if (this.paramUser) {
      this.managerValue = this.paramUser;
      this.managerDropdownChanged();
    }
  }

  managerDropdownChanged() {
    if (this.isValid()) {
      this.load();
    }
  }

  isValid() {
    return (this.managerValue);
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

    if (!this.showEliminatedGamesValue) {
      var typeCheck = Constants.GAME_TYPE_ELIMINATED;
      tableData = tableData.filter(obj => {
        return obj.game_type != typeCheck
      })
    }

    let displayed = [];
    tableData.forEach(record => {
      displayed.push({
        "Game Type": Utils.beautifyForGameTypeColumn(record.game_type),
        "Result": Utils.beautifyForOutcomeColumn(record.outcome),
        "Pts For": record.owner_score,
        "Pts Against": record.opponent_score,
        "Year": record.year,
        "Week": record.week,
        "Platform": record.type,
        "League": record.league_type
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
    this.sleeperApi.getAllTimeRecordData(this.managerValue).then(data => {
      this.loading = false;
      this.dataSource = data;
      this.refreshDisplayedData();
    });
  }

}
