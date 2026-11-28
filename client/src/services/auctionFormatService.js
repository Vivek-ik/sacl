import { api } from "../lib/api";

const BASE_URL = (auctionId) => `/auction-formats/${auctionId}/direct`;

export const directAuctionService = {
  /**
   * Get Direct Selection state
   */
  async getState(auctionId) {
    const { data } = await api.get(BASE_URL(auctionId));
    return data;
  },

  /**
   * Organizer opens bid submissions.
   * deadline should be an ISO date string.
   *
   * categoryLimits example:
   * {
   *   ICONIC: { min: 5000, max: 15000 },
   *   A: { min: 3000, max: 10000 },
   *   B: { min: 2000, max: 7000 },
   *   C: { min: 1000, max: 5000 },
   *   D: { min: 500, max: 3000 }
   * }
   */
  async openSubmissions(auctionId, deadline, categoryLimits) {
    const { data } = await api.post(`${BASE_URL(auctionId)}/open`, {
      deadline,
      categoryLimits,
    });

    return data;
  },

  /**
   * Team owner submits bids.
   *
   * bids example:
   * [
   *   { playerId: "PLAYER_ID", amount: 5000 },
   *   { playerId: "PLAYER_ID_2", amount: 7000 }
   * ]
   */
  async submitBids(auctionId, teamId, bids) {
    const { data } = await api.post(`${BASE_URL(auctionId)}/submit`, {
      teamId,
      bids,
    });

    return data;
  },

  /**
   * Organizer closes submissions.
   */
  async closeSubmissions(auctionId) {
    const { data } = await api.post(`${BASE_URL(auctionId)}/close`);
    return data;
  },

  /**
   * Organizer awards a player to one of the bidding teams.
   */
  async awardPlayer(auctionId, playerId, teamId, remarks = "") {
    const { data } = await api.post(`${BASE_URL(auctionId)}/award`, {
      playerId,
      teamId,
      remarks,
    });

    return data;
  },

  /**
   * Organizer updates category bid limits.
   */
  async updateCategoryLimits(auctionId, categoryLimits) {
    const { data } = await api.patch(`${BASE_URL(auctionId)}/limits`, {
      categoryLimits,
    });

    return data;
  },

  /**
   * Organizer updates a player's custom bid limits.
   */
  async updatePlayerLimits(auctionId, playerId, limits) {
    const { data } = await api.patch(`${BASE_URL(auctionId)}/player-limits`, {
      playerId,
      min: limits.min,
      max: limits.max,
    });

    return data;
  },

  /**
   * Organizer removes a player's custom bid limits.
   * The category limits will apply again.
   */
  async removePlayerLimits(auctionId, playerId) {
    const { data } = await api.delete(
      `${BASE_URL(auctionId)}/player-limits/${playerId}`,
    );

    return data;
  },
};

function getMaxSquadSize(tournament) {
  return Math.min(13, Number(tournament.squadSize || 13));
}

function assertTeamHasRoom(team, tournament) {
  const maxSquadSize = getMaxSquadSize(tournament);
  const currentSize = (team.squad || []).length;

  if (currentSize >= maxSquadSize) {
    throw fail(`Team squad is full. Maximum size is ${maxSquadSize}.`, 409);
  }
}

export default directAuctionService;
