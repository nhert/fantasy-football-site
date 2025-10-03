import { Injectable } from '@angular/core';
import { Constants } from '../_Tools/Constants';
import { Utils } from '../_Tools/Utils';
import { Stats } from '../_Tools/Stats';

import { Writable } from 'stream';

@Injectable({ providedIn: 'root' })
export class SleeperApiService {

	//#region REST API 
	// Loads sleeper user data for a single user
	private async getSleeperUserData(sleeperId: string): Promise<any> {
		const response = await fetch(this.getUserRestAPI(sleeperId)).then((res) => res.json());
		return response;
	}
	private getLeagueRestAPI(leagueId: string): string {
		return "https://api.sleeper.app/v1/league/" + leagueId;
	}
	private getLeagueDraftRestAPI(draftId: string): string {
		return "https://api.sleeper.app/v1/draft/" + draftId;
	}
	private getUserRestAPI(userId: string): string {
		return "https://api.sleeper.app/v1/user/" + userId;
	}
	private getNflStateRestAPI(): string {
		return "https://api.sleeper.app/v1/state/nfl";
	}
	private getLeagueUserDataRestAPI(leagueId: string): string {
		return "https://api.sleeper.app/v1/league/" + leagueId + "/users";
	}

	//#endregion
	//#region Public API

	// Get unique list of all users in both sleeper leagues for the GM List page.
	public async getGmList() {

		let jsonData = [];
		for (let i = 0; i < Constants.USERS.length; i++) {
			const userReal = Constants.USERS[i];
			const userData = await this.getSleeperUserData(userReal.sleeperId_current);

			// ['/gm-list']
			var atrURL = "<a href=\"/records?user=" + userReal.sleeperId_current + "\" >Record</a>";
			var profileUrl = "<a href=\"/profiles?user=" + userReal.sleeperId_current + "\" >Profile</a>";

			// Get the values of the current object in the JSON data 
			jsonData.push({
				"": "<img src=\"https://sleepercdn.com/avatars/" + userData.avatar + "\" alt=\"Player Avatar\" width=80px height=80px></img>",
				"Sleeper Name": userData.display_name,
				"Manager": userReal.name,
				"League": Utils.beautifyLeagueField(userReal.currentLeague),
				"All Time Record": atrURL,
				"Stats": profileUrl
			});
		}

		jsonData.sort((a, b) => a.Manager.localeCompare(b.Manager)); // b - a for reverse sort
		return jsonData;
	}

	public async getGmProfile(sleeperId: string) {
		let avatar = await this.getSleeperAvatarUrl(sleeperId);
		let records = await this.getAllTimeRecordData(sleeperId);
		//let players = Constants.

		let nflPlayerCount: Map<string, number> = new Map();
		for (let i = 0; i < records.length; i++) {
			let record = records[i];
			for (let j = 0; j < record.owner_roster.length; j++) {
				let playerId = record.owner_roster[j];
				if (!nflPlayerCount.has(playerId)) {
					nflPlayerCount.set(playerId, 1);
				} else {
					nflPlayerCount.set(playerId, nflPlayerCount.get(playerId) + 1);
				}
			}
		}

		let sortedArray = Array.from(nflPlayerCount).sort((a, b) => b[1] - a[1]);
		let sortedMap = new Map(sortedArray);
		let players = Array.from(sortedMap.keys()).filter(obj => {
			return parseInt(obj)
		})

		let core3 = []
		if (sortedArray.length > 3) {
			core3 = [Constants.getNflPlayerDataForGmProfile({ key: players[0], value: sortedMap.get(players[0]) }),
			Constants.getNflPlayerDataForGmProfile({ key: players[1], value: sortedMap.get(players[1]) }),
			Constants.getNflPlayerDataForGmProfile({ key: players[2], value: sortedMap.get(players[2]) })]
		}

		//console.log(core3);

		return {
			gmAvatar: avatar,
			records: records,
			core3: core3
		}
	}

	// Get unique list of all users in both sleeper leagues.
	// timespan can be "all", "sleeperOnly", "legacyOnly"
	public async getMatchupData(sleeperId1: string, sleeperId2: string) {
		var user1Ids = Constants.getAllUserSleeperIds(sleeperId1);
		var user2Ids = Constants.getAllUserSleeperIds(sleeperId2);

		var legacyRecords = await this.getMatchupsLegacy(sleeperId1, sleeperId2); // array

		var records = [];
		legacyRecords.forEach(record => { records.push(record); });

		// Loop through the user(s) previous sleeper ids to collect old records.
		for (let i = 0; i < user1Ids.length; i++) {
			for (let j = 0; j < user2Ids.length; j++) {
				var sleeperRecords = await this.getMatchupsSleeper(user1Ids[i], user2Ids[j]);
				sleeperRecords.forEach(record => { records.push(record); });
			}
		}

		// Sort by Year/Week
		records.sort(function (a, b) {
			return a.year.localeCompare(b.year) || parseInt(a.week) - parseInt(b.week);
		});

		return records;
	}

