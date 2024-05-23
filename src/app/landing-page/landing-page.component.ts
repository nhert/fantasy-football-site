import { Component, OnInit, ViewChild } from '@angular/core';
import { NavMenuComponent } from "../nav-menu/nav-menu.component";
import { RouterModule } from '@angular/router';
import { Constants } from '../_Tools/Constants';

@Component({
    selector: 'app-landing-page',
    standalone: true,
    templateUrl: './landing-page.component.html',
    styleUrl: './landing-page.component.css',
    imports: [NavMenuComponent, RouterModule]
})
export class LandingPageComponent {
    public getUrlChampLeague() {
        return "https://sleeper.com/leagues/" + Constants.A_LEAGUE_SLEEPER_ID;
    }

    public getUrlOtherLeague() {
        return "https://sleeper.com/leagues/" + Constants.B_LEAGUE_SLEEPER_ID;
    }
}