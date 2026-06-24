import { Injectable } from '@angular/core';
import { Constants } from '../_Tools/Constants';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class SurvivorPickemsApiService {
    // If developing locally, switch this to true.
    // Should be false in production mode.
    //TODO: SET THIS
    static IN_DEV_MODE: boolean = true;

    private apiUrl = SurvivorPickemsApiService.IN_DEV_MODE ? 'http://localhost:5000/api' : '/api';
    private usersApiUrl = this.apiUrl + '/users';
    private survivorApiUrl = this.apiUrl + '/survivor_pool';
    //private pickemsApiUrl = '/api/users';

    constructor(private http: HttpClient) { }

    // GENERIC

    getGameServerStatus(): Observable<any> {
        return this.http.get(this.apiUrl + "/status");
    }

    getGameSchedule(): Observable<any> {
        return this.http.get(this.apiUrl + "/schedule");
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


