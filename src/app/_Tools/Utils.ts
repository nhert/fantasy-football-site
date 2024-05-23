import { Constants } from "./Constants";

export class Utils {
	// Generate a CSV from generic JSON data, with filename
	public static generateCsvFile(jsonData: any, fileNameNoExtension: string) {
		if (!jsonData[0]) return;
		if (!fileNameNoExtension) fileNameNoExtension = "B3FL-Download";

		let csvContent = "data:text/csv;charset=utf-8,";
		let cols = Object.keys(jsonData[0]);
		let csvHeaders = cols.join(",");
		csvContent += csvHeaders + "\r\n";

		jsonData.forEach((item) => {
			let vals = Object.values(item);
			let row = vals.join(",");
			csvContent += row + "\r\n";
		});

		var encodedUri = encodeURI(csvContent);

		var link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", fileNameNoExtension + ".csv");
		document.body.appendChild(link); // Required for FF
		link.click();
		link.remove();
	}

	// Take a league name, and returned a styled <span> if its A League
	public static beautifyLeagueField(league) {
		return league == Constants.A_LEAGUE_NAME ?
			"<span class=\"gold-text bold-text\"><b>" + league + "</b></span>" :
			"<span>" + league + "</span>";
	}

	// Takes two scores, then returns a label saying "Win", "Loss", "Tie"
	public static outcomeLabelFromScore(score: number, opponentScore: number, isBye?: boolean) {
		if (isBye) {
			return Constants.OUTCOME_TYPE_BYE_WEEK;
		}
		if (score == 0 && opponentScore == 0) {
			return Constants.OUTCOME_TYPE_NO_CONTEST;
		}
		if (score == opponentScore) {
			return Constants.OUTCOME_TYPE_TIE;
		}
		return score > opponentScore ? Constants.OUTCOME_TYPE_WIN : Constants.OUTCOME_TYPE_LOSS;
	}

	// Accepts value like "win", "loss" and returns a styled span
	public static beautifyForOutcomeColumn(outcome) {
		if (outcome == Constants.OUTCOME_TYPE_WIN) {
			return "<span class=\"green-text bold-text\">WIN</span>";
		} else if (outcome == Constants.OUTCOME_TYPE_LOSS) {
			return "<span class=\"red-text bold-text\">LOSS</span>";
		} else if (outcome == Constants.OUTCOME_TYPE_TIE) {
			return "<span class=\"orange-text bold-text\">TIE</span>";
		} else if (outcome == Constants.OUTCOME_TYPE_NO_CONTEST) {
			return "<span class=\"grey-text bold-text\">NO CONTEST</span>";
		} else if (outcome == Constants.OUTCOME_TYPE_BYE_WEEK) {
			return "<span class=\"grey-text bold-text\">BYE WEEK</span>";
		}
		return "";
	}

	public static beautifyForGameTypeColumn(type) {
		if (type == "Regular") return "<span class=\"grey-text bold-text\"><b>Regular Season</b></span>";
		if (type == "Playoff") return "<span class=\"dark-orange-text bold-text\"><b>Playoff Game</b></span>";
		if (type == "PlayoffPostElimination") return "<span class=\"red-text bold-text\"><b>After Elimination</b></span>";
		return "";
	}

	public static getGameType(year, week, lastWeeksOutcome, isPostElim, madeWinnersBracket) {
		var y = parseInt(year);
		var w = parseInt(week);

		if (isPostElim) return Constants.GAME_TYPE_ELIMINATED;

		//console.log(year + " " + week + " " + lastWeeksOutcome + " " + isPostElim);

		// Spaghetti monster...
		if (y >= 2021) { // Playoffs are weeks 15-17
			if (w >= 15) { // is playoffs
				if (!madeWinnersBracket) return Constants.GAME_TYPE_ELIMINATED;

				if (w >= 16 && (lastWeeksOutcome == Constants.OUTCOME_TYPE_LOSS)) {
					return Constants.GAME_TYPE_ELIMINATED;
				}
				return Constants.GAME_TYPE_PLAYOFF
			}
		} else { // Playoffs are weeks 14-16
			if (w >= 14) { // is playoffs
				if (!madeWinnersBracket) return Constants.GAME_TYPE_ELIMINATED;

				if (w >= 15 && (lastWeeksOutcome == Constants.OUTCOME_TYPE_LOSS)) {
					return Constants.GAME_TYPE_ELIMINATED;
				}
				return Constants.GAME_TYPE_PLAYOFF
			}
		}

		// If not playoffs, regular.
		return Constants.GAME_TYPE_REGULAR;
	}

	public static getGameTypeSimple(year, week) {
		var y = parseInt(year);
		var w = parseInt(week);

		if (y >= 2021) { // Playoffs are weeks 15-17
			if (w >= 15) { // is playoffs
				return Constants.GAME_TYPE_PLAYOFF
			}
		} else { // Playoffs are weeks 14-16
			if (w >= 14) { // is playoffs
				return Constants.GAME_TYPE_PLAYOFF
			}
		}

		// If not playoffs, regular.
		return Constants.GAME_TYPE_REGULAR;
	}

}