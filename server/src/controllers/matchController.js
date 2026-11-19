import { Match, Player, Team } from '../models/index.js';
import { evaluateBadmintonMatch } from '../utils/badmintonScoring.js';
import { recordAudit } from '../utils/auditLogger.js';

export const getAssignedMatches = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'referee') {
      filter.assignedReferee = req.user._id;
    } else if (req.query.tournament) {
      filter.tournament = req.query.tournament;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const matches = await Match.find(filter)
      .populate('tournament', 'name slug venue city')
      .populate('assignedReferee', 'name email')
      .sort({ status: 1, scheduledAt: 1 });

    res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (err) {
    next(err);
  }
};

async function updateCompetitorStatsOnCompletion(match, winnerSide) {
  const winSide = winnerSide === 'A' ? match.sideA : match.sideB;
  const loseSide = winnerSide === 'A' ? match.sideB : match.sideA;
  const isFinal = match.round === 'Final';

  if (match.format === 'singles') {
    if (winSide?.player) {
      await Player.findByIdAndUpdate(winSide.player, {
        $inc: { wins: 1, rankingPoints: isFinal ? 60 : 25, titles: isFinal ? 1 : 0 },
      });
    }
    if (loseSide?.player) {
      await Player.findByIdAndUpdate(loseSide.player, {
        $inc: { losses: 1, rankingPoints: 5 },
      });
    }
  } else {
    if (winSide?.team) {
      const winTeam = await Team.findById(winSide.team);
      if (winTeam) {
        const ids = [winTeam.player1, winTeam.player2].filter(Boolean);
        await Player.updateMany(
          { _id: { $in: ids } },
          { $inc: { wins: 1, rankingPoints: isFinal ? 50 : 20, titles: isFinal ? 1 : 0 } }
        );
      }
    }
    if (loseSide?.team) {
      const loseTeam = await Team.findById(loseSide.team);
      if (loseTeam) {
        const ids = [loseTeam.player1, loseTeam.player2].filter(Boolean);
        await Player.updateMany(
          { _id: { $in: ids } },
          { $inc: { losses: 1, rankingPoints: 5 } }
        );
      }
    }
  }
}

export const updateMatchScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      scores = [],
      status = 'live',
      winnerSide: manualWinnerSide = null,
      servingSide = 'A',
      published = true,
      durationMinutes = 0,
      notes = '',
    } = req.body;

    const match = await Match.findById(id).populate('tournament', 'name slug');
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found.',
      });
    }

    // Strict API permission check for Referees: only assigned matches!
    if (req.user.role === 'referee') {
      if (!match.assignedReferee || String(match.assignedReferee) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Referees can only score matches explicitly assigned to them.',
        });
      }
    }

    const wasAlreadyCompleted = match.status === 'completed' || match.status === 'walkover';

    const evaluation = evaluateBadmintonMatch(scores, status);
    if (!evaluation.valid) {
      return res.status(400).json({
        success: false,
        message: evaluation.error,
      });
    }

    let finalWinner = evaluation.winnerSide;
    if (status === 'walkover') {
      if (manualWinnerSide !== 'A' && manualWinnerSide !== 'B') {
        return res.status(400).json({
          success: false,
          message: 'Walkover status requires selecting winnerSide ("A" or "B").',
        });
      }
      finalWinner = manualWinnerSide;
    }

    match.scores = evaluation.normalizedScores;
    match.status = status;
    match.winnerSide = finalWinner;
    match.servingSide = servingSide === 'B' ? 'B' : 'A';
    match.published = Boolean(published);
    if (durationMinutes) match.durationMinutes = Number(durationMinutes);
    if (notes !== undefined) match.notes = notes;

    if ((status === 'completed' || status === 'walkover') && !match.completedAt) {
      match.completedAt = new Date();
    }

    await match.save();

    // Advance winner into next bracket match if configured
    if ((status === 'completed' || status === 'walkover') && finalWinner && match.nextMatchCode) {
      const advancingSide = finalWinner === 'A' ? match.sideA : match.sideB;
      const nextMatch = await Match.findOne({
        tournament: match.tournament._id,
        matchCode: match.nextMatchCode,
      });
      if (nextMatch) {
        const targetField = match.nextMatchSlot === 'B' ? 'sideB' : 'sideA';
        nextMatch[targetField] = {
          player: advancingSide.player || null,
          team: advancingSide.team || null,
          label: advancingSide.label,
          club: advancingSide.club || '',
          seed: advancingSide.seed || null,
        };
        await nextMatch.save();
      }
    }

    if (!wasAlreadyCompleted && (status === 'completed' || status === 'walkover') && finalWinner) {
      await updateCompetitorStatsOnCompletion(match, finalWinner);
    }

    const scoreSummary = match.scores.map((g) => `${g.scoreA}-${g.scoreB}`).join(', ');
    await recordAudit({
      req,
      action: 'MATCH_SCORE_UPDATE',
      entityType: 'Match',
      entityId: match._id,
      summary: `Updated ${match.matchCode} (${match.sideA.label} vs ${match.sideB.label}) -> ${status.toUpperCase()} [${scoreSummary || 'No games'}]`,
      metadata: { status, scores: match.scores, winnerSide: finalWinner },
    });

    const updated = await Match.findById(match._id)
      .populate('tournament', 'name slug venue city')
      .populate('assignedReferee', 'name email');

    res.json({
      success: true,
      message:
        status === 'completed'
          ? `Match completed! Winner: ${finalWinner === 'A' ? match.sideA.label : match.sideB.label}.`
          : 'Match score updated.',
      match: updated,
    });
  } catch (err) {
    next(err);
  }
};