	// Get all sleeper league metadata from sleeper league id.
	public async getLeague(leagueId) {
		const response = await fetch(this.getLeagueRestAPI(leagueId))
			.then((res) => res.json());

		let jsonData = [];

		jsonData.push({
			"Season": response.season,
			"Name": response.name
		});

		localStorage

		return jsonData;
	}

	public async getAllRosters() {
		var allLeagueIds = await this.getSleeperLeagueIdsAndAllPreviousLeagueIds();
		var rosters = [];

		for (let i = 0; i < allLeagueIds.length; i++) {
			var league = allLeagueIds[i];
			const response = await fetch(this.getLeagueRestAPI(league.LeagueId) + "/rosters")
				.then((res) => res.json());
			rosters.push(response);
		}

		return rosters;
	}

	public async getSleeperAvatarUrl(sleeperId) {
		const userData = await this.getSleeperUserData(sleeperId);
		return "https://sleepercdn.com/avatars/" + userData.avatar;
	}

	// Get unique list of all users in both sleeper leagues.
	// timespan can be "all", "sleeperOnly", "legacyOnly"
	public async getAllTimeRecordData(sleeperId) {
		var userReal = Constants.getUserReal(sleeperId);

		var legacyRecords = this.getAllTimeRecordsLegacy(sleeperId); // Legacy records will always work as long as userReals can be retrieved
		var sleeperRecords = await this.getAllTimeRecordsSleeper(sleeperId); // If user has old sleeper ids, this needs to be called again.

		var records = [];
		legacyRecords.forEach(record => { records.push(record); });
		sleeperRecords.forEach(record => { records.push(record); });

		// Loop through the users previous sleeper ids to collect old records.
		for (let i = 0; i < userReal.sleeperIds_old.length; i++) {
			var oldRecords = await this.getAllTimeRecordsSleeper(userReal.sleeperIds_old[i]);
			oldRecords.forEach(record => { records.push(record); });
		}

		// Sort by Year/Week
		records.sort(function (a, b) {
			return a.year.localeCompare(b.year) || parseInt(a.week) - parseInt(b.week);
		});

		return records;
	}

	public async getSleeperDrafts(leagueId: string) {
		//console.log("async getSleeperDrafts called with id=" + leagueId);

		// Returns an array of all drafts. Should just need first element, expecting length == 1
		const draftMetaData = await fetch(this.getLeagueRestAPI(leagueId) + "/drafts").then(response => response.json());
		//console.log(draftMetaData);

		let draftData = [];
		let draftPickMap = new Map<string, any[]>();
		let response = {};
		let draftSlots;
		if (draftMetaData && draftMetaData.length > 0) {
			let draftId = draftMetaData[0].draft_id;
			//console.log("found draft id=" + draftId);

			// an array of json objects. each object is a single draft pick.
			// fields available: round, roster_id (league roster id), player_id (nfl player id), picked_by (sleeper id), pick_no, metadata (object with player info), draft_slot (slot on draft board)
			draftSlots = await fetch(this.getLeagueDraftRestAPI(draftId)).then(response => response.json());
			//console.log(draftSlots);
			draftData = await fetch(this.getLeagueDraftRestAPI(draftId) + "/picks").then(response => response.json());
			//console.log(draftData);

			for (let i = 0; i < draftData.length; i++) {
				let draftPick = draftData[i];

				if (!draftPickMap.has(draftPick.picked_by)) {
					let picks: any[] = [];
					picks.push(draftPick);
					draftPickMap.set(draftPick.picked_by, picks);
				} else {
					draftPickMap.get(draftPick.picked_by).push(draftPick);
				}
			}

			//console.log(draftPickMap);

			response = {
				metadata: draftMetaData[0],
				draftOrder: draftSlots.draft_order,
				data: draftPickMap,
				users: Array.from(draftPickMap.keys())
			};
		}

		// console.log("response=");
		// console.log(response);
		return response;
	}

