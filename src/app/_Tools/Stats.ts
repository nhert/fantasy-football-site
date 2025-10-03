import { Constants } from "./Constants";
import { Utils } from "./Utils";

export class Stats {

    public static MAX_STARTER_SIZE: number = 9;

    private records: any[];

    public titlesALeague: number;
    public titlesBLeague: number;
    public seasonBest: string;
    public seasonWorst: string;
    public totalWins: number;
    public totalLosses: number;
    public totalTies: number;
    public totalPtsFor: number;
    public totalPtsAgainst: number;
    public winPercent: number; // float
    public avgPtsFor: number; // float - avg across years played
    public avgPtsAgainst: number; // float - avg across years played
    public highScore: number;
    public lowScore: number;
    public gamesPlayed: number;
    public yearsPlayed: number;
    public niceWeeks: number;

    // Sleeper era only
    public patheticWeeks: any[];
    public nukeWeeks: any[];
    public protestWeeks: any[];
    public buddyWeeks: any[];

    public constructor(records: any[]) {
        this.records = records;
        this.calculateStats();
    }

    public reset() {
        this.records = [];
    }

    public initialized(): boolean {
        return this.records && this.records.length > 0;
    }

    private calculateStats() {
        if (!this.initialized()) return;

        var allRecords_groupedByYear = this.groupAllRecordsByYear(this.records);


        var avgPtsFor = 0;
        var totalPtsFor = 0, totalPtsAgainst = 0;
        var avgPtsAgainst = 0;
        var recordCount = 0;
        var winPct = 0;
        var totalWins = 0;
        var totalLosses = 0;
        var totalTies = 0;
        var niceScores = 0;

        var highestPtsFor = 0;
        var lowestPtsFor = 10000;

        var patheticScores = [];
        var timesNuked = [];
        var protestWeeks = [];
        var buddyWeeks = [];

        this.records.forEach(record => {
            if (this.isNiceScore(record)) {
                niceScores++;
            }
            if (this.isProtestWeek(record)) {
                protestWeeks.push(this.formatRecordForTableDisplay(record));
            }
            if (this.isBuddyWeek(record)) {
                buddyWeeks.push(this.formatRecordForTableDisplay(record));
            }
            if (this.isNukedWeek(record)) {
                timesNuked.push(this.formatRecordForTableDisplay(record));
            }
            if (this.isPatheticScore(record)) {
                patheticScores.push(this.formatRecordForTableDisplay(record));
            }

            avgPtsFor += parseFloat(record.owner_score);
            avgPtsAgainst += parseFloat(record.opponent_score);

            var scoreConvert = parseFloat(record.owner_score);
            if (scoreConvert > highestPtsFor) {
                highestPtsFor = scoreConvert;
            }
            if (scoreConvert < lowestPtsFor && scoreConvert > 0) {
                lowestPtsFor = scoreConvert;
            }

            if (record.outcome == Constants.OUTCOME_TYPE_WIN) {
                totalWins++;
            } else if (record.outcome == Constants.OUTCOME_TYPE_LOSS) {
                totalLosses++;
            } else if (record.outcome == Constants.OUTCOME_TYPE_TIE) {
                totalTies++;
            }

            recordCount++;
        });

        winPct = totalWins / (totalWins + totalLosses);
        totalPtsFor = avgPtsFor;
        totalPtsAgainst = avgPtsAgainst;
        avgPtsFor /= recordCount;
        avgPtsAgainst /= recordCount;

        var mostWins = 0;
        var mostWinsRecord = null;
        var mostLosses = 0;
        var mostLossesRecord = null;
        var yearsPlayed = 0;
        var titles_a_league = 0;
        var titles_b_league = 0;
        for (var curYear in allRecords_groupedByYear) {
            var curRecords = allRecords_groupedByYear[curYear]; // represents a single year in records.
            var record = this.calculateRecordForYear(curRecords);
            yearsPlayed++;

            if (record.wins > mostWins) {
                mostWins = record.wins;
                mostWinsRecord = record;
            }
            if (record.losses > mostLosses) {
                mostLosses = record.losses;
                mostLossesRecord = record;
            }
            if (record.title_win) {
                if (record.league_type == Constants.A_LEAGUE_NAME) {
                    titles_a_league++;
                } else {
                    titles_b_league++;
                }
            }
        }

        // Set basic stat fields on the Stats class
        this.titlesALeague = titles_a_league;
        this.titlesBLeague = titles_b_league;
        this.seasonBest = mostWinsRecord ? mostWinsRecord.record_string + " (" + mostWinsRecord.year + ")" : "N/A";
        this.seasonWorst = mostLossesRecord ? mostLossesRecord.record_string + " (" + mostLossesRecord.year + ")" : "N/A";
        this.totalPtsFor = totalPtsFor;
        this.totalPtsAgainst = totalPtsAgainst;
        this.avgPtsFor = avgPtsFor;
        this.avgPtsAgainst = avgPtsAgainst;
        this.winPercent = winPct;
        this.gamesPlayed = recordCount;
        this.yearsPlayed = yearsPlayed;
        this.totalWins = totalWins;
        this.totalLosses = totalLosses;
        this.totalTies = totalTies;
        this.highScore = highestPtsFor;
        this.lowScore = lowestPtsFor;

        // Stats with record arrays
        this.niceWeeks = niceScores;
        this.protestWeeks = protestWeeks;
        this.buddyWeeks = buddyWeeks;
        this.nukeWeeks = timesNuked;
        this.patheticWeeks = patheticScores;
    }

