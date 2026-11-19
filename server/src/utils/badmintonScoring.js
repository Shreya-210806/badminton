/**
 * BWF Badminton Scoring Rules Validator & Winner Calculator
 * - Best of 3 games to 21 points.
 * - Must win by at least 2 points from 20-20 up to 29-29.
 * - At 29-29, first side to 30 wins (30-29). Maximum score in any game is 30.
 * - A completed game must have a clear winner satisfying these thresholds.
 * - A 3rd game is only played if Games 1 and 2 are split 1-1.
 */

export function validateCompletedGame(scoreA, scoreB, gameNumber) {
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
    return { valid: false, error: `Game ${gameNumber}: Scores must be non-negative integers.` };
  }
  if (scoreA > 30 || scoreB > 30) {
    return { valid: false, error: `Game ${gameNumber}: Maximum badminton score in a game is 30.` };
  }
  if (scoreA === scoreB) {
    return { valid: false, error: `Game ${gameNumber}: A completed game cannot end in a tie (${scoreA}-${scoreB}).` };
  }

  const high = Math.max(scoreA, scoreB);
  const low = Math.min(scoreA, scoreB);

  if (high < 21) {
    return {
      valid: false,
      error: `Game ${gameNumber}: Winning score must be at least 21 (got ${scoreA}-${scoreB}).`,
    };
  }

  if (high === 21 && low > 19) {
    return {
      valid: false,
      error: `Game ${gameNumber}: At 20-all, a side must win by 2 points (e.g., 22-20, not ${scoreA}-${scoreB}).`,
    };
  }

  if (high > 21 && high < 30 && high - low !== 2) {
    return {
      valid: false,
      error: `Game ${gameNumber}: Extended games between 22 and 29 must be won by exactly 2 points (got ${scoreA}-${scoreB}).`,
    };
  }

  if (high === 30 && low !== 28 && low !== 29) {
    return {
      valid: false,
      error: `Game ${gameNumber}: A score of 30 is only valid at 30-28 or 30-29 (got ${scoreA}-${scoreB}).`,
    };
  }

  return { valid: true, winner: scoreA > scoreB ? 'A' : 'B' };
}

export function evaluateBadmintonMatch(scores = [], status = 'completed') {
  if (!Array.isArray(scores)) {
    return { valid: false, error: 'Scores must be provided as an array of games.' };
  }

  // Filter out empty trailing 0-0 games
  const normalized = scores
    .filter((g) => g && (Number(g.scoreA) > 0 || Number(g.scoreB) > 0))
    .map((g, idx) => ({
      gameNumber: idx + 1,
      scoreA: Number(g.scoreA),
      scoreB: Number(g.scoreB),
    }));

  if (normalized.length > 3) {
    return { valid: false, error: 'A badminton match consists of at most 3 games.' };
  }

  if (status === 'walkover') {
    return { valid: true, normalizedScores: normalized, gamesWonA: 0, gamesWonB: 0, winnerSide: null };
  }

  if (status === 'scheduled' || status === 'postponed') {
    return { valid: true, normalizedScores: [], gamesWonA: 0, gamesWonB: 0, winnerSide: null };
  }

  let gamesWonA = 0;
  let gamesWonB = 0;

  for (let i = 0; i < normalized.length; i++) {
    const game = normalized[i];
    const isLastEntered = i === normalized.length - 1;

    // For a live match, the final in-progress game doesn't need to be finished yet,
    // though it still cannot exceed 30 or violate deuce ceiling.
    if (status === 'live' && isLastEntered) {
      if (
        !Number.isInteger(game.scoreA) ||
        !Number.isInteger(game.scoreB) ||
        game.scoreA < 0 ||
        game.scoreB < 0 ||
        game.scoreA > 30 ||
        game.scoreB > 30
      ) {
        return { valid: false, error: `Game ${game.gameNumber}: Live score must be between 0 and 30.` };
      }
      const check = validateCompletedGame(game.scoreA, game.scoreB, game.gameNumber);
      if (check.valid) {
        if (check.winner === 'A') gamesWonA++;
        else gamesWonB++;
      }
      continue;
    }

    if (gamesWonA === 2 || gamesWonB === 2) {
      return {
        valid: false,
        error: `Game ${game.gameNumber} cannot be played because a player/team already won 2 games.`,
      };
    }

    const result = validateCompletedGame(game.scoreA, game.scoreB, game.gameNumber);
    if (!result.valid) {
      return result;
    }
    if (result.winner === 'A') gamesWonA++;
    else gamesWonB++;
  }

  if (status === 'completed') {
    if (gamesWonA < 2 && gamesWonB < 2) {
      return {
        valid: false,
        error: 'A completed best-of-3 match requires one side to win 2 valid games.',
      };
    }
    return {
      valid: true,
      normalizedScores: normalized,
      gamesWonA,
      gamesWonB,
      winnerSide: gamesWonA === 2 ? 'A' : 'B',
    };
  }

  return {
    valid: true,
    normalizedScores: normalized,
    gamesWonA,
    gamesWonB,
    winnerSide: gamesWonA === 2 ? 'A' : gamesWonB === 2 ? 'B' : null,
  };
}
