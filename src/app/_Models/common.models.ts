// Generic

export interface Matchup {
    matchup_id: string,

    manager_1_sleeper_id: string,
    manager_1_real_name: string,
    manager_1_sleeper_name: string,
    manager_1_team_name: string,
    manager_1_avatar_url: string,
    manager_1_starters: any[],
    manager_1_points: number,
    manager_1_fantasy_record: string,

    manager_2_sleeper_id: string,
    manager_2_real_name: string,
    manager_2_sleeper_name: string,
    manager_2_team_name: string,
    manager_2_avatar_url: string,
    manager_2_starters: any[],
    manager_2_points: number,
    manager_2_fantasy_record: string
}

export interface MatchupCache {
    aLeagueRosterMap: Map<number, any>,
    bLeagueRosterMap: Map<number, any>,
    userInfoMap: Map<number, any>
}