    private groupAllRecordsByYear(allRecords) {
        var groupedRecords = {}; //json

        allRecords.forEach(record => {
            var year = record.year;
            if (!groupedRecords[year]) {
                groupedRecords[year] = [];
            }
            groupedRecords[year].push(
                record
            );
        });

        return groupedRecords;
    }

    private calculateRecordForYear(yearRecord) {
        var wins = 0, losses = 0, ties = 0;
        var year = 0;
        var playoffWins = 0, playoffLosses = 0;
        var league_type;

        yearRecord.forEach(week => {
            if (week.game_type == Constants.GAME_TYPE_REGULAR || week.game_type == Constants.GAME_TYPE_NONE) {
                if (week.outcome == Constants.OUTCOME_TYPE_WIN) {
                    wins++;
                } else if (week.outcome == Constants.OUTCOME_TYPE_LOSS) {
                    losses++;
                } else if (week.outcome == Constants.OUTCOME_TYPE_TIE) {
                    ties++;
                }
            } else if (week.game_type == Constants.GAME_TYPE_PLAYOFF) {
                if (week.outcome == Constants.OUTCOME_TYPE_WIN || week.outcome == Constants.OUTCOME_TYPE_BYE_WEEK) {
                    playoffWins++;
                } else if (week.outcome == Constants.OUTCOME_TYPE_LOSS) {
                    playoffLosses++;
                }
                //TODO: playoff stats
            }
            year = week.year;
            league_type = week.league_type;
        });
        var game_count = wins + losses + ties;

        //console.log(yearRecord);


        var record = {
            wins: wins,
            losses: losses,
            ties: ties,
            year: year,
            game_count: game_count,
            record_string: wins + " - " + losses + " - " + ties,
            win_percent: wins / game_count,
            title_win: playoffWins == 3,
            league_type: league_type
        };
        //console.log(record);
        return record;
    }

    public getHeadersForTableDisplay() {
        return ["Result", "Pts For", "Pts Against", "Year", "Week", "Platform", "League"];
    }

    private formatRecordForTableDisplay(record) {
        return {
            "Result": Utils.beautifyForOutcomeColumn(record.outcome),
            "Pts For": record.owner_score,
            "Pts Against": record.opponent_score,
            "Year": record.year,
            "Week": record.week,
            "Platform": record.type,
            "League": record.league_type
        }
    }

    // scored 69 pts
    private isNiceScore(record): boolean {
        var score = parseFloat(record.owner_score);
        return score >= 69 && score < 70
    }

    public getWinLossString(): string {
        return this.totalWins + " - " + this.totalLosses + " - " + this.totalTies;
    }

    //#region Special B3FL Stats

    // Special stats only available for Sleeper era
    private isSleeperEra(record) {
        return record.type == Constants.PLATFORM_SLEEPER;
    }

    // Don't include bye weeks in calculating any special stats
    private isByeWeek(record) {
        return record.outcome == Constants.OUTCOME_TYPE_BYE_WEEK;
    }

    // Don't include games played after playoff elimination -> people just screw around since there are no stakes.
    private isAfterPlayoffElim(record) {
        return record.game_type == Constants.GAME_TYPE_ELIMINATED;
    }

    private isSkipStatCalc(record) {
        return !this.isSleeperEra(record) || this.isByeWeek(record) || this.isAfterPlayoffElim(record);
    }

    // Scored under 50 pts with a full roster
    // 2022 and later only
    private isPatheticScore(record): boolean {
        if (this.isSkipStatCalc(record)) return false;

        var score = parseFloat(record.owner_score);
        var numStarters = parseInt(record.owner_starter_count);
        return score <= 50 && numStarters == Stats.MAX_STARTER_SIZE;
    }

    // Lost by 100 pts or more with a full roster
    // 2022 and later only
    private isNukedWeek(record): boolean {
        if (this.isSkipStatCalc(record)) return false;

        var score = parseFloat(record.owner_score);
        var opscore = parseFloat(record.opponent_score);
        var numStarters = parseInt(record.owner_starter_count);
        return (opscore - score >= 100) && numStarters == Stats.MAX_STARTER_SIZE;
    }

    // Opponent and you both started less than full roster, and same # of players
    // 2022 and later only
    private isBuddyWeek(record): boolean {
        if (this.isSkipStatCalc(record)) return false;

        var numStarters = parseInt(record.owner_starter_count);
        var numStartersOp = parseInt(record.opponent_starter_count);
        return numStarters == numStartersOp && numStarters < Stats.MAX_STARTER_SIZE;
    }

    // Opponent started more players than you (starting an inactive player counts as starting a player)
    // AND: you started less than 5 players (half roster)
    // AND: your opponent started a full roster
    // 2022 and later only
    private isProtestWeek(record): boolean {
        if (this.isSkipStatCalc(record)) return false;

        var owner = parseFloat(record.owner_starter_count);
        var opp = parseFloat(record.opponent_starter_count);
        var halfRosterSize = Stats.MAX_STARTER_SIZE / 2;
        return owner < opp && owner < halfRosterSize && opp == Stats.MAX_STARTER_SIZE;
    }

    //#endregion
}