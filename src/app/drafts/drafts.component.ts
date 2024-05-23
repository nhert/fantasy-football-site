import { Component, OnInit } from '@angular/core';
import { SleeperApiService } from '../_API/sleeper-api.service';
import { Constants } from '../_Tools/Constants';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-drafts',
  standalone: true,
  templateUrl: './drafts.component.html',
  styleUrl: './drafts.component.css',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatCardModule, SimpleSpinnerComponent, MatIconModule]
})
export class DraftsComponent implements OnInit {
  loadingSelectOptions: boolean = true;
  loading: boolean = false;
  draftData: any;
  allUsers = Constants.getAllUsersAlphabetical();

  selectOptions: any[];
  selectValue: string; // has league id

  private wrSlotColour: "";

  constructor(private sleeperApi: SleeperApiService) { }

  ngOnInit(): void {
    this.loadingSelectOptions = true;

    this.sleeperApi.getSleeperLeagueIdsAndAllPreviousLeagueIds().then(data => {
      this.selectOptions = data.sort(function (a, b) {
        return parseInt(b.Year) - parseInt(a.Year) || a.LeagueType.localeCompare(b.LeagueType);
      });
      this.loadingSelectOptions = false;
    });
  }

  getUserName(sleeperId) {
    return Constants.getUserReal(sleeperId).name;
  }

  getDraftRounds() {
    let roundsArr = [];
    if (this.draftData) {
      let rounds = parseInt(this.draftData.metadata.settings.rounds);
      for (let i = 0; i < rounds; i++) {
        roundsArr.push(i);
      }
    }
    return roundsArr;
  }

  createDraftPickDataForHtml(userId: string, round: number) {
    let data = {};
    let playerDraftSlot = this.draftData.draftOrder[userId];
    if (this.draftData) {
      let pickData = this.draftData.data.get(userId)[round];
      data = {
        avatarUrl: Constants.getNflPlayerAvatarUrl(pickData.metadata.player_id),
        name: parseInt(pickData.metadata.player_id) ? pickData.metadata.first_name.charAt(0) + ". " + pickData.metadata.last_name : pickData.metadata.last_name + " D/ST",
        round: pickData.round,
        pick_no: pickData.pick_no,
        slot: pickData.draft_slot,
        traded: pickData.draft_slot != playerDraftSlot,
        tradedGm: this.getUserNameFromSlotNumber(pickData.draft_slot),
        colourClass: this.getSlotColour(pickData.metadata.position) + " draft-pick-cell"
      }
    }
    return data;
  }

  getSlotColour(position: string) {
    switch (position) {
      case "WR":
        return "wr-class";
      case "RB":
        return "rb-class";
      case "QB":
        return "qb-class";
      case "TE":
        return "te-class";
      case "K":
        return "k-class";
      case "DEF":
        return "def-class";
      default:
        return ""
    }
  }

  getUserNameFromSlotNumber(slot: number) {
    let ret = "";
    if (this.draftData) {
      for (let i = 0; i < this.draftData.users.length; i++) {
        let userId = this.draftData.users[i];
        if (this.draftData.draftOrder[userId] == slot) {
          ret = this.getUserName(userId);
        }
      }
    }
    return ret;
  }

  selectValueChanged() {
    this.loading = true;

    this.sleeperApi.getSleeperDrafts(this.selectValue).then(data => {
      this.draftData = data;
      this.loading = false;
      this.getDraftRounds();
    });
  }

}
