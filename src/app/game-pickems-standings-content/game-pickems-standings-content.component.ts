import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GameUser } from '../pickems-survivor-lobby/pickems-survivor-lobby.component';

// export interface PeriodicElement {
//   week1: string;
//   week2: string;
//   week3: string;
//   week4: string;
//   week5: string;
//   week6: string;
//   week7: string;
//   week8: string;
//   week9: string;
//   week10: string;
//   week11: string;
//   week12: string;
//   week13: string;
//   week14: string;
// }

// const ELEMENT_DATA: PeriodicElement[] = [
//   { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
//   { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
//   { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
// ];


@Component({
  selector: 'game-pickems-standings-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-pickems-standings-content.component.html',
  styleUrl: './game-pickems-standings-content.component.css'
})
export class GamePickemsStandingsContentComponent {
  @Input('currentUser') currentUser: GameUser;

  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  //dataSource = ELEMENT_DATA;

}
