import aLeagueHistoryJson from '../../assets/data/A_League_History.json'
import bLeagueHistoryJson from '../../assets/data/B_League_History.json'
import nflPlayersJson from '../../assets/nflPlayers/nfl_players.json'

// Class holding constants related to the site
export class Constants {
	// Set to the most current Sleeper League ID. This will update when commish starts a new season.
	static A_LEAGUE_SLEEPER_ID = "968583157932937216";
	static B_LEAGUE_SLEEPER_ID = "992194800943939584";

	static PICKEMS_URL = "https://fantasy-sports-extension.web.app/login";
	static PISTOL_GUNCOP_URL = "https://www.youtube.com/@bfltwo5555";
	static PISTOL_GUNCOP_YT_CHANNEL_ID = "UCqd9SN4AnC9RfJDMwzzVsfQ";
	static JORDAN_SHOW_URL = "https://www.twitch.tv/jordstirling";
	static GOOGLE_YT_API_KEY = "AIzaSyAQDjqde0RmsCRwgckaU0LhTw8SD8C5hS4";

	// Record correction constants for 2021/2022 since papa t shared team with jer
	static A_LEAGUE_SLEEPER_ID_2022_SEASON = "865477710976286720"; // using for user generation atm
	static B_LEAGUE_SLEEPER_ID_2022_SEASON = "866171664994541568"; // record correction for PaPa T in 2022
	static PAPA_T_SLEEPER_ID_RECORD_CORRECTION = "868693802389540864";
	static JER_SLEEPER_ID_RECORD_CORRECTION = "471702444481441792";

	// Generic
	// Display name for leagues
	static A_LEAGUE_NAME = "A League";
	static B_LEAGUE_NAME = "B League";

	static PLATFORM_SLEEPER = "Sleeper";
	static PLATFORM_NFL_LEGACY = "NFL.com";

	// Game type
	static GAME_TYPE_REGULAR = "Regular";
	static GAME_TYPE_PLAYOFF = "Playoff";
	static GAME_TYPE_NONE = "none";
	static GAME_TYPE_ELIMINATED = "PlayoffPostElimination";

	// Outcomes
	static OUTCOME_TYPE_WIN = "win";
	static OUTCOME_TYPE_LOSS = "loss";
	static OUTCOME_TYPE_TIE = "tie";
	static OUTCOME_TYPE_BYE_WEEK = "bye";
	static OUTCOME_TYPE_NO_CONTEST = "noContest";