	// List of latest sleeper league and all previous sleeper league ids.
	public async getSleeperLeagueIdsAndAllPreviousLeagueIds() {
		var allSleeperLeagueIds = [];

		var prevLeagueId = Constants.A_LEAGUE_SLEEPER_ID;
		var e = 0;
		while (prevLeagueId != null && e < 100) {
			let league = await fetch(this.getLeagueRestAPI(prevLeagueId)).then((res) => res.json());
			allSleeperLeagueIds.push({
				LeagueId: prevLeagueId,
				LeagueType: Constants.A_LEAGUE_NAME,
				Year: league.season
			});
			prevLeagueId = league.previous_league_id;
			e++;
		}

		prevLeagueId = Constants.B_LEAGUE_SLEEPER_ID;
		e = 0;
		while (prevLeagueId != null && e < 100) {
			let league = await fetch(this.getLeagueRestAPI(prevLeagueId)).then((res) => res.json());
			allSleeperLeagueIds.push({
				LeagueId: prevLeagueId,
				LeagueType: Constants.B_LEAGUE_NAME,
				Year: league.season
			});
			prevLeagueId = league.previous_league_id;
			e++;
		}

		return allSleeperLeagueIds;
	}

	public async getLiveScores(cacheData) {
		const nflState = await fetch(this.getNflStateRestAPI()).then((res) => res.json());
		//console.log(nflState);
		var currentNflWeek = nflState.week;

		var aLeagueMatchups = [];
		var bLeagueMatchups = [];
		var aLeagueRosterMap = new Map<number, any>(); // rosterId -> sleeperUserId
		var bLeagueRosterMap = new Map<number, any>();
		var userInfoMap = new Map<number, any>(); // sleeperUserId -> user data

		const aLeagueMatchupData = await fetch(this.getLeagueRestAPI(Constants.A_LEAGUE_SLEEPER_ID) + "/matchups/" + currentNflWeek).then((res) => res.json());
		const bLeagueMatchupData = await fetch(this.getLeagueRestAPI(Constants.B_LEAGUE_SLEEPER_ID) + "/matchups/" + currentNflWeek).then((res) => res.json());
		var numALeagueMatchups = Math.floor(aLeagueMatchupData.length / 2);
		var numBLeagueMatchups = Math.floor(bLeagueMatchupData.length / 2);

		if (cacheData) {
			console.log("getLiveScores() Refreshing with cached data");
			aLeagueRosterMap = cacheData.aLeagueRosterMap;
			bLeagueRosterMap = cacheData.bLeagueRosterMap;
			userInfoMap = cacheData.userInfoMap;
		} else {
			console.log("getLiveScores() Loading fresh data from SleeperAPI");
			const aLeagueRosterData = await this.getSleeperRosterRecords(Constants.A_LEAGUE_SLEEPER_ID);
			const bLeagueRosterData = await this.getSleeperRosterRecords(Constants.B_LEAGUE_SLEEPER_ID);
			const aLeagueUserData = await fetch(this.getLeagueUserDataRestAPI(Constants.A_LEAGUE_SLEEPER_ID)).then((res) => res.json());
			const bLeagueUserData = await fetch(this.getLeagueUserDataRestAPI(Constants.B_LEAGUE_SLEEPER_ID)).then((res) => res.json());
			for (var roster of aLeagueRosterData) {
				var userId = roster.owner_id;
				var userMetadata = aLeagueUserData.find(obj => obj.user_id == userId).metadata;
				aLeagueRosterMap.set(roster.roster_id, { userId: userId, teamName: userMetadata.team_name, teamAvatar: userMetadata.avatar });
			}
			for (var roster of bLeagueRosterData) {
				var userId = roster.owner_id;
				var userMetadata = bLeagueUserData.find(obj => obj.user_id == userId).metadata;
				bLeagueRosterMap.set(roster.roster_id, { userId: userId, teamName: userMetadata.team_name, teamAvatar: userMetadata.avatar });
			}
			for (let i = 0; i < Constants.USERS.length; i++) {
				const userReal = Constants.USERS[i];
				const userData = await this.getSleeperUserData(userReal.sleeperId_current);
				// Get the values of the current object in the JSON data 
				userInfoMap.set(userData.user_id,
					{
						avatar: "https://sleepercdn.com/avatars/" + userData.avatar,
						sleeperName: userData.display_name,
						managerName: userReal.name,
					}
				);
			}
		}

		//console.log(aLeagueMatchupData);
		//console.log(aLeagueRosterMap);
		//console.log(userInfoMap);
		//console.log(bLeagueMatchupData);

		for (let matchupId = 1; matchupId <= numALeagueMatchups; matchupId++) {
			//console.log("looking for matchup=" + matchupId);
			var playersInMatchup = [];
			for (var matchupData of aLeagueMatchupData) {
				if (matchupData.matchup_id == matchupId) {
					var userRoster = aLeagueRosterMap.get(matchupData.roster_id);
					var userId = userRoster.userId;
					var user = userInfoMap.get(userId);
					var teamName = userRoster.teamName;
					var teamAvatarUrl = userRoster.teamAvatar;
					if (!teamName) {
						teamName = "Team " + user.sleeperName;
					}
					var startingPlayersData = [];
					for (var player in matchupData.starters) {
						var playerId = matchupData.starters[player];
						startingPlayersData.push(Constants.getNflPlayerDataLiveScores(playerId, matchupData.starters_points[player]));
					}

					playersInMatchup.push({
						points: matchupData.points,
						rosterId: matchupData.roster_id,
						userId: userId,
						avatarUrl: teamAvatarUrl ? teamAvatarUrl : user.avatar,
						sleeperName: user.sleeperName,
						managerName: user.managerName,
						teamName: teamName,
						startingPlayers: startingPlayersData
					});
				}
			}
			aLeagueMatchups.push(playersInMatchup);
		}
		for (let matchupId = 1; matchupId <= numBLeagueMatchups; matchupId++) {
			//console.log("looking for matchup=" + matchupId);
			var playersInMatchup = [];
			for (var matchupData of bLeagueMatchupData) {
				if (matchupData.matchup_id == matchupId) {
					var userRoster = bLeagueRosterMap.get(matchupData.roster_id);
					var userId = userRoster.userId;
					var user = userInfoMap.get(userId);
					var teamName = userRoster.teamName;
					var teamAvatarUrl = userRoster.teamAvatar;
					if (!teamName) {
						teamName = "Team " + user.sleeperName;
					}
					var startingPlayersData = [];
					for (var player in matchupData.starters) {
						var playerId = matchupData.starters[player];
						startingPlayersData.push(Constants.getNflPlayerDataLiveScores(playerId, matchupData.starters_points[player]));
					}

					playersInMatchup.push({
						points: matchupData.points,
						rosterId: matchupData.roster_id,
						userId: userId,
						avatarUrl: teamAvatarUrl ? teamAvatarUrl : user.avatar,
						sleeperName: user.sleeperName,
						managerName: user.managerName,
						teamName: teamName,
						startingPlayers: startingPlayersData
					});
				}
			}
			bLeagueMatchups.push(playersInMatchup);
		}

		//console.log(aLeagueMatchups);
		//console.log(bLeagueMatchups);

		return {
			aLeague: aLeagueMatchups,
			bLeague: bLeagueMatchups,
			nflData: {
				year: nflState.league_season,
				week: currentNflWeek
			},
			cache: {
				aLeagueRosterMap: aLeagueRosterMap,
				bLeagueRosterMap: bLeagueRosterMap,
				userInfoMap: userInfoMap
			}
		}
	}

