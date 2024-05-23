import { Component, Input } from '@angular/core';
import { Stats } from '../_Tools/Stats';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'stats-card',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule, CommonModule],
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.css'
})
export class StatsCardComponent {
  @Input('statsSource') statsSource!: Stats;
  @Input('loading') loading: boolean;
  @Input('expanded') expanded: boolean;
  @Input('showAdvancedStats') showAdvancedStats: boolean;

}