	// All users across both leagues.
	static USERS = [
		{
			name: "Jer",
			sleeperId_current: "471702444481441792",
			sleeperIds_old: [],
			legacyId: "userId-90093",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Nate",
			sleeperId_current: "867462835893080064",
			sleeperIds_old: [],
			legacyId: "userId-27062481",
			currentLeague: this.B_LEAGUE_NAME
		},
		{
			name: "Caolan",
			sleeperId_current: "867562511770255360",
			sleeperIds_old: [],
			legacyId: "userId-95527",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Dalley",
			sleeperId_current: "867601213447897088",
			sleeperIds_old: [],
			legacyId: "userId-91161",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Rimon",
			sleeperId_current: "869618771407556608",
			sleeperIds_old: [],
			legacyId: "userId-91908",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Omar",
			sleeperId_current: "441653692567908352",
			sleeperIds_old: [],
			legacyId: "userId-5318397",
			currentLeague: this.B_LEAGUE_NAME
		},
		{
			name: "Ricky",
			sleeperId_current: "471826036959473664",
			sleeperIds_old: [],
			legacyId: "userId-27845667",
			currentLeague: this.B_LEAGUE_NAME
		},
		{
			name: "Alex",
			sleeperId_current: "731243643578490880",
			sleeperIds_old: [],
			legacyId: "userId-19416897",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Picco",
			sleeperId_current: "865480383385448448",
			sleeperIds_old: [],
			legacyId: "userId-28536059",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Jordan S.",
			sleeperId_current: "865596427626201088",
			sleeperIds_old: [],
			legacyId: "userId-130280",
			currentLeague: this.B_LEAGUE_NAME
		},
		{
			name: "Eric",
			sleeperId_current: "866400340310917120",
			sleeperIds_old: [],
			legacyId: "userId-144377",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Tom",
			sleeperId_current: "867272838229454848",
			sleeperIds_old: [],
			legacyId: "userId-14712314",
			currentLeague: this.B_LEAGUE_NAME
		},
		{
			name: "Ryan",
			sleeperId_current: "867294931482505216",
			sleeperIds_old: [],
			legacyId: "userId-25196559",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Jordan I.",
			sleeperId_current: "867433255367008256",
			sleeperIds_old: [],
			legacyId: "userId-13060178",
			currentLeague: this.B_LEAGUE_NAME
		},
		{
			name: "Liam",
			sleeperId_current: "867479730138583040",
			sleeperIds_old: [],
			legacyId: "userId-25169661",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Mike",
			sleeperId_current: "867489506998267904",
			sleeperIds_old: [],
			legacyId: "userId-7530198",
			currentLeague: this.B_LEAGUE_NAME
		},
		{
			name: "Zack",
			sleeperId_current: "867531909708840960",
			sleeperIds_old: [],
			legacyId: "userId-5280198",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Scott",
			sleeperId_current: "867587986001403904",
			sleeperIds_old: [],
			legacyId: "userId-5339416",
			currentLeague: this.B_LEAGUE_NAME
		},
		{
			name: "Jake",
			sleeperId_current: "867593986880229376",
			sleeperIds_old: [],
			legacyId: "userId-90171",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Tikl",
			sleeperId_current: "867598805816795136",
			sleeperIds_old: [],
			legacyId: "userId-7830798",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Marty",
			sleeperId_current: "998276027312889856",
			sleeperIds_old: ["867970353417363456"],
			legacyId: "userId-962198",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Ty",
			sleeperId_current: "867598396356259840",
			sleeperIds_old: [],
			legacyId: "userId-14721116",
			currentLeague: this.B_LEAGUE_NAME
		},
		{
			name: "Papa T",
			sleeperId_current: "868693802389540864",
			sleeperIds_old: [],
			legacyId: "userId-90093",
			currentLeague: this.A_LEAGUE_NAME
		},
		{
			name: "Dan",
			sleeperId_current: "868705613276925952",
			sleeperIds_old: [],
			legacyId: "userId-7401235",
			currentLeague: this.B_LEAGUE_NAME
		}
	]

	public static DUMMY_USER = {
		name: "User Not Found",
		sleeperId_current: "-",
		sleeperIds_old: [],
		legacyId: "-",
		currentLeague: "None"
	}

	//#region Helper Methods

	// Given one current sleeper user id, retrieve all historical sleeper ids for this GM
	public static getAllUserSleeperIds(sleeperId) {
		var userReal = this.getUserReal(sleeperId);

		var ids = [];
		ids.push(userReal.sleeperId_current);

		return ids.concat(userReal.sleeperIds_old);
	}

	public static getAllUsersAlphabetical() {
		return this.USERS.sort((a, b) => a.name.localeCompare(b.name));
	}

	public static getUserReal(sleeperId: string) {
		for (let i = 0; i < Constants.USERS.length; i++) {
			if (Constants.USERS[i].sleeperId_current == sleeperId || Constants.USERS[i].sleeperIds_old.includes(sleeperId)) {
				return Constants.USERS[i];
			}
		}
		return this.DUMMY_USER;
	}

	// Loads legacy NFL.com json data for the A League from the bluehost server
	public static getLegacyChampLeagueData() {
		return aLeagueHistoryJson;
	};

	// Loads legacy NFL.com json data for the B League from the bluehost server
	public static getLegacyOtherLeagueData() {
		return bLeagueHistoryJson;
	};

	public static getNflPlayerAvatarUrl(playerId) {
		if (parseInt(playerId)) {
			return "https://sleepercdn.com/content/nfl/players/thumb/" + playerId + ".jpg";
		}
		return "/assets/images/team-logos/" + playerId + ".png";
	}

	public static getNflPlayerData(playerKeyValueObj: any) {
		if (nflPlayersJson[playerKeyValueObj.key]) {
			return {
				player: nflPlayersJson[playerKeyValueObj.key],
				weeksOfService: playerKeyValueObj.value,
				playerAvatarUrl: ("https://sleepercdn.com/content/nfl/players/thumb/" + playerKeyValueObj.key + ".jpg")
			}
		}
		return {
			player: {},
			weeksOfService: 0,
			playerAvatarUrl: ""
		}
	}

	//#endregion

}