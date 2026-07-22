import { Component, Input } from '@angular/core';
import { UnderdogStatus } from '../_Models/survivor.pickems.models';
import { CommonModule } from '@angular/common';
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: 'pickems-survivor-underdog-display',
  imports: [CommonModule, MatCardModule],
  templateUrl: './pickems-survivor-underdog-display.component.html',
  styleUrl: './pickems-survivor-underdog-display.component.css'
})
export class PickemsSurvivorUnderdogDisplayComponent {
  @Input('underdogStatus') underdogStatus: UnderdogStatus;
  @Input('record') record: string = "0-0-0";

  public UnderdogEnum = UnderdogStatus;
}
