import { Component, OnInit } from '@angular/core';
import { HelperApiService } from '../_API/helper-api.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { Constants } from '../_Tools/Constants';
import { SimpleSpinnerComponent } from "../simple-spinner/simple-spinner.component";

@Component({
  selector: 'app-pistol-guncop',
  standalone: true,
  templateUrl: './pistol-guncop.component.html',
  styleUrl: './pistol-guncop.component.css',
  imports: [CommonModule, SimpleSpinnerComponent]
})
export class PistolGuncopComponent implements OnInit {

  constructor(private apiHelper: HelperApiService, private sanitizer: DomSanitizer) { }

  videos: string[];
  loading: boolean;

  ngOnInit(): void {
    this.loading = true;
    this.apiHelper.getPistolGuncopVideoList(10).then(videoList => {
      this.videos = videoList;
      this.loading = false;
    });
  }

  public getChannelUrl() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(Constants.PISTOL_GUNCOP_URL);
  }

  public getVideoUrl(videoId) {
    return this.sanitizer.bypassSecurityTrustResourceUrl("https://www.youtube.com/embed/" + videoId);
  }

}