	//#endregion
	//#region Private API Methods

	// SLEEPER Records.
	private async getMatchupsSleeper(sleeperId1: string, sleeperId2: string) {
		// Will return most current league IDs and all previous years from sleeper.
		var allLeagues = await this.getSleeperLeagueIdsAndAllPreviousLeagueIds();

		var records = [];

		const nflState = await fetch(this.getNflStateRestAPI()).then((res) => res.json());
		var currentNflWeek = nflState.week;

		for (var curLeague of allLeagues) {
			var leagueId = curLeague.LeagueId;

			const leagueRosterData = await this.getSleeperRosterRecords(leagueId);
			const leagueData = await fetch(this.getLeagueRestAPI(leagueId))
				.then((res) => res.json());

			var temporarySleeperID1 = sleeperId1;
			var temporarySleeperID2 = sleeperId2;

			// If PaPa t is in the dropdown and its the 2022 B league season
			if (leagueId == Constants.B_LEAGUE_SLEEPER_ID_2022_SEASON) {
				//use jers sleeperid for records.
				if (sleeperId1 == Constants.PAPA_T_SLEEPER_ID_RECORD_CORRECTION) {
					temporarySleeperID1 = Constants.JER_SLEEPER_ID_RECORD_CORRECTION;
				} else if (sleeperId2 == Constants.PAPA_T_SLEEPER_ID_RECORD_CORRECTION) {
					temporarySleeperID2 = Constants.JER_SLEEPER_ID_RECORD_CORRECTION;
				}

				if (sleeperId1 == Constants.JER_SLEEPER_ID_RECORD_CORRECTION) {
					temporarySleeperID1 = "";
				} else if (sleeperId2 == Constants.JER_SLEEPER_ID_RECORD_CORRECTION) {
					temporarySleeperID2 = "";
				}
			}

			var roster1Id = -1, roster2Id = -1;
			leagueRosterData.forEach(roster => {
				if (roster.owner_id == temporarySleeperID1) {
					roster1Id = roster.roster_id;
				}
				if (roster.owner_id == temporarySleeperID2) {
					roster2Id = roster.roster_id;
				}
			});

			// If we are currently on the elapsed Sleeper season (this year), only load weeks up to the current NFL week.
			// I.e., do not load weeks that have not happened yet
			var weekMax = 17;
			if (leagueId == Constants.A_LEAGUE_SLEEPER_ID || leagueId == Constants.B_LEAGUE_SLEEPER_ID) {
				weekMax = currentNflWeek - 1;
			}

			//console.log("Jake " + roster1Id + " rimon " + roster2Id);
			if (roster1Id != -1 && roster2Id != -1) {
				for (let week = 1; week <= weekMax; week++) {
					const matchups = await fetch(this.getLeagueRestAPI(leagueId) + "/matchups/" + week).then((res) => res.json());

					var user1score = -1, user2score = -1, outcome = "", year = "", matchupId1 = -1, matchupId2 = -2
					matchups.forEach(matchup => {
						if (matchup.roster_id == roster1Id) {
							user1score = parseFloat(matchup.points);
							matchupId1 = matchup.matchup_id;
						}
						if (matchup.roster_id == roster2Id) {
							user2score = parseFloat(matchup.points);
							matchupId2 = matchup.matchup_id;
						}
					});
					//console.log("week " + week + " Jake " + matchupId1 + " rimon " + matchupId2);

					// Only record result if they matched eachother that week.
					if (matchupId1 == matchupId2 && !(user1score < 0 && user2score < 0)) {
						outcome = Utils.outcomeLabelFromScore(user1score, user2score);
						year = leagueData.season;
						var game_type = Utils.getGameTypeSimple(year, week);

						records.push({
							owner_score: "" + user1score,
							opponent_score: "" + user2score,
							outcome: "" + outcome,
							week: "" + week, // convert to str
							year: "" + year,
							type: Constants.PLATFORM_SLEEPER,
							game_type: game_type,
							league_type: curLeague.LeagueType
						});
					}
				}

			}
		}

		return records;
	}

