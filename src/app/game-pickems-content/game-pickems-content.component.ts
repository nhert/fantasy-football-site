import { Component, Input } from '@angular/core';
import { GameUser } from '../_Models/survivor.pickems.models';

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
