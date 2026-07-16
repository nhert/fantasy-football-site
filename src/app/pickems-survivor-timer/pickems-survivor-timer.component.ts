import { Component, computed, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { GameState } from '../_Models/survivor.pickems.models';
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { DisplayMode, PickemsSurvivorWarningInfoBoxComponent } from "../pickems-survivor-warning-info-box/pickems-survivor-warning-info-box.component";

@Component({
  selector: 'pickems-survivor-timer',
  standalone: true,
  imports: [DecimalPipe, CommonModule, MatCardModule, MatIconModule, PickemsSurvivorWarningInfoBoxComponent],
  templateUrl: './pickems-survivor-timer.component.html',
  styleUrl: './pickems-survivor-timer.component.css'
})
export class PickemsSurvivorTimerComponent {
  @Input('gameState') gameState: GameState;
  @Input('currentUserEliminated') currentUserEliminated: boolean = false;
  @Output('disableUiComponents') disableUiComponents = new EventEmitter<void>();

  // Remaining seconds signal for UI
  timeRemaining = signal<number>(0);

  // Computed formatting properties
  days = computed(() => Math.floor(this.timeRemaining() / 86400));
  hours = computed(() => Math.floor((this.timeRemaining() % 86400) / 3600));
  minutes = computed(() => Math.floor((this.timeRemaining() % 3600) / 60));
  seconds = computed(() => Math.floor(this.timeRemaining() % 60));

  private timerSub!: Subscription;
  private lastPerformanceTick!: number;
  isExpired: boolean = false;

  public DisplayModeEnum = DisplayMode;

  public startTimer(timerLengthSeconds: number) {
    this.isExpired = false;
    console.log(`startTimer called with ${timerLengthSeconds} seconds remaining`);

    if (timerLengthSeconds <= 0) {
      this.timeRemaining.set(0);
      this.handleContestEnd();
      console.log(this.isExpired);
      return;
    }
    // Fetch remaining seconds directly calculated by your server.
    // Example: (Target Timestamp - Current Server Timestamp) 
    this.timeRemaining.set(timerLengthSeconds);
    this.initializeInterval();
  }

  private initializeInterval() {
    if (this.timerSub) this.timerSub.unsubscribe();

    // Capture initial hardware high-resolution time reference
    this.lastPerformanceTick = performance.now();

    this.timerSub = interval(1000).subscribe(() => {
      this.tick();
    });
  }

  private tick() {
    const now = performance.now();
    // Measure exactly how many real-world milliseconds passed since last tick
    const elapsedMs = now - this.lastPerformanceTick;
    const elapsedSeconds = Math.round(elapsedMs / 1000);

    if (elapsedSeconds >= 1) {
      //console.log("MADE timing");
      this.lastPerformanceTick = now; // Update anchor time

      this.timeRemaining.update(current => {
        const nextValue = current - elapsedSeconds;
        if (nextValue <= 0) {
          this.handleContestEnd();
          return 0;
        }
        return nextValue;
      });
    }
  }

  private handleContestEnd() {
    if (this.timerSub) this.timerSub.unsubscribe();
    this.isExpired = true;
    this.disableUiComponents.emit();
  }

  protected getCurrentWeek() {
    if (this.gameState) {
      return this.gameState.week;
    }
    return 0;
  }

  protected getCurrentDeadline() {
    if (this.gameState) {
      return this.gameState.current_cutoff_datetime_utc_iso;
    }
    return "";
  }

  get getLockMessage() {
    return `All submissions for week ${this.getCurrentWeek()} are now locked!`
  }

  ngOnDestroy() {
    if (this.timerSub) this.timerSub.unsubscribe();
  }
}
