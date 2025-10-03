import { Component } from '@angular/core';
import { Constants } from '../_Tools/Constants';

@Component({
  selector: 'app-survival',
  standalone: true,
  imports: [],
  templateUrl: './survival.component.html',
  styleUrl: './survival.component.css'
})
export class SurvivalComponent {
  ngOnInit(): void {
    window.location.href = Constants.PICKEMS_URL;
  }
}
