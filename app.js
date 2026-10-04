/**
 * Fantasy Premier League Squad Manager - Phase 1 Complete Integration
 * Features: Dynamic Formations, Starter/Bench Swaps, Captain/Vice-Captain Rules,
 *           Auto-Substitutions Engine, and DOM Pitch Renderer.
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
      TOTAL_STARTERS: 11
    };
  }

  _findPlayerIndex(playerList, targetId) {
    if (!Array.isArray(playerList)) return -1;
    return playerList.findIndex(p => p && String(p.id) === String(targetId));
  }

  /**
   * Validates if starting 11 satisfies official FPL formation bounds.
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
      return { success: false, message: "Selected starter not found in lineup." };
    }
    if (benchIdx === -1) {
      return { success: false, message: "Selected bench player not found." };
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

    return { success: true, formation: validation.formation, squad: this.squad };
  }

  /**
   * Assigns Captain (C) and Vice-Captain (VC) roles.
   */
  setCaptainAndVice(captainId, viceCaptainId) {
    if (String(captainId) === String(viceCaptainId)) {
      return { success: false, message: "Captain and Vice-Captain cannot be the same player." };
    }

    const capIdx = this._findPlayerIndex(this.squad.starters, captainId);
    const viceIdx = this._findPlayerIndex(this.squad.starters, viceCaptainId);

    if (capIdx === -1 || viceIdx === -1) {
      return { success: false, message: "Captain and Vice-Captain must both be in starting 11." };
    }

    this.squad.starters = this.squad.starters.map((player) => ({
      ...player,
      isCaptain: String(player.id) === String(captainId),
      isViceCaptain: String(player.id) === String(viceCaptainId)
    }));

    return { success: true, squad: this.squad };
  }

  /**
   * Executes automatic substitutions for 0-minute starters.
   */
  processAutoSubstitutions(matchStats = {}) {
    let starters = this.squad.starters.map(p => ({ ...p }));
    let bench = this.squad.bench.map(p => ({ ...p }));
    const subsPerformed = [];

    // 1. Goalkeeper substitution
    const startingGkpIdx = starters.findIndex(p => String(p.position).toUpperCase() === 'GKP');
    const benchGkpIdx = bench.findIndex(p => String(p.position).toUpperCase() === 'GKP');

    if (startingGkpIdx !== -1 && benchGkpIdx !== -1) {
      const startingGkp = starters[startingGkpIdx];
      const benchGkp = bench[benchGkpIdx];

      const gkpMins = matchStats[startingGkp.id]?.minutes ?? matchStats[String(startingGkp.id)]?.minutes ?? 0;
      const benchGkpMins = matchStats[benchGkp.id]?.minutes ?? matchStats[String(benchGkp.id)]?.minutes ?? 0;

      if (gkpMins === 0 && benchGkpMins > 0) {
        starters[startingGkpIdx] = benchGkp;
        bench[benchGkpIdx] = startingGkp;
        subsPerformed.push({ type: "GKP", out: startingGkp, in: benchGkp });
      }
    }

    // 2. Outfield substitutions
    const benchUsed = new Array(bench.length).fill(false);

    for (let i = 0; i < starters.length; i++) {
      const starter = starters[i];
      if (String(starter.position).toUpperCase() === 'GKP') continue;

      const starterMins = matchStats[starter.id]?.minutes ?? matchStats[String(starter.id)]?.minutes ?? 0;
      if (starterMins === 0) {
        for (let j = 0; j < bench.length; j++) {
          const benchPlayer = bench[j];
          if (String(benchPlayer.position).toUpperCase() === 'GKP' || benchUsed[j]) continue;

          const benchMins = matchStats[benchPlayer.id]?.minutes ?? matchStats[String(benchPlayer.id)]?.minutes ?? 0;
          if (benchMins === 0) continue;

          const testStarters = [...starters];
          testStarters[i] = benchPlayer;

          if (this.isValidFormation(testStarters).valid) {
            benchUsed[j] = true;
            subsPerformed.push({ type: "OUTFIELD", out: starter, in: benchPlayer });
            starters[i] = benchPlayer;
            bench[j] = starter;
            break;
          }
        }
      }
    }

    // 3. Captain fallback
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
            subsPerformed.push({ type: "CAPTAIN_FALLBACK", from: captain, to: vice });
          }
        }
      }
    }

    this.squad = { starters, bench };
    return { squad: this.squad, subsPerformed };
  }
}

/**
 * UI Bridge - Binds squad manager safely to DOM elements if present
 */
class FantasyUIBridge {
  constructor(manager) {
    this.manager = manager;
    this.selectedPlayer = null;
  }

  init() {
    this.render();
    this.bindEvents();
  }