	// NFL.COM Records.
	private async getMatchupsLegacy(sleeperId1: string, sleeperId2: string) {
		var legacyId1 = Constants.getUserReal(sleeperId1).legacyId;
		var legacyId2 = Constants.getUserReal(sleeperId2).legacyId;

		const aLeagueLegacy = Constants.getLegacyChampLeagueData(); // JSON
		const bLeagueLegacy = Constants.getLegacyOtherLeagueData(); // JSON

		var seasonsA = aLeagueLegacy["seasons"];
		var bLeagueSeason = bLeagueLegacy["seasons"]["2021"];

		var records = [];

		var isPaPaT_Rule = sleeperId1 == Constants.PAPA_T_SLEEPER_ID_RECORD_CORRECTION || sleeperId2 == Constants.PAPA_T_SLEEPER_ID_RECORD_CORRECTION; // only existed in B league
		var isJer_Rule = sleeperId1 == Constants.JER_SLEEPER_ID_RECORD_CORRECTION || sleeperId2 == Constants.JER_SLEEPER_ID_RECORD_CORRECTION; // Only existed in A league
		if (isPaPaT_Rule && isJer_Rule) return records;

		for (var year in seasonsA) {
			var season = seasonsA[year];
			var teams = season.teams;
			var user1Id = -1, user2Id = -1;

			// find the teamIds for this season (int)
			for (var teamId in teams) {
				if (teams[teamId].owner == legacyId1) {
					user1Id = teamId as unknown as number; //TODO: might need fix
				}
				if (teams[teamId].owner == legacyId2) {
					user2Id = teamId as unknown as number; //TODO: might need fix
				}
			}

			if (user1Id != -1 && user2Id != -1) {
				var user1games = teams[user1Id].games;

				for (var gameId in user1games) {
					if (user1games[gameId].opponent_id == user2Id) {
						// Add record against this user.
						var week = user1games[gameId].week;
						var score = parseFloat(user1games[gameId].score);
						var opScore = parseFloat(user1games[gameId].opponent_score);
						var outcome = Utils.outcomeLabelFromScore(score, opScore);
						var game_type = Utils.getGameTypeSimple(year, week);

						if (!isPaPaT_Rule && !(score < 0 && opScore < 0)) {
							records.push({
								owner_score: "" + score,
								opponent_score: "" + opScore,
								outcome: "" + outcome,
								week: "" + week,
								year: "" + year,
								type: Constants.PLATFORM_NFL_LEGACY,
								game_type: game_type,
								league_type: Constants.A_LEAGUE_NAME
							});
						}
					}
				}
			}
		}

		// B League data
		var season = bLeagueSeason;
		var teams = season.teams;
		var user1Id = -1, user2Id = -1;

		// find the teamIds for this season (int)
		for (var teamId in teams) {
			if (teams[teamId].owner == legacyId1) {
				user1Id = teamId as unknown as number; //TODO: might need fix
			}
			if (teams[teamId].owner == legacyId2) {
				user2Id = teamId as unknown as number; //TODO: might need fix
			}
		}

		if (user1Id != -1 && user2Id != -1) {
			var user1games = teams[user1Id].games;

			for (var gameId in user1games) {
				if (user1games[gameId].opponent_id == user2Id) {
					// Add record against this user.
					var week = user1games[gameId].week;
					var score = parseFloat(user1games[gameId].score);
					var opScore = parseFloat(user1games[gameId].opponent_score);
					var outcome = Utils.outcomeLabelFromScore(score, opScore);
					var game_type = Utils.getGameTypeSimple(2021, week);

					if (!isJer_Rule && !(score < 0 && opScore < 0)) {
						records.push({
							owner_score: "" + score,
							opponent_score: "" + opScore,
							outcome: "" + outcome,
							week: "" + week,
							year: "2021",
							type: Constants.PLATFORM_NFL_LEGACY,
							game_type: game_type,
							league_type: Constants.B_LEAGUE_NAME
						});
					}
				}
			}
		}

		return records;
	}

