/**
 * Fantasy Premier League Squad Manager - Phase 1 Complete Integration
 * Features: Dynamic Formations, Starter/Bench Swaps, Captain/Vice-Captain Rules,
 *           Auto-Substitutions Engine, and Pitch Layout Grouping.
 */

class FantasySquadManager {
  constructor(initialSquad = { starters: [], bench: [] }) {
    this.squad = initialSquad;
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
   * Validates if an array of starting players satisfies official FPL formation constraints.
   * @param {Array} starters Array of starting player objects ({ id, name, position, ... })
   * @returns {Object} { valid: boolean, reason?: string, formation?: string, counts?: Object }
   */
  isValidFormation(starters) {
    if (!Array.isArray(starters) || starters.length !== this.FORMATION_RULES.TOTAL_STARTERS) {
      return { 
        valid: false, 
        reason: `Starting lineup must contain exactly ${this.FORMATION_RULES.TOTAL_STARTERS} players.` 
      };
    }

    const counts = starters.reduce((acc, player) => {
      if (player && player.position) {
        acc[player.position] = (acc[player.position] || 0) + 1;
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

    const formation = `${counts.DEF}-${counts.MID}-${counts.FWD}`;

    return { valid: true, formation, counts };
  }

  /**
   * Swaps a starting player with a bench player if the swap produces a legal formation.
   * @param {string|number} starterId 
   * @param {string|number} benchId 
   * @returns {Object} { success: boolean, message?: string, squad?: Object, formation?: string }
   */
  swapStarterWithBench(starterId, benchId) {
    const starters = [...this.squad.starters];
    const bench = [...this.squad.bench];

    const starterIdx = starters.findIndex(p => p.id === starterId);
    const benchIdx = bench.findIndex(p => p.id === benchId);

    if (starterIdx === -1) {
      return { success: false, message: "Selected starter player not found in lineup." };
    }
    if (benchIdx === -1) {
      return { success: false, message: "Selected bench player not found." };
    }

    const candidateStarter = bench[benchIdx];
    const candidateBench = starters[starterIdx];

    // Create tentative lineup to check formation rules
    const testStarters = [...starters];
    testStarters[starterIdx] = candidateStarter;

    const validation = this.isValidFormation(testStarters);
    if (!validation.valid) {
      return { success: false, message: validation.reason };
    }

    // Apply swap upon successful validation
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
   * Assigns Captain and Vice-Captain roles to starting players.
   * @param {string|number} captainId 
   * @param {string|number} viceCaptainId 
   * @returns {Object} { success: boolean, message?: string, squad?: Object }
   */
  setCaptainAndVice(captainId, viceCaptainId) {
    if (captainId === viceCaptainId) {
      return { success: false, message: "Captain and Vice-Captain cannot be the same player." };
    }

    const starterIds = new Set(this.squad.starters.map(p => p.id));
    if (!starterIds.has(captainId)) {
      return { success: false, message: "Selected Captain must be in the starting 11." };
    }
    if (!starterIds.has(viceCaptainId)) {
      return { success: false, message: "Selected Vice-Captain must be in the starting 11." };
    }

    this.squad.starters = this.squad.starters.map(player => ({
      ...player,
      isCaptain: player.id === captainId,
      isViceCaptain: player.id === viceCaptainId
    }));

    return {
      success: true,
      squad: this.squad
    };
  }

  /**
   * Executes automatic substitutions after gameweek matches finish.
   * @param {Object} matchStats Dictionary of player IDs to stats e.g. { player_12: { minutes: 90 } }
   * @returns {Object} { squad: Object, subsPerformed: Array }
   */
  processAutoSubstitutions(matchStats = {}) {
    let starters = this.squad.starters.map(p => ({ ...p }));
    let bench = this.squad.bench.map(p => ({ ...p }));
    const subsPerformed = [];

    // 1. Goalkeeper substitution
    const startingGkpIdx = starters.findIndex(p => p.position === 'GKP');
    const benchGkpIdx = bench.findIndex(p => p.position === 'GKP');

    if (startingGkpIdx !== -1 && benchGkpIdx !== -1) {
      const startingGkp = starters[startingGkpIdx];
      const benchGkp = bench[benchGkpIdx];

      const gkpMins = matchStats[startingGkp.id]?.minutes || 0;
      const benchGkpMins = matchStats[benchGkp.id]?.minutes || 0;

      if (gkpMins === 0 && benchGkpMins > 0) {
        starters[startingGkpIdx] = benchGkp;
        bench[benchGkpIdx] = startingGkp;
        subsPerformed.push({
          type: "GKP_SUB",
          out: startingGkp,
          in: benchGkp,
          reason: "Starting goalkeeper played 0 minutes"
        });
      }
    }

    // 2. Outfield substitutions (evaluated in strict bench order: Bench 1 -> Bench 2 -> Bench 3)
    const benchUsedFlags = new Array(bench.length).fill(false);

    for (let i = 0; i < starters.length; i++) {
      const starter = starters[i];
      if (starter.position === 'GKP') continue;

      const starterMins = matchStats[starter.id]?.minutes || 0;
      if (starterMins === 0) {
        for (let j = 0; j < bench.length; j++) {
          const benchPlayer = bench[j];
          if (benchPlayer.position === 'GKP' || benchUsedFlags[j]) continue;

          const benchMins = matchStats[benchPlayer.id]?.minutes || 0;
          if (benchMins === 0) continue;

          // Test formation validity before committing sub
          const testStarters = [...starters];
          testStarters[i] = benchPlayer;

          if (this.isValidFormation(testStarters).valid) {
            benchUsedFlags[j] = true;
            subsPerformed.push({
              type: "OUTFIELD_SUB",
              out: starter,
              in: benchPlayer,
              reason: "Starting player played 0 minutes"
            });
            starters[i] = benchPlayer;
            bench[j] = starter;
            break;
          }
        }
      }
    }

    // 3. Captain fallback to Vice-Captain
    const captainIdx = starters.findIndex(p => p.isCaptain);
    if (captainIdx !== -1) {
      const captain = starters[captainIdx];
      const capMins = matchStats[captain.id]?.minutes || 0;

      if (capMins === 0) {
        const viceIdx = starters.findIndex(p => p.isViceCaptain);
        if (viceIdx !== -1) {
          const vice = starters[viceIdx];
          const viceMins = matchStats[vice.id]?.minutes || 0;

          if (viceMins > 0) {
            starters[captainIdx].isCaptain = false;
            starters[viceIdx].isCaptain = true;
            subsPerformed.push({
              type: "CAPTAIN_FALLBACK",
              from: captain,
              to: vice,
              reason: "Captain played 0 minutes; armband transferred to Vice-Captain"
            });
          }
        }
      }
    }

    this.squad = { starters, bench };
    return {
      squad: this.squad,
      subsPerformed
    };
  }

  /**
   * Groups starting players by line for UI pitch rendering.
   * @returns {Object} { GKP: [], DEF: [], MID: [], FWD: [], formation: string }
   */
  getPitchLayout() {
    const layout = { GKP: [], DEF: [], MID: [], FWD: [] };
    this.squad.starters.forEach(player => {
      if (layout[player.position]) {
        layout[player.position].push(player);
      }
    });

    const formation = `${layout.DEF.length}-${layout.MID.length}-${layout.FWD.length}`;
    return { ...layout, formation };
  }
}

// Export for module systems or attach to global window context
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FantasySquadManager;
} else {
  window.FantasySquadManager = FantasySquadManager;
}
