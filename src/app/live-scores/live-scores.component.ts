import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatLabel, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";
import { SleeperApiService } from '../_API/sleeper-api.service';
import { MatIcon } from "@angular/material/icon";
import { MatExpansionPanel, MatExpansionModule } from "@angular/material/expansion";
import { Matchup, MatchupCache } from '../_Models/common.models';

@Component({
  selector: 'app-live-scores',
  standalone: true,
  imports: [MatProgressSpinnerModule, CommonModule, FormsModule, MatLabel, MatInputModule, MatFormFieldModule, MatSelectModule, MatDividerModule, ReactiveFormsModule, MatCardModule, SimpleSpinnerComponent, MatIcon, MatExpansionPanel, MatExpansionModule],
  templateUrl: './live-scores.component.html',
  styleUrl: './live-scores.component.css'
})
export class LiveScoresComponent {
  loading: boolean = true;
  refreshing: boolean = false;
  aLeagueMatchups: Matchup[] = [];
  bLeagueMatchups: Matchup[] = [];
  nflData: any;
  cachedData: MatchupCache; // Data that does not commonly change such as usernames, avatars, etc

  isPreseason: boolean = false;

  constructor(private sleeperApi: SleeperApiService) { }

  ngOnDestroy(): void {
    this.loading = false;
  }

  ngOnInit(): void {
    this.load();
  }

  refreshDisplayedData() {
    this.refreshing = true;
    this.sleeperApi.getLiveScores(this.cachedData).then(data => {
      this.refreshing = false;
      if (data.dataAvailable)
        this.updateScoreValuesOnly(data.aLeague, data.bLeague);
    });
  }

  // updates score values in the matchups array only - so that the other UI elements on the page don't "flash" from a refresh
  updateScoreValuesOnly(aLeagueData, bLeagueData) {
    // Update the overall scores
    for (let matchupIndex = 0; matchupIndex < aLeagueData.length; matchupIndex++) {
      this.aLeagueMatchups[matchupIndex].manager_1_points = aLeagueData[matchupIndex][0].points;
      this.aLeagueMatchups[matchupIndex].manager_2_points = aLeagueData[matchupIndex][1].points;
      // Update starting player scores
      for (let playerIndex = 0; playerIndex < 9; playerIndex++) {
        if (this.aLeagueMatchups[matchupIndex].manager_1_starters[playerIndex]) {
          this.aLeagueMatchups[matchupIndex].manager_1_starters[playerIndex].playerScore = aLeagueData[matchupIndex][0].startingPlayers[playerIndex].playerScore;
        }
        if (this.aLeagueMatchups[matchupIndex].manager_2_starters[playerIndex]) {
          this.aLeagueMatchups[matchupIndex].manager_2_starters[playerIndex].playerScore = aLeagueData[matchupIndex][1].startingPlayers[playerIndex].playerScore;
        }
      }
    }
    for (let matchupIndex = 0; matchupIndex < bLeagueData.length; matchupIndex++) {
      this.bLeagueMatchups[matchupIndex].manager_1_points = bLeagueData[matchupIndex][0].points;
      this.bLeagueMatchups[matchupIndex].manager_2_points = bLeagueData[matchupIndex][1].points;
      // Update starting player scores
      for (let playerIndex = 0; playerIndex < 9; playerIndex++) {
        if (this.bLeagueMatchups[matchupIndex].manager_1_starters[playerIndex]) {
          this.bLeagueMatchups[matchupIndex].manager_1_starters[playerIndex].playerScore = bLeagueData[matchupIndex][0].startingPlayers[playerIndex].playerScore;
        }
        if (this.bLeagueMatchups[matchupIndex].manager_2_starters[playerIndex]) {
          this.bLeagueMatchups[matchupIndex].manager_2_starters[playerIndex].playerScore = bLeagueData[matchupIndex][1].startingPlayers[playerIndex].playerScore;
        }
      }
    }
  }

  load() {
    this.loading = true;

    // spinner on
    this.sleeperApi.getLiveScores(null).then(data => {
      this.loading = false;
      this.nflData = data.nflData;

      if (this.nflData.week == 0 || !data.dataAvailable) {
        this.isPreseason = true;
      } else {
        this.initializeMatchupsList(data);
        this.cachedData = data.cache;
      }
    });
  }

  initializeMatchupsList(data) {
    if (data.aLeague && data.bLeague) {
      this.aLeagueMatchups = [];
      this.bLeagueMatchups = [];

      for (var matchup of data.aLeague) {
        const player1 = matchup[0];
        const player2 = matchup[1];

        this.aLeagueMatchups.push({
          matchup_id: player1.matchupId ?? player2.matchupId, // they should be identical

          manager_1_sleeper_id: player1.userId,
          manager_1_real_name: player1.managerName,
          manager_1_sleeper_name: player1.sleeperName,
          manager_1_team_name: player1.teamName,
          manager_1_avatar_url: player1.avatarUrl,
          manager_1_starters: player1.startingPlayers,
          manager_1_points: player1.points,
          manager_1_fantasy_record: '?-?-?',

          manager_2_sleeper_id: player2.userId,
          manager_2_real_name: player2.managerName,
          manager_2_sleeper_name: player2.sleeperName,
          manager_2_team_name: player2.teamName,
          manager_2_avatar_url: player2.avatarUrl,
          manager_2_starters: player2.startingPlayers,
          manager_2_points: player2.points,
          manager_2_fantasy_record: '?-?-?',
        });
      }

      for (var matchup of data.bLeague) {
        const player1 = matchup[0];
        const player2 = matchup[1];

        this.bLeagueMatchups.push({
          matchup_id: player1.matchupId ?? player2.matchupId, // they should be identical

          manager_1_sleeper_id: player1.userId,
          manager_1_real_name: player1.managerName,
          manager_1_sleeper_name: player1.sleeperName,
          manager_1_team_name: player1.teamName,
          manager_1_avatar_url: player1.avatarUrl,
          manager_1_starters: player1.startingPlayers,
          manager_1_points: player1.points,
          manager_1_fantasy_record: '?-?-?',

          manager_2_sleeper_id: player2.userId,
          manager_2_real_name: player2.managerName,
          manager_2_sleeper_name: player2.sleeperName,
          manager_2_team_name: player2.teamName,
          manager_2_avatar_url: player2.avatarUrl,
          manager_2_starters: player2.startingPlayers,
          manager_2_points: player2.points,
          manager_2_fantasy_record: '?-?-?',
        });
      }

    }
  }

  isLoaded() {
    return !this.loading && this.aLeagueMatchups && this.bLeagueMatchups;
  }

  isRefreshed() {
    return !this.refreshing && this.aLeagueMatchups && this.bLeagueMatchups;
  }

  refreshButtonDisabled() {
    return !this.isLoaded() || !this.isRefreshed();
  }
}
