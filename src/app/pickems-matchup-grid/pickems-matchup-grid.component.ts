import { Component, input, Input, output } from '@angular/core';
import { GameState, PickemsMatchup, PickemsPickStatus } from '../_Models/survivor.pickems.models';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { PickemsSurvivorUnderdogDisplayComponent } from "../pickems-survivor-underdog-display/pickems-survivor-underdog-display.component";

@Component({
  selector: 'pickems-matchup-grid',
  imports: [MatSelectModule, MatCardModule, MatIconModule, CommonModule, MatExpansionModule, MatIconModule, MatButtonModule, PickemsSurvivorUnderdogDisplayComponent],
  templateUrl: './pickems-matchup-grid.component.html',
  styleUrl: './pickems-matchup-grid.component.css'
})
export class PickemsMatchupGridComponent {
  isShowPickemsScores = input.required<boolean>();
  isCurrentWeekAndPassedDeadline = input.required<boolean>();
  isPickemsCurrentlyLoading = input.required<boolean>();
  pickemsMatchups = input.required<PickemsMatchup[]>();

  hasDoubleDownAvailable = input.required<boolean>();
  hasTripleDownAvailable = input.required<boolean>();

  tryRemovePickemsPick = output<string>();
  trySubmitPickemsPick = output<any>();
  trySubmitPickemsDoublePick = output<any>();
  trySubmitPickemsTriplePick = output<any>();

  StatusEnum = PickemsPickStatus;

  isViewInit: boolean = false;

  onClickOnMadePickChip(sleeperId) {
    //console.log("remove: " + sleeperId);
    this.tryRemovePickemsPick.emit(sleeperId);
  }

  ngOnInit(): void {
    this.isViewInit = true;
  }

  protected getPickemsScoreDisplay(score: number) {
    if (!this.isShowPickemsScores()) return "";
    if (score > 0) return "+" + score;
    return score;
  }

  onClickMakePick(matchup_id, sleeper_id) {
    //console.log("pick made " + sleeper_id);
    const pickPayload = {
      matchup_id: matchup_id,
      sleeper_id: sleeper_id
    }
    this.trySubmitPickemsPick.emit(pickPayload);
  }

  onClickDoubleDown(matchup_id, sleeper_id) {
    //console.log("double down made " + sleeper_id);
    const pickPayload = {
      matchup_id: matchup_id,
      sleeper_id: sleeper_id
    }
    this.trySubmitPickemsDoublePick.emit(pickPayload);
  }

  onClickTripleDown(matchup_id, sleeper_id) {
    //console.log("triple down made " + sleeper_id);
    const pickPayload = {
      matchup_id: matchup_id,
      sleeper_id: sleeper_id
    }
    this.trySubmitPickemsTriplePick.emit(pickPayload);
  }
}
