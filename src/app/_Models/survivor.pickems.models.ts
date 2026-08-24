// Generic

import { PickemsPickStatus } from "../game-pickems-content/game-pickems-content.component";

export interface GameState {
    season: number,
    week: number,
    server_current_datetime_utc_iso: string,
    current_start_datetime_utc_iso: string,
    current_start_local_date_display: Date, // takes the UTC ISO string, and wraps it in a Date object which translates to local users timezone. For display
    current_cutoff_datetime_utc_iso: string,
    current_cutoff_local_date_display: Date, // takes the UTC ISO string, and wraps it in a Date object which translates to local users timezone. For display

    // Game logic fields
    last_processed_week: number,
    survivor_pool_outcome: string,
    survivor_pool_winning_owners: string,
    survivor_pool_winning_week: number
}

export interface GameSchedule {
    week: number,
    start_datetime: string,
    cutoff_datetime: string
}

export interface GameUser {
    picture: string,
    email: string,
    username: string
}

// Survivor pool

export interface SurvivorEntries {
    playerUsername: string;
    playerEmail: string;
    avatarUrl: string;
    winCount: number;
    week1: SurvivorDbRow;
    week2: SurvivorDbRow;
    week3: SurvivorDbRow;
    week4: SurvivorDbRow;
    week5: SurvivorDbRow;
    week6: SurvivorDbRow;
    week7: SurvivorDbRow;
    week8: SurvivorDbRow;
    week9: SurvivorDbRow;
    week10: SurvivorDbRow;
    week11: SurvivorDbRow;
    week12: SurvivorDbRow;
    week13: SurvivorDbRow;
    week14: SurvivorDbRow;
}

// represents a row from the survivor entries table with only essential columns
export interface SurvivorDbRow {
    owner: string,
    week: number,
    choice_sleeper_id: string,
    choice_gm_name: string,
    outcome: string
}

// Pickems

export interface PickemsDbRow {
    owner: string,
    week: number,
    choice_sleeper_id: string,
    choice_gm_name: string,
    outcome: string,
    score: number,
    is_double_down: boolean,
    is_triple_down: boolean,
    is_auto_pick: boolean
}

export enum UnderdogStatus {
    UNDERDOG,
    FAVOURITE,
    EVEN,
    UNKNOWN
}

export interface PickemsMatchup {
    league_type: string,
    allow_pick: boolean,
    pickems_score: number,
    matchup_id: string,

    manager_1_sleeper_id: string,
    manager_1_real_name: string,
    manager_1_sleeper_name: string,
    manager_1_team_name: string,
    manager_1_avatar_url: string,
    manager_1_starters: any[],
    manager_1_points: number,
    manager_1_pick_status: PickemsPickStatus,
    manager_1_underdog_status: UnderdogStatus,
    manager_1_record_at_week: string,

    manager_2_sleeper_id: string,
    manager_2_real_name: string,
    manager_2_sleeper_name: string,
    manager_2_team_name: string,
    manager_2_avatar_url: string,
    manager_2_starters: any[],
    manager_2_points: number,
    manager_2_pick_status: PickemsPickStatus,
    manager_2_underdog_status: UnderdogStatus,
    manager_2_record_at_week: string

    // underdog related fields
}

export interface PickemsMatchupCache {
    aLeagueRosterMap: Map<number, any>,
    bLeagueRosterMap: Map<number, any>,
    userInfoMap: Map<number, any>
}

export interface PickemsScore {
    owner: string,
    avatarUrl: string,
    username: string,
    score: number
}