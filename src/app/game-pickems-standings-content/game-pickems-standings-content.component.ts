import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { GameUser, PickemsScore } from '../_Models/survivor.pickems.models';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule, MatIconButton } from "@angular/material/button";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'game-pickems-standings-content',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatIconButton],
  templateUrl: './game-pickems-standings-content.component.html',
  styleUrl: './game-pickems-standings-content.component.css'
})
export class GamePickemsStandingsContentComponent {
  @Input('currentUser') currentUser: GameUser;
  @Input('dataSource') dataSource: MatTableDataSource<PickemsScore>; // data source for the survivor pool table
  @Output('reloadPickemsScores') reloadPickemsScores = new EventEmitter<void>();

  displayedColumns: string[] = ['username', 'score'];

  // dependencies
  private toastr = inject(ToastrService);

  get scoresAvailable() {
    return this.dataSource && this.dataSource.data && this.dataSource.data.length > 0;
  }

  handleRefresh() {
    this.reloadPickemsScores?.emit();
    this.toastr.info('Pick\'ems scores have been refreshed', '', {
      timeOut: 2000,
      progressBar: false
    });
  }
}
