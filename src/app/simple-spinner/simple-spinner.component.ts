import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'simple-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule, CommonModule],
  templateUrl: './simple-spinner.component.html',
  styleUrl: './simple-spinner.component.css'
})
export class SimpleSpinnerComponent {
  @Input('loading') loading: boolean;
}
