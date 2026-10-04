/**
 * EPL Fantasy Squad Manager
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
      return { valid: false, reason: "Lineup must have exactly 1 Goalkeeper." };
    }
    if (counts.DEF < this.FORMATION_RULES.DEF.min || counts.DEF > this.FORMATION_RULES.DEF.max) {
      return { valid: false, reason: `Defenders must be between ${this.FORMATION_RULES.DEF.min} and ${this.FORMATION_RULES.DEF.max}.` };
    }
    if (counts.MID < this.FORMATION_RULES.MID.min || counts.MID > this.FORMATION_RULES.MID.max) {
      return { valid: false, reason: `Midfielders must be between ${this.FORMATION_RULES.MID.min} and ${this.FORMATION_RULES.MID.max}.` };
    }
    if (counts.FWD < this.FORMATION_RULES.FWD.min || counts.FWD > this.FORMATION_RULES.FWD.max) {
      return { valid: false, reason: `Forwards must be between ${this.FORMATION_RULES.FWD.min} and ${this.FORMATION_RULES.FWD.max}.` };
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
      return { success: false, message: "Selected player not found." };
    }

    const testStarters = [...starters];
    testStarters[starterIdx] = bench[benchIdx];

    const validation = this.isValidFormation(testStarters);
    if (!validation.valid) {
      return { success: false, message: validation.reason };
    }

    const temp = starters[starterIdx];
    starters[starterIdx] = bench[benchIdx];
    bench[benchIdx] = temp;

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
      return { success: false, message: "Both players must be in the starting 11." };
    }

    this.squad.starters = this.squad.starters.map((player) => ({
      ...player,
      isCaptain: String(player.id) === String(captainId),
      isViceCaptain: String(player.id) === String(viceCaptainId)
    }));

    return { success: true, squad: this.squad };
  }
}

class FantasyUIBridge {
  constructor(manager) {
    this.manager = manager;
    this.selectedPlayer = null;
  }

  init() {
    this.render();
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

  createCard(player, isStarter) {
    const card = document.createElement('div');
    const isSelected = this.selectedPlayer && String(this.selectedPlayer.player.id) === String(player.id);
    card.className = `player-card ${isSelected ? 'selected' : ''}`;

    let roleHtml = '';
    if (player.isCaptain) roleHtml = '<div class="role-badge">C</div>';
    if (player.isViceCaptain) roleHtml = '<div class="role-badge">VC</div>';

    card.innerHTML = `
      ${roleHtml}
      <div class="position-tag">${player.position || ''}</div>
      <div class="player-name">${player.name || 'Player'}</div>
    `;

    card.addEventListener('click', () => {
      this.handlePlayerClick(player, isStarter);
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
