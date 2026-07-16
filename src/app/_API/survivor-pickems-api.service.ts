import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Constants } from '../_Tools/Constants';


@Injectable({ providedIn: 'root' })
export class SurvivorPickemsApiService {
    private apiUrl = Constants.PICKEMS_SURVIVOR_IN_LOCAL_TESTING_MODE ? 'http://localhost:5000/api' : '/api';
    private usersApiUrl = this.apiUrl + '/users';
    private survivorApiUrl = this.apiUrl + '/survivor_pool';
    private pickemsApiUrl = this.apiUrl + '/pickems';

    private demoApiUrl = this.apiUrl + "/demo";
    //private pickemsApiUrl = this.apiUrl + '/pickems';

    constructor(private http: HttpClient) { }

    // GENERIC

    getGameServerStatus(): Observable<any> {
        return this.http.get(this.apiUrl + "/status");
    }

    getGameSchedule(): Observable<any> {
        return this.http.get(this.apiUrl + "/schedule");
    }

    getServerTime(): Observable<any> {
        return this.http.get(this.apiUrl + "/time");
    }

    getSurvivorPickemsGameStates(): Observable<any> {
        return this.http.get(this.apiUrl + "/game_states");
    }

    // DEMO ONLY

    demo_PerformWeekEndLogic(): Observable<any> {
        return this.http.get(this.demoApiUrl + "/next_week");
    }

    demo_Reset(): Observable<any> {
        return this.http.get(this.demoApiUrl + "/reset");
    }

    // USERS

    getUserExists(userEmail: string): Observable<any> {
        return this.http.get(this.usersApiUrl + "/exists/" + userEmail);
    }

    getUser(userEmail: string): Observable<any> {
        return this.http.get(this.usersApiUrl + "/get/" + userEmail);
    }

    addUser(userJson) {
        return this.http.post(this.usersApiUrl + "/add", userJson);
    }

    getAllUsers(): Observable<any> {
        return this.http.get(this.usersApiUrl + "/all");
    }

    getExistingUsernames(): Observable<any> {
        return this.http.get(this.usersApiUrl + "/usernames");
    }

    // SURVIVOR

    getAllSurvivorEntries(): Observable<any> {
        return this.http.get(this.survivorApiUrl + "/entries");
    }

    updateSurvivorChoiceForUser(userEmail: string, week: number, userChoice: any) {
        let userChoiceJson = {
            choice_sleeper_id: userChoice.sleeperId_current,
            choice_gm_name: userChoice.name
        }
        return this.http.post(this.survivorApiUrl + "/update/" + userEmail + "/" + week, userChoiceJson);
    }

    // PICKEMS

    getAllPickemsEntriesForWeek(week: number): Observable<any> {
        return this.http.get(this.pickemsApiUrl + "/entries/" + week);
    }

    getPickemsScores(): Observable<any> {
        return this.http.get(this.pickemsApiUrl + "/scores");
    }

    deletePickemsEntryForUser(userEmail: string, week: number, choice_sleeper_id: string) {
        return this.http.get(this.pickemsApiUrl + "/delete/" + userEmail + "/" + week + "/" + choice_sleeper_id);
    }

    makePickemsEntryForUser(userEmail: string, week: number, choice_sleeper_id: string, choice_gm_name: string): Observable<any> {
        let userChoiceJson = {
            choice_sleeper_id: choice_sleeper_id,
            choice_gm_name: choice_gm_name
        }
        return this.http.post(this.pickemsApiUrl + "/make_pick/" + userEmail + "/" + week, userChoiceJson);
    }

    makePickemsEntryWithBonusesForUser(userEmail: string, week: number, choice_sleeper_id: string, choice_gm_name: string, isDouble: boolean, isTriple: boolean): Observable<any> {
        let userChoiceJson = {
            choice_sleeper_id: choice_sleeper_id,
            choice_gm_name: choice_gm_name,
            is_double_down: isDouble,
            is_triple_down: isTriple
        }
        return this.http.post(this.pickemsApiUrl + "/make_bonus_pick/" + userEmail + "/" + week, userChoiceJson);
    }
}


