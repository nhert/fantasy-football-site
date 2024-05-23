import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Constants } from '../_Tools/Constants';
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";
import { StatsCardComponent } from "../stats-card/stats-card.component";
import { SleeperApiService } from '../_API/sleeper-api.service';
import { Stats } from '../_Tools/Stats';
import { Utils } from '../_Tools/Utils';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SimpleTableComponent } from '../simple-table/simple-table.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profiles',
  standalone: true,
  templateUrl: './profiles.component.html',
  styleUrl: './profiles.component.css',
  imports: [SimpleTableComponent, MatProgressSpinnerModule, CommonModule, FormsModule, MatLabel, MatInputModule, MatFormFieldModule, MatSelectModule, MatDividerModule, ReactiveFormsModule, MatCheckboxModule, MatCardModule, StatsCardComponent, SimpleSpinnerComponent, MatTooltipModule, MatIconModule]
})
export class ProfilesComponent implements OnInit, OnDestroy {
  loading: boolean = true;
  dataSource: any[];
  columnHeaders: string[];
  allUsers = Constants.getAllUsersAlphabetical();

  managerValue: string;
  stats: Stats;
  avatarUrl: string;
  paramUser: string;

  showCore3: boolean;
  corePlayer1: any;
  corePlayer2: any;
  corePlayer3: any;

  constructor(private sleeperApi: SleeperApiService, private route: ActivatedRoute) { }

  tooltip_thrownWeeks() {
    return `A week is considered "Thrown" by the B3FL when all of the following are true:

    - The GM has started less than half a roster (under 5 players)
    - The GM's opponent has started a full roster of 9 players
    - The GM is not on bye week or playing a post-elimination playoff game
    - Game was played in the Sleeper Era (2022 season and later)`;
  }

  tooltip_buddyWeeks() {
    return `A "Buddy Week" is when all of the following are true:

    - The GM and their opponent have started less than a full roster
    - The GM and their opponent have started the same number of players
    - The GM is not on bye week or playing a post-elimination playoff game
    - Game was played in the Sleeper Era (2022 season and later)`;
  }

  tooltip_nukeWeeks() {
    return `A "Nuke Week" is when all of the following are true:

    - The GM has lost by 100 pts or more
    - The GM has started a full roster of 9 players
    - The GM is not on bye week or playing a post-elimination playoff game
    - Game was played in the Sleeper Era (2022 season and later)`;
  }

  tooltip_patheticWeeks() {
    return `A "Loser Week" is when all of the following are true:

    - The GM has scored 50 pts or less
    - The GM has started a full roster of 9 players
    - The GM is not on bye week or playing a post-elimination playoff game
    - Game was played in the Sleeper Era (2022 season and later)`;
  }

  tooltip_core3() {
    return 'GM\'s favourite players, by total number of weeks spent on their roster. Only calculated for the Sleeper Era (2022 season and later)'
  }

  ngOnDestroy(): void {
    this.loading = false;
  }

  // When component starts, immediately call API method.
  ngOnInit(): void {
    this.loading = false;
    this.handleQueryParams();
  }

  handleQueryParams() {
    this.paramUser = this.route.snapshot.queryParamMap.get('user');
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
    this.stats = new Stats(this.dataSource);
    this.columnHeaders = this.stats.getHeadersForTableDisplay();
  }

  load() {
    this.loading = true;

    this.sleeperApi.getGmProfile(this.managerValue).then(profile => {
      this.avatarUrl = profile.gmAvatar;
      this.dataSource = profile.records;
      if (profile.core3.length > 0) {
        this.corePlayer1 = profile.core3[0];
        this.corePlayer2 = profile.core3[1];
        this.corePlayer3 = profile.core3[2];
        this.showCore3 = true;
      }
      this.refreshDisplayedData();
      this.loading = false;
    });
  }
}
