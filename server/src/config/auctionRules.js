export const AUCTION_RULES = Object.freeze({
  teamPurse: 50000,
  squadSize: 13,
  timerSeconds: 45,
  minimumReservePerSlot: 500,
  iconicLimit: 1,

  categoryBase: {
    ICONIC: 2000,
    A: 1500,
    B: 1000,
    C: 700,
    D: 500,
  },

  categoryMax: {
    ICONIC: 15000,
    A: 10000,
    B: 7000,
    C: 5000,
    D: 3000,
  },

  bidIncrement: {
    ICONIC: 500,
    A: 500,
    B: 500,
    C: 300,
    D: 200,
  },
});
