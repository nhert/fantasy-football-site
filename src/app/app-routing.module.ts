import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GmListComponent } from './gm-list/gm-list.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { MatchupHistoryComponent } from './matchup-history/matchup-history.component';
import { RecordsComponent } from './records/records.component';
import { ProfilesComponent } from './profiles/profiles.component';
import { ManifestoComponent } from './manifesto/manifesto.component';
import { SurvivalComponent } from './survival/survival.component';
import { PickemsComponent } from './pickems/pickems.component';
import { PistolGuncopComponent } from './pistol-guncop/pistol-guncop.component';
import { JordanShowComponent } from './jordan-show/jordan-show.component';
import { DraftsComponent } from './drafts/drafts.component';
import { DraftVideosComponent } from './draft-videos/draft-videos.component';
import { LiveScoresComponent } from './live-scores/live-scores.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: LandingPageComponent },
  // League Info
  { path: 'manifesto', component: ManifestoComponent },
  { path: 'standings', component: LandingPageComponent },
  { path: 'calendar', component: LandingPageComponent },
  // Owners
  { path: 'gm-list', component: GmListComponent },
  { path: 'profiles', component: ProfilesComponent },
  { path: 'records', component: RecordsComponent },
  { path: 'drafts', component: DraftsComponent },
  // Matchups
  { path: 'live-scores', component: LiveScoresComponent },
  { path: 'matchup-history', component: MatchupHistoryComponent },
  { path: 'upcoming-matchup', component: LandingPageComponent },
  { path: 'playoff-predictor', component: LandingPageComponent },
  { path: 'elimination-line', component: LandingPageComponent },
  { path: 'survival', component: SurvivalComponent },
  { path: 'pickems', component: PickemsComponent },
  // Media
  { path: 'pistol-guncop', component: PistolGuncopComponent },
  { path: 'jordan-show', component: JordanShowComponent },
  { path: 'draft-videos', component: DraftVideosComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