	// SLEEPER Records.
	private async getAllTimeRecordsSleeper(sleeperId) {
		var allLeagues = await this.getSleeperLeagueIdsAndAllPreviousLeagueIds();

		var records = [];

		var isPaPaT_Rule = sleeperId == Constants.PAPA_T_SLEEPER_ID_RECORD_CORRECTION; // If you played him in legacy, pull using jers NFL ID
		var isJer_Rule = sleeperId == Constants.JER_SLEEPER_ID_RECORD_CORRECTION;

		const nflState = await fetch(this.getNflStateRestAPI()).then((res) => res.json());
		var currentNflWeek = nflState.week;
		/*
			example object
			{
				"week": 5,
				"leg": 5,
				"season": "2025",
				"season_type": "regular",
				"league_season": "2025",
				"previous_season": "2024",
				"season_start_date": "2025-09-04",
				"display_week": 5,
				"league_create_season": "2025",
				"season_has_scores": true
			}
		*/

		// If you played Jers ID in sleeper in B League 2022 - you actually played Papa T. If in , search using jers sleeperId since his account controlled the team
		for (var curLeague of allLeagues) {
			var leagueId = curLeague.LeagueId;

			const leagueRosterData = await this.getSleeperRosterRecords(leagueId);
			const leagueData = await fetch(this.getLeagueRestAPI(leagueId))
				.then((res) => res.json());
			const playoffData = await fetch(this.getLeagueRestAPI(leagueId) + "/winners_bracket")
				.then((res) => res.json());

			var winningRosters = [];
			playoffData.forEach(round => {
				if (winningRosters.indexOf(round.w) === -1) {
					winningRosters.push(round.w);
				}
				if (winningRosters.indexOf(round.l) === -1) {
					winningRosters.push(round.l);
				}
			});

			var temporarySleeperID = sleeperId;

			// If its the 2022 B league season
			if (leagueId == Constants.B_LEAGUE_SLEEPER_ID_2022_SEASON) {
				//use jers sleeperid for records.
				if (isPaPaT_Rule) {
					temporarySleeperID = Constants.JER_SLEEPER_ID_RECORD_CORRECTION;
				}
				if (isJer_Rule) {
					temporarySleeperID = "";
				}
			}

			var rosterId = -1
			leagueRosterData.forEach(roster => {
				if (roster.owner_id == temporarySleeperID) {
					rosterId = roster.roster_id;
				}
			});

			// If we are currently on the elapsed Sleeper season (this year), only load weeks up to the current NFL week.
			// I.e., do not load weeks that have not happened yet
			var weekMax = 17;
			if (leagueId == Constants.A_LEAGUE_SLEEPER_ID || leagueId == Constants.B_LEAGUE_SLEEPER_ID) {
				weekMax = currentNflWeek - 1;
			}

			//console.log("Found player roster ID %s for League %s", rosterId, leagueId);

			var lastPlayoffResult = "";
			var isPlayoffsPostElim = false;

			if (rosterId != -1) {
				for (let week = 1; week <= weekMax; week++) {
					const matchups = await fetch(this.getLeagueRestAPI(leagueId) + "/matchups/" + week).then((res) => res.json());

					//console.log(matchups);

					var user1score = -1, user2score = -1, outcome = "", year = "", matchupId1 = -1
					var user1starters = [], user1roster = [], user2starters = [], user2roster = [];
					var user1starter_count = 0, user2starter_count = 0;
					var isByeWeek = false;

					matchups.forEach(matchup => {
						if (matchup.roster_id == rosterId) {
							user1score = parseFloat(matchup.points);
							matchupId1 = matchup.matchup_id;
							user1starters = matchup.starters;
							user1roster = matchup.players;
							user1starters.forEach((starterId) => {
								if (starterId != "0")
									user1starter_count++;
							});
						}
					});

					// Note: 	matchup.matchup_id can be null in some cases. 
					// 			Specifically, if someone is on a bye week and has no opponent, their matchupId will be null.
					if (!matchupId1) {
						//console.log("Bye week detected: %s week %s", leagueData.season, week);
						isByeWeek = true;
						user2score = 0;
						user2starters = [];
						user2roster = [];
						user2starter_count = Stats.MAX_STARTER_SIZE;
					} else {
						matchups.forEach(matchup => {
							if (matchup.matchup_id == matchupId1 && matchup.roster_id != rosterId) {
								user2score = parseFloat(matchup.points);
								user2starters = matchup.starters;
								user2roster = matchup.players;
								user2starters.forEach((starterId) => {
									if (starterId != "0")
										user2starter_count++;
								});

							}
						});
					}

					// Only record result if they matched eachother that week.
					if (!(user1score < 0 && user2score < 0)) {
						outcome = Utils.outcomeLabelFromScore(user1score, user2score, isByeWeek);
						year = leagueData.season;

						var madeWinnersBracket = winningRosters.indexOf(rosterId) != -1; // Is our roster id in winners bracket
						var gametype = Utils.getGameType(year, week, lastPlayoffResult, isPlayoffsPostElim, madeWinnersBracket);
						if (gametype == Constants.GAME_TYPE_ELIMINATED) isPlayoffsPostElim = true;
						lastPlayoffResult = outcome;

						records.push({
							owner_score: "" + user1score,
							opponent_score: "" + user2score,
							outcome: "" + outcome,
							week: "" + week, // convert to str
							year: "" + year,
							type: Constants.PLATFORM_SLEEPER,
							// Regular, Playoff, PlayoffPostElimination
							game_type: gametype,
							league_type: curLeague.LeagueType,
							owner_starters: user1starters,
							owner_roster: user1roster,
							owner_starter_count: user1starter_count,
							opponent_starters: user2starters,
							opponent_roster: user2roster,
							opponent_starter_count: user2starter_count,
						});
					}
				}
			}
		}

		return records;
	}

