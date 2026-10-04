/**
 * Fantasy Premier League Squad Manager - Complete Phase 1 Logic & UI Engine
 */

class FantasySquadManager {
  constructor(initialSquad) {
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
    return playerList.findIndex(p => p && String(p.id) === String(targetId));
  }

  isValidFormation(starters = this.squad.starters) {
    if (!Array.isArray(starters) || starters.length !== this.FORMATION_RULES.TOTAL_STARTERS) {
      return { valid: false, reason: `Starting lineup must contain exactly ${this.FORMATION_RULES.TOTAL_STARTERS} players.` };
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

  swapStarterWithBench(starterId, benchId) {
    const starters = [...this.squad.starters];
    const bench = [...this.squad.bench];

    const starterIdx = this._findPlayerIndex(starters, starterId);
    const benchIdx = this._findPlayerIndex(bench, benchId);

    if (starterIdx === -1 || benchIdx === -1) {
      return { success: false, message: "Selected player not found in lineup or bench." };
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

  processAutoSubstitutions(matchStats = {}) {
    let starters = this.squad.starters.map(p => ({ ...p }));
    let bench = this.squad.bench.map(p => ({ ...p }));
    const subsPerformed = [];

    // GKP Substitution
    const startingGkpIdx = starters.findIndex(p => p.position === 'GKP');
    const benchGkpIdx = bench.findIndex(p => p.position === 'GKP');

    if (startingGkpIdx !== -1 && benchGkpIdx !== -1) {
      const startingGkp = starters[startingGkpIdx];
      const benchGkp = bench[benchGkpIdx];

      const gkpMins = matchStats[startingGkp.id]?.minutes ?? 0;
      const benchGkpMins = matchStats[benchGkp.id]?.minutes ?? 0;

      if (gkpMins === 0 && benchGkpMins > 0) {
        starters[startingGkpIdx] = benchGkp;
        bench[benchGkpIdx] = startingGkp;
        subsPerformed.push(`Substituted GKP: ${benchGkp.name} in for ${startingGkp.name}`);
      }
    }

    // Outfield Substitutions
    const benchUsed = new Array(bench.length).fill(false);

    for (let i = 0; i < starters.length; i++) {
      const starter = starters[i];
      if (starter.position === 'GKP') continue;

      const starterMins = matchStats[starter.id]?.minutes ?? 0;
      if (starterMins === 0) {
        for (let j = 0; j < bench.length; j++) {
          const benchPlayer = bench[j];
          if (benchPlayer.position === 'GKP' || benchUsed[j]) continue;

          const benchMins = matchStats[benchPlayer.id]?.minutes ?? 0;
          if (benchMins === 0) continue;

          const testStarters = [...starters];
          testStarters[i] = benchPlayer;

          if (this.isValidFormation(testStarters).valid) {
            benchUsed[j] = true;
            subsPerformed.push(`Substituted ${benchPlayer.position}: ${benchPlayer.name} in for ${starter.name}`);
            starters[i] = benchPlayer;
            bench[j] = starter;
            break;
          }
        }
      }
    }

    // Captain Fallback
    const capIdx = starters.findIndex(p => p.isCaptain);
    if (capIdx !== -1) {
      const captain = starters[capIdx];
      const capMins = matchStats[captain.id]?.minutes ?? 0;

      if (capMins === 0) {
        const viceIdx = starters.findIndex(p => p.isViceCaptain);
        if (viceIdx !== -1) {
          const vice = starters[viceIdx];
          const viceMins = matchStats[vice.id]?.minutes ?? 0;

          if (viceMins > 0) {
            starters[capIdx].isCaptain = false;
            starters[viceIdx].isCaptain = true;
            subsPerformed.push(`Captain ${captain.name} played 0 mins. Armband moved to Vice-Captain ${vice.name}.`);
          }
        }
      }
    }

    this.squad = { starters, bench };
    return { squad: this.squad, subsPerformed };
  }
}

// -------------------------------------------------------------
// UI CONTROLLER AND DOM RENDERER
// -------------------------------------------------------------
class FantasyUIController {
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
        // Mock match stats where 2 starters played 0 minutes
        const mockMatchStats = {
          2: { minutes: 0 },  // Gabriel played 0 mins
          6: { minutes: 0 },  // Saka (C) played 0 mins
          13: { minutes: 90 }, // Rogers (Bench) played 90 mins
          14: { minutes: 90 }, // Konsa (Bench) played 90 mins
          7: { minutes: 90 }   // Palmer (VC) played 90 mins
        };

        const result = this.manager.processAutoSubstitutions(mockMatchStats);
        if (result.subsPerformed.length > 0) {
          this.showMessage(`Auto-Subs Completed: ${result.subsPerformed.join(' | ')}`, 'success');
        } else {
          this.showMessage('No auto-substitutions required.', 'success');
        }
        this.render();
      });
    }
  }

