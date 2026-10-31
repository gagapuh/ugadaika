/** Domain rules shared by the application and tests. */
export const CLOSE_DELAY_MS = 20 * 60 * 1000;
export function closesAt(start) {
  const time = new Date(start).getTime();
  if (!Number.isFinite(time)) throw new Error('Invalid event start');
  return time + CLOSE_DELAY_MS;
}
export function validatePrediction({name, picks, players, start, now = Date.now()}) {
  if (!name || typeof name !== 'string' || !name.trim() || name.trim().length > 80) throw new Error('Enter your name');
  if (!Array.isArray(players) || players.length !== 9 || new Set(players).size !== 9) throw new Error('A tournament requires nine unique players');
  if (!Array.isArray(picks) || picks.length !== 3 || new Set(picks).size !== 3 || picks.some(p => !players.includes(p))) throw new Error('Choose three different players');
  if (now >= closesAt(start)) throw new Error('Predictions are closed');
  return {name: name.trim(), picks};
}
/** Results map player IDs to their official rank; tied ranks are supported. */
export function scorePrediction(picks, ranks) {
  if (!Array.isArray(picks) || picks.length !== 3) throw new Error('Expected three picks');
  return picks.reduce((score, id, index) => {
    const rank = ranks[id];
    return score + (rank === index + 1 ? 3 : Number.isInteger(rank) && rank >= 1 && rank <= 3 ? 1 : 0);
  }, 0);
}
