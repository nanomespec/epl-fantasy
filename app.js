/**
 * Fantasy Premier League Squad Manager - Phase 1 Complete Integration
 */
class FantasySquadManager {
  constructor(initialSquad = { starters: [], bench: [] }) {
    this.squad = {
      starters: initialSquad.starters || [],
      bench: initialSquad.bench || []
    };
    this.FORMATION_RULES = {
      GKP: { min: 1, max: 1 },
      DEF: { min: 3, max: 5 },
      MID: { min: 2, max: 5 },
      FWD: { min: 1, max: 3 },
      TOTAL_STARTERS: 11,
      TOTAL_SQUAD: 15
    };
  }

  /**
   * Helper to safely match player IDs regardless of string or number types
   */
  _findPlayerIndex(playerList, targetId) {
    return playerList.findIndex(p => p && String(p.id) === String(targetId));
  }

  /**
   * Validates whether starting 11 meets legal FPL formation rules.
   */
  isValidFormation(starters = this.squad.starters) {
    if (!Array.isArray(starters) || starters.length !== this.FORMATION_RULES.TOTAL_STARTERS) {
      return { 
        valid: false, 
        reason: `Starting lineup must contain exactly ${this.FORMATION_RULES.TOTAL_STARTERS} players.` 
      };
    }

    const counts = starters.reduce((acc, player) => {
      if (player && player.position) {
        const pos = String(player.position).toUpperCase();
        acc[pos] = (acc[pos] || 0) + 1;
      }
      return acc;
    }, { GKP: 0, DEF: 0, MID: 0, FWD: 0 });

    if (counts.GKP !== this.FORMATION_RULES.GKP.min) {
      return { valid: false, reason: "Lineup must have exactly 1 Goalkeeper on the pitch." };
    }
    if (counts.DEF < this.FORMATION_RULES.DEF.min || counts.DEF > this.FORMATION_RULES.DEF.max) {
      return { valid: false, reason: `Lineup must have between ${this.FORMATION_RULES.DEF.min} and ${this.FORMATION_RULES.DEF.max} Defenders.` };
    }
    if (counts.MID < this.FORMATION_RULES.MID.min || counts.MID > this.FORMATION_RULES.MID.max) {
      return { valid: false, reason: `Lineup must have between ${this.FORMATION_RULES.MID.min} and ${this.FORMATION_RULES.MID.max} Midfielders.` };
    }
    if (counts.FWD < this.FORMATION_RULES.FWD.min || counts.FWD > this.FORMATION_RULES.FWD.max) {
      return { valid: false, reason: `Lineup must have between ${this.FORMATION_RULES.FWD.min} and ${this.FORMATION_RULES.FWD.max} Forwards.` };
    }

    return { 
      valid: true, 
      formation: `${counts.DEF}-${counts.MID}-${counts.FWD}`, 
      counts 
    };
  }

  /**
   * Swaps a starting player with a bench player.
   */
  swapStarterWithBench(starterId, benchId) {
    const starters = [...this.squad.starters];
    const bench = [...this.squad.bench];

    const starterIdx = this._findPlayerIndex(starters, starterId);
    const benchIdx = this._findPlayerIndex(bench, benchId);

    if (starterIdx === -1) {
      return { success: false, message: `Starter with ID "${starterId}" not found in lineup.` };
    }
    if (benchIdx === -1) {
      return { success: false, message: `Bench player with ID "${benchId}" not found.` };
    }

    const candidateStarter = bench[benchIdx];
    const candidateBench = starters[starterIdx];

    const testStarters = [...starters];
    testStarters[starterIdx] = candidateStarter;

    const validation = this.isValidFormation(testStarters);
    if (!validation.valid) {
      return { success: false, message: validation.reason };
    }

    starters[starterIdx] = candidateStarter;
    bench[benchIdx] = candidateBench;

    this.squad = { starters, bench };

    return {
      success: true,
      formation: validation.formation,
      squad: this.squad
    };
  }

  /**
   * Assigns Captain and Vice-Captain roles.
   */
  setCaptainAndVice(captainId, viceCaptainId) {
    if (String(captainId) === String(viceCaptainId)) {
      return { success: false, message: "Captain and Vice-Captain cannot be the same player." };
    }

    const capIdx = this._findPlayerIndex(this.squad.starters, captainId);
    const viceIdx = this._findPlayerIndex(this.squad.starters, viceCaptainId);

    if (capIdx === -1) {
      return { success: false, message: "Selected Captain must be in the starting 11." };
    }
    if (viceIdx === -1) {
      return { success: false, message: "Selected Vice-Captain must be in the starting 11." };
    }

    this.squad.starters = this.squad.starters.map((player) => ({
      ...player,
      isCaptain: String(player.id) === String(captainId),
      isViceCaptain: String(player.id) === String(viceCaptainId)
    }));

    return { success: true, squad: this.squad };
  }

