import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Constants } from '../_Tools/Constants';

@Component({
  selector: 'app-jordan-show',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jordan-show.component.html',
  styleUrl: './jordan-show.component.css'
})
export class JordanShowComponent {

  constructor(private sanitizer: DomSanitizer) { }

  public getChannelUrl() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(Constants.JORDAN_SHOW_URL);
  }
}