	private getAllTimeRecordsLegacy(sleeperId) {
		var legacyId = Constants.getUserReal(sleeperId).legacyId;

		const aLeagueLegacy = Constants.getLegacyChampLeagueData(); // JSON
		const bLeagueLegacy = Constants.getLegacyOtherLeagueData(); // JSON

		var seasonsA = aLeagueLegacy["seasons"];
		var bLeagueSeason = bLeagueLegacy["seasons"]["2021"];

		var records = [];

		var isPaPaT_Rule = sleeperId == Constants.PAPA_T_SLEEPER_ID_RECORD_CORRECTION; // only existed in B league
		var isJer_Rule = sleeperId == Constants.JER_SLEEPER_ID_RECORD_CORRECTION; // Only existed in A league

		// First, go through A league legacy records
		for (var year in seasonsA) {
			var season = seasonsA[year];
			var teams = season.teams;
			var user1Id = -1;

			// find the teamIds for this season (int)
			for (var teamId in teams) {
				if (teams[teamId].owner == legacyId) {
					user1Id = teamId as unknown as number;
				}
			}

			if (user1Id != -1) {
				var user1games = teams[user1Id].games;
				var rankString = teams[user1Id].rank.split("\n")[1]; // bit hacky
				rankString = rankString.replace("(", "");
				rankString = rankString.replace(")", "");
				var finishingRank = parseInt(rankString); // Ranks appear like "1\n(4)"
				var madeWinnersBracket = finishingRank <= 8;

				//console.log(year + " " + rankString + " " + finishingRank+ " " + madeWinnersBracket);

				var lastPlayoffResult = "";
				var isPlayoffsPostElim = false;

				for (var gameId in user1games) {
					// Add record against this user.
					var score = parseFloat(user1games[gameId].score);
					var opScore = parseFloat(user1games[gameId].opponent_score);
					var outcome = Utils.outcomeLabelFromScore(score, opScore);

					var gametype = Utils.getGameType(year, user1games[gameId].week, lastPlayoffResult, isPlayoffsPostElim, madeWinnersBracket);
					if (gametype == Constants.GAME_TYPE_ELIMINATED) isPlayoffsPostElim = true;
					lastPlayoffResult = outcome;

					if (!isPaPaT_Rule && !(score < 0 && opScore < 0)) {
						records.push({
							owner_score: "" + score,
							opponent_score: "" + opScore,
							outcome: "" + outcome,
							week: "" + user1games[gameId].week,
							year: "" + year,
							type: Constants.PLATFORM_NFL_LEGACY,
							game_type: gametype,
							league_type: Constants.A_LEAGUE_NAME,
							owner_starters: [],
							owner_roster: [],
							owner_starter_count: Stats.MAX_STARTER_SIZE,
							opponent_starters: [],
							opponent_roster: [],
							opponent_starter_count: Stats.MAX_STARTER_SIZE,
						});
					}

				}
			}
		}

		// B League data
		var season = bLeagueSeason;
		var teams = season.teams;
		var user1Id = -1;

		// find the teamIds for this season (int)
		for (var teamId in teams) {
			if (teams[teamId].owner == legacyId) {
				user1Id = teamId as unknown as number;
			}
		}

		if (user1Id != -1) {
			var user1games = teams[user1Id].games;
			var rankString = teams[user1Id].rank.split("\n")[1]; // bit hacky
			rankString = rankString.replace("(", "");
			rankString = rankString.replace(")", "");
			var finishingRank = parseInt(rankString); // Ranks appear like "1\n(4)"
			var madeWinnersBracket = finishingRank <= 8;

			//console.log(year + " " + rankString + " " + finishingRank+ " " + madeWinnersBracket);

			var lastPlayoffResult = "";
			var isPlayoffsPostElim = false;

			for (var gameId in user1games) {
				// Add record against this user.
				var score = parseFloat(user1games[gameId].score);
				var opScore = parseFloat(user1games[gameId].opponent_score);
				var outcome = Utils.outcomeLabelFromScore(score, opScore);

				var gametype = Utils.getGameType("2021", user1games[gameId].week, lastPlayoffResult, isPlayoffsPostElim, madeWinnersBracket);
				if (gametype == Constants.GAME_TYPE_ELIMINATED) isPlayoffsPostElim = true;
				lastPlayoffResult = outcome;

				if (!isJer_Rule && !(score < 0 && opScore < 0)) {
					records.push({
						owner_score: "" + score,
						opponent_score: "" + opScore,
						outcome: "" + outcome,
						week: "" + user1games[gameId].week,
						year: "2021",
						type: Constants.PLATFORM_NFL_LEGACY,
						game_type: gametype,
						league_type: Constants.B_LEAGUE_NAME,
						owner_starters: [],
						owner_roster: [],
						owner_starter_count: Stats.MAX_STARTER_SIZE,
						opponent_starters: [],
						opponent_roster: [],
						opponent_starter_count: Stats.MAX_STARTER_SIZE,
					});
				}

			}
		}

		return records;
	}