  /**
   * Executes automatic substitutions.
   */
  processAutoSubstitutions(matchStats = {}) {
    let starters = this.squad.starters.map(p => ({ ...p }));
    let bench = this.squad.bench.map(p => ({ ...p }));
    const subsPerformed = [];

    // Goalkeeper substitution
    const startingGkpIdx = starters.findIndex(p => p.position === 'GKP');
    const benchGkpIdx = bench.findIndex(p => p.position === 'GKP');

    if (startingGkpIdx !== -1 && benchGkpIdx !== -1) {
      const startingGkp = starters[startingGkpIdx];
      const benchGkp = bench[benchGkpIdx];

      const gkpMins = matchStats[startingGkp.id]?.minutes ?? matchStats[String(startingGkp.id)]?.minutes ?? 0;
      const benchGkpMins = matchStats[benchGkp.id]?.minutes ?? matchStats[String(benchGkp.id)]?.minutes ?? 0;

      if (gkpMins === 0 && benchGkpMins > 0) {
        starters[startingGkpIdx] = benchGkp;
        bench[benchGkpIdx] = startingGkp;
        subsPerformed.push({
          type: "GKP_SUB",
          out: startingGkp,
          in: benchGkp
        });
      }
    }

    // Outfield substitutions
    const benchUsed = new Array(bench.length).fill(false);

    for (let i = 0; i < starters.length; i++) {
      const starter = starters[i];
      if (starter.position === 'GKP') continue;

      const starterMins = matchStats[starter.id]?.minutes ?? matchStats[String(starter.id)]?.minutes ?? 0;
      if (starterMins === 0) {
        for (let j = 0; j < bench.length; j++) {
          const benchPlayer = bench[j];
          if (benchPlayer.position === 'GKP' || benchUsed[j]) continue;

          const benchMins = matchStats[benchPlayer.id]?.minutes ?? matchStats[String(benchPlayer.id)]?.minutes ?? 0;
          if (benchMins === 0) continue;

          const testStarters = [...starters];
          testStarters[i] = benchPlayer;

          if (this.isValidFormation(testStarters).valid) {
            benchUsed[j] = true;
            subsPerformed.push({
              type: "OUTFIELD_SUB",
              out: starter,
              in: benchPlayer
            });
            starters[i] = benchPlayer;
            bench[j] = starter;
            break;
          }
        }
      }
    }

    // Captain fallback
    const capIdx = starters.findIndex(p => p.isCaptain);
    if (capIdx !== -1) {
      const captain = starters[capIdx];
      const capMins = matchStats[captain.id]?.minutes ?? matchStats[String(captain.id)]?.minutes ?? 0;

      if (capMins === 0) {
        const viceIdx = starters.findIndex(p => p.isViceCaptain);
        if (viceIdx !== -1) {
          const vice = starters[viceIdx];
          const viceMins = matchStats[vice.id]?.minutes ?? matchStats[String(vice.id)]?.minutes ?? 0;

          if (viceMins > 0) {
            starters[capIdx].isCaptain = false;
            starters[viceIdx].isCaptain = true;
            subsPerformed.push({
              type: "CAPTAIN_FALLBACK",
              from: captain,
              to: vice
            });
          }
        }
      }
    }

    this.squad = { starters, bench };
    return { squad: this.squad, subsPerformed };
  }

  /**
   * Groups starters by position for rendering.
   */
  getPitchLayout() {
    const layout = { GKP: [], DEF: [], MID: [], FWD: [] };
    this.squad.starters.forEach(player => {
      const pos = String(player.position).toUpperCase();
      if (layout[pos]) {
        layout[pos].push(player);
      }
    });

    const formation = `${layout.DEF.length}-${layout.MID.length}-${layout.FWD.length}`;
    return { ...layout, formation };
  }
}

// -------------------------------------------------------------
// DEMO INITIALIZATION & VERIFICATION
// -------------------------------------------------------------
const sampleSquad = {
  starters: [
    { id: 1, name: "Raya", position: "GKP", isCaptain: false, isViceCaptain: false },
    { id: 2, name: "Gabriel", position: "DEF", isCaptain: false, isViceCaptain: false },
    { id: 3, name: "Saliba", position: "DEF", isCaptain: false, isViceCaptain: false },
    { id: 4, name: "Alexander-Arnold", position: "DEF", isCaptain: false, isViceCaptain: false },
    { id: 5, name: "Gvardiol", position: "DEF", isCaptain: false, isViceCaptain: false },
    { id: 6, name: "Saka", position: "MID", isCaptain: true, isViceCaptain: false },
    { id: 7, name: "Palmer", position: "MID", isCaptain: false, isViceCaptain: true },
    { id: 8, name: "Salah", position: "MID", isCaptain: false, isViceCaptain: false },
    { id: 9, name: "Gordon", position: "MID", isCaptain: false, isViceCaptain: false },
    { id: 10, name: "Haaland", position: "FWD", isCaptain: false, isViceCaptain: false },
    { id: 11, name: "Watkins", position: "FWD", isCaptain: false, isViceCaptain: false }
  ],
  bench: [
    { id: 12, name: "Neto", position: "GKP", isCaptain: false, isViceCaptain: false },
    { id: 13, name: "Rogers", position: "MID", isCaptain: false, isViceCaptain: false },
    { id: 14, name: "Konsa", position: "DEF", isCaptain: false, isViceCaptain: false },
    { id: 15, name: "Joao Pedro", position: "FWD", isCaptain: false, isViceCaptain: false }
  ]
};

// Initialize manager instance on window for browser access
if (typeof window !== 'undefined') {
  window.FantasySquadManager = FantasySquadManager;
  window.fantasyManager = new FantasySquadManager(sampleSquad);
  console.log("FantasySquadManager initialized. Formation:", window.fantasyManager.getPitchLayout().formation);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FantasySquadManager, sampleSquad };
}