  showMessage(msg, type = 'error') {
    const el = document.getElementById('status-msg');
    if (el) {
      el.className = `status-msg ${type}`;
      el.textContent = msg;
      setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
  }

  handlePlayerClick(player, isStarter) {
    if (!this.selectedPlayer) {
      // First selection
      this.selectedPlayer = { player, isStarter };
      this.render();
      return;
    }

    // Second selection - attempt swap if one is starter and one is bench
    const first = this.selectedPlayer;
    if (first.isStarter === isStarter) {
      // Re-select if clicking another player in the same group
      this.selectedPlayer = { player, isStarter };
      this.render();
      return;
    }

    const starterId = first.isStarter ? first.player.id : player.id;
    const benchId = first.isStarter ? player.id : first.player.id;

    const swapResult = this.manager.swapStarterWithBench(starterId, benchId);
    if (!swapResult.success) {
      this.showMessage(swapResult.message, 'error');
    } else {
      this.showMessage(`Swapped ${first.player.name} with ${player.name}`, 'success');
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

  createPlayerCard(player, isStarter) {
    const card = document.createElement('div');
    const isSelected = this.selectedPlayer && this.selectedPlayer.player.id === player.id;
    card.className = `player-card ${isSelected ? 'selected' : ''}`;

    let roleBadgeHtml = '';
    if (player.isCaptain) roleBadgeHtml = '<div class="role-badge">C</div>';
    if (player.isViceCaptain) roleBadgeHtml = '<div class="role-badge">VC</div>';

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
      ${roleBadgeHtml}
      <div class="position-tag">${player.position}</div>
      <div class="player-name">${player.name}</div>
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
    // Render Formation
    const validation = this.manager.isValidFormation();
    const formationBadge = document.getElementById('formation-badge');
    if (formationBadge && validation.valid) {
      formationBadge.textContent = `Formation: ${validation.formation}`;
    }

    // Clear Pitch Lines
    const lines = {
      GKP: document.getElementById('pitch-gkp'),
      DEF: document.getElementById('pitch-def'),
      MID: document.getElementById('pitch-mid'),
      FWD: document.getElementById('pitch-fwd'),
      BENCH: document.getElementById('bench-line')
    };

    Object.values(lines).forEach(el => { if (el) el.innerHTML = ''; });

    // Render Starters on Pitch Lines
    this.manager.squad.starters.forEach(player => {
      const pos = String(player.position).toUpperCase();
      if (lines[pos]) {
        lines[pos].appendChild(this.createPlayerCard(player, true));
      }
    });

    // Render Bench Players
    this.manager.squad.bench.forEach(player => {
      if (lines.BENCH) {
        lines.BENCH.appendChild(this.createPlayerCard(player, false));
      }
    });
  }
}

// Sample Squad Initialization
const initialSquadData = {
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

document.addEventListener('DOMContentLoaded', () => {
  const manager = new FantasySquadManager(initialSquadData);
  const ui = new FantasyUIController(manager);
  ui.init();
});