	// Records need a small correction.
	// In 2023, Jer reassigned some of the roster owners in B league by mistake (transferring GMs for promotion/demotion to the season that just happened)
	private async getSleeperRosterRecords(leagueId) {
		const leagueRosterData = await fetch(this.getLeagueRestAPI(leagueId) + "/rosters")
			.then((res) => res.json());

		/*
		JStir used commissioner powers to remove Stirling97 731243643578490880 from Team 2 
		JStir used commissioner powers to remove PistolPicco 865480383385448448 from Team 3
		JStir used commissioner powers to remove str8bred 867294931482505216 from Team 5
		JStir used commissioner powers to remove lmolo4 867479730138583040 from Team 7
		JStir used commissioner powers to assign natehertz to Team 7
		JStir used commissioner powers to assign michaelbell04 to Team 2
		*/
		if (leagueId == Constants.B_LEAGUE_SLEEPER_ID_2023_SEASON) { // Perform roster owner corrections.
			leagueRosterData[1].owner_id = Constants.ALEX_SLEEPER_ID_RECORD_CORRECTION_2023;
			leagueRosterData[2].owner_id = Constants.PICCO_SLEEPER_ID_RECORD_CORRECTION_2023;
			leagueRosterData[4].owner_id = Constants.RYAN_SLEEPER_ID_RECORD_CORRECTION_2023;
			leagueRosterData[6].owner_id = Constants.LIAM_SLEEPER_ID_RECORD_CORRECTION_2023;
		}

		return leagueRosterData;
	}

	//#endregion
}


