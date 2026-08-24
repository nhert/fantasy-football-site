import { Component, Input } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { CommonModule } from '@angular/common';

export enum DisplayMode {
  Warning,
  Info,
  SubmissionLock,
  Green,
  Generic
}

@Component({
  selector: 'app-pickems-survivor-warning-info-box',
  imports: [MatIconModule, MatCardModule, CommonModule],
  templateUrl: './pickems-survivor-warning-info-box.component.html',
  styleUrl: './pickems-survivor-warning-info-box.component.css'
})
export class PickemsSurvivorWarningInfoBoxComponent {
  @Input('displayMode') displayMode: DisplayMode = DisplayMode.Warning;
  @Input('shouldDisplay') shouldDisplay: boolean = false;
  @Input('maxWidth') maxWidth: string = "";
  @Input('message') message: string = "";

  get displayModeWarning() {
    return this.displayMode == DisplayMode.Warning;
  }
  get displayModeInfo() {
    return this.displayMode == DisplayMode.Info;
  }
  get displayModeSubmissionLock() {
    return this.displayMode == DisplayMode.SubmissionLock;
  }
  get displayModeGeneric() {
    return this.displayMode == DisplayMode.Generic;
  }
  get displayModeGreen() {
    return this.displayMode == DisplayMode.Green;
  }
}
