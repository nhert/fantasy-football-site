// Generic

export interface GameState {
    season: number,
    week: number,
    server_current_datetime_utc_iso: string,
    current_start_datetime_utc_iso: string,
    current_cutoff_datetime_utc_iso: string,
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

// ....