import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatLabel, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { SimpleTableComponent } from '../simple-table/simple-table.component';
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";
import { SleeperApiService } from '../_API/sleeper-api.service';
import { MatIcon } from "@angular/material/icon";
import { MatExpansionPanel, MatExpansionModule } from "@angular/material/expansion";

@Component({
  selector: 'app-live-scores',
  standalone: true,
  imports: [SimpleTableComponent, MatProgressSpinnerModule, CommonModule, FormsModule, MatLabel, MatInputModule, MatFormFieldModule, MatSelectModule, MatDividerModule, ReactiveFormsModule, MatCardModule, SimpleSpinnerComponent, MatIcon, MatExpansionPanel, MatExpansionModule],
  templateUrl: './live-scores.component.html',
  styleUrl: './live-scores.component.css'
})
export class LiveScoresComponent {
  loading: boolean = true;
  refreshing: boolean = false;
  aLeagueMatchups: any[];
  bLeagueMatchups: any[];
  nflData: any;
  cachedData: any; // Data that does not commonly change such as usernames, avatars, etc

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
      this.updateScoreValuesOnly(data.aLeague, data.bLeague);
    });
  }

  // updates score values in the matchups array only - so that the other UI elements on the page don't "flash" from a refresh
  updateScoreValuesOnly(aLeagueData, bLeagueData) {
    // Update the overall scores
    for (let matchupIndex = 0; matchupIndex < aLeagueData.length; matchupIndex++) {
      this.aLeagueMatchups[matchupIndex][0].points = aLeagueData[matchupIndex][0].points;
      this.aLeagueMatchups[matchupIndex][1].points = aLeagueData[matchupIndex][1].points;
      // Update starting player scores
      for (let playerIndex = 0; playerIndex < 9; playerIndex++) {
        if (this.aLeagueMatchups[matchupIndex][0].startingPlayers[playerIndex]) {
          this.aLeagueMatchups[matchupIndex][0].startingPlayers[playerIndex].playerScore = aLeagueData[matchupIndex][0].startingPlayers[playerIndex].playerScore;
        }
        if (this.aLeagueMatchups[matchupIndex][1].startingPlayers[playerIndex]) {
          this.aLeagueMatchups[matchupIndex][1].startingPlayers[playerIndex].playerScore = aLeagueData[matchupIndex][1].startingPlayers[playerIndex].playerScore;
        }
      }
    }
    for (let matchupIndex = 0; matchupIndex < bLeagueData.length; matchupIndex++) {
      this.bLeagueMatchups[matchupIndex][0].points = bLeagueData[matchupIndex][0].points;
      this.bLeagueMatchups[matchupIndex][1].points = bLeagueData[matchupIndex][1].points;
      // Update starting player scores
      for (let playerIndex = 0; playerIndex < 9; playerIndex++) {
        if (this.bLeagueMatchups[matchupIndex][0].startingPlayers[playerIndex]) {
          this.bLeagueMatchups[matchupIndex][0].startingPlayers[playerIndex].playerScore = bLeagueData[matchupIndex][0].startingPlayers[playerIndex].playerScore;
        }
        if (this.bLeagueMatchups[matchupIndex][1].startingPlayers[playerIndex]) {
          this.bLeagueMatchups[matchupIndex][1].startingPlayers[playerIndex].playerScore = bLeagueData[matchupIndex][1].startingPlayers[playerIndex].playerScore;
        }
      }
    }
  }

  load() {
    this.loading = true;
    this.aLeagueMatchups = [];
    this.bLeagueMatchups = [];

    // spinner on
    this.sleeperApi.getLiveScores(null).then(data => {
      this.loading = false;
      this.aLeagueMatchups = data.aLeague;
      this.bLeagueMatchups = data.bLeague;
      this.nflData = data.nflData;
      this.cachedData = data.cache;
    });
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
