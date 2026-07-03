import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class SurvivorPickemsApiService {
    //TODO: SET THIS
    static SKIP_AUTH: boolean = true; // skip auth0 login. Also update the router to include authguard 
    static IN_LOCAL_TESTING_MODE: boolean = true; // set to true for production (nginx) mode

    private apiUrl = SurvivorPickemsApiService.IN_LOCAL_TESTING_MODE ? 'http://localhost:5000/api' : '/api';
    private usersApiUrl = this.apiUrl + '/users';
    private survivorApiUrl = this.apiUrl + '/survivor_pool';
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

    // SURVIVOR

    getAllSurvivorEntries(): Observable<any> {
        return this.http.get(this.survivorApiUrl + "/entries");
    }

    getSurvivorChoicesMadeByUser(userEmail: string): Observable<any> {
        return this.http.get(this.survivorApiUrl + "/choices/" + userEmail);
    }

    updateSurvivorChoiceForUser(userEmail: string, week: number, userChoice: any) {
        let userChoiceJson = {
            choice_sleeper_id: userChoice.sleeperId_current,
            choice_gm_name: userChoice.name
        }
        return this.http.post(this.survivorApiUrl + "/update/" + userEmail + "/" + week, userChoiceJson);
    }

}


