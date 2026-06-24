import { Component, Input } from '@angular/core';
import { GameUser } from '../pickems-survivor-lobby/pickems-survivor-lobby.component';

@Component({
  selector: 'game-pickems-content',
  standalone: true,
  imports: [],
  templateUrl: './game-pickems-content.component.html',
  styleUrl: './game-pickems-content.component.css'
})
export class GamePickemsContentComponent {
  @Input('currentUser') currentUser: GameUser;

}
