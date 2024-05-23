import { Injectable } from '@angular/core';
import { Constants } from '../_Tools/Constants';

@Injectable({
  providedIn: 'root'
})
export class HelperApiService {

  constructor() { }

  public async getPistolGuncopVideoList(maxResults: number) {
    let url = 'https://www.googleapis.com/youtube/v3/search?key=' + Constants.GOOGLE_YT_API_KEY + '&channelId='
      + Constants.PISTOL_GUNCOP_YT_CHANNEL_ID + '&order=date&part=snippet&type=video&maxResults=' + maxResults

    const response = await fetch(url).then((res) => res.json());

    let videoUrls: string[] = [];
    if (response.items && response.items.length > 0) {
      response.items.forEach(video => {
        videoUrls.push(video.id.videoId);
      });
    }
    return videoUrls;
  }
}