  bindEvents() {
    const autoSubBtn = document.getElementById('btn-auto-sub');
    if (autoSubBtn) {
      autoSubBtn.addEventListener('click', () => {
        const mockStats = {};
        this.manager.squad.starters.slice(0, 2).forEach(p => { mockStats[p.id] = { minutes: 0 }; });
        this.manager.squad.bench.forEach(p => { mockStats[p.id] = { minutes: 90 }; });

        const res = this.manager.processAutoSubstitutions(mockStats);
        this.showMessage(`Auto-subs evaluated. Executed: ${res.subsPerformed.length}`, 'success');
        this.render();
      });
    }
  }

  showMessage(msg, type = 'error') {
    const el = document.getElementById('status-msg');
    if (el) {
      el.className = `status-msg ${type}`;
      el.style.display = 'block';
      el.textContent = msg;
      setTimeout(() => { el.style.display = 'none'; }, 4000);
    } else {
      console.log(`[${type.toUpperCase()}] ${msg}`);
    }
  }

  handlePlayerClick(player, isStarter) {
    if (!this.selectedPlayer) {
      this.selectedPlayer = { player, isStarter };
      this.render();
      return;
    }

    const first = this.selectedPlayer;
    if (first.isStarter === isStarter) {
      this.selectedPlayer = { player, isStarter };
      this.render();
      return;
    }

    const starterId = first.isStarter ? first.player.id : player.id;
    const benchId = first.isStarter ? player.id : first.player.id;

    const swapResult = this.manager.swapStarterWithBench(starterId, benchId);
    if (!swapResult.success) {
      this.showMessage(swapResult.message, 'error');
    }

    this.selectedPlayer = null;
    this.render();
  }

  setRole(player, role) {
    const currentCap = this.manager.squad.starters.find(p => p.isCaptain)?.id;
    const currentVice = this.manager.squad.starters.find(p => p.isViceCaptain)?.id;

    let newCap = currentCap;
    let newVice = currentVice;

    if (role === 'C') {
      newCap = player.id;
      if (newVice === player.id) newVice = currentCap;
    } else if (role === 'VC') {
      newVice = player.id;
      if (newCap === player.id) newCap = currentVice;
    }

    const res = this.manager.setCaptainAndVice(newCap, newVice);
    if (!res.success) {
      this.showMessage(res.message, 'error');
    }
    this.render();
  }

  createCard(player, isStarter) {
    const card = document.createElement('div');
    const isSelected = this.selectedPlayer && String(this.selectedPlayer.player.id) === String(player.id);
    card.className = `player-card ${isSelected ? 'selected' : ''}`;

    let roleHtml = '';
    if (player.isCaptain) roleHtml = '<div class="role-badge">C</div>';
    if (player.isViceCaptain) roleHtml = '<div class="role-badge">VC</div>';

    let actionsHtml = '';
    if (isStarter) {
      actionsHtml = `
        <div class="card-actions">
          <button class="btn-badge btn-c">C</button>
          <button class="btn-badge btn-vc">VC</button>
        </div>
      `;
    }

    card.innerHTML = `
      ${roleHtml}
      <div class="position-tag">${player.position}</div>
      <div class="player-name">${player.name || 'Player'}</div>
      ${actionsHtml}
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-c')) {
        e.stopPropagation();
        this.setRole(player, 'C');
      } else if (e.target.classList.contains('btn-vc')) {
        e.stopPropagation();
        this.setRole(player, 'VC');
      } else {
        this.handlePlayerClick(player, isStarter);
      }
    });

    return card;
  }

  render() {
    const validation = this.manager.isValidFormation();
    const formationBadge = document.getElementById('formation-badge');
    if (formationBadge && validation.valid) {
      formationBadge.textContent = `Formation: ${validation.formation}`;
    }

    const lines = {
      GKP: document.getElementById('pitch-gkp'),
      DEF: document.getElementById('pitch-def'),
      MID: document.getElementById('pitch-mid'),
      FWD: document.getElementById('pitch-fwd'),
      BENCH: document.getElementById('bench-line')
    };

    Object.values(lines).forEach(el => { if (el) el.innerHTML = ''; });

    this.manager.squad.starters.forEach(player => {
      const pos = String(player.position).toUpperCase();
      if (lines[pos]) {
        lines[pos].appendChild(this.createCard(player, true));
      }
    });

    this.manager.squad.bench.forEach(player => {
      if (lines.BENCH) {
        lines.BENCH.appendChild(this.createCard(player, false));
      }
    });
  }
}

// Global Export
if (typeof window !== 'undefined') {
  window.FantasySquadManager = FantasySquadManager;
  window.FantasyUIBridge = FantasyUIBridge;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FantasySquadManager, FantasyUIBridge };
}
