/** Extract an event from the publicly rendered Nuxt payload. */
export function parseReclubHtml(html) {
  const match = html.match(/<script\b(?=[^>]*\bid=["']__NUXT_DATA__["'])[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error('Tournament data is unavailable');
  const data = JSON.parse(match[1]);
  if (!Array.isArray(data)) throw new Error('Unexpected tournament data');
  const event = data.find(x => x && !Array.isArray(x) && typeof x === 'object' && 'participants' in x && 'startDatetime' in x && 'referenceCode' in x);
  if (!event) throw new Error('Tournament data is unavailable');
  const get = i => Number.isInteger(i) && i >= 0 ? data[i] : null;
  const participantsWrapper = get(event.participants);
  const participants = Array.isArray(participantsWrapper) && participantsWrapper[0] === 'Reactive' ? get(participantsWrapper[1]) : participantsWrapper;
  if (!Array.isArray(participants)) throw new Error('Participants unavailable');
  const profiles = data.find(x => x && !Array.isArray(x) && typeof x === 'object' && Object.keys(x).some(k => /^\d+$/.test(k)) && Object.values(x).some(i => { const p = get(i); return p && typeof p === 'object' && 'userId' in p && 'imageUrl' in p; }));
  if (!profiles) throw new Error('Player profiles unavailable');
  const players = participants.map(get).filter(p => p && get(p.status) === 1).map(p => {
    const id = String(get(p.referenceId)); const profile = get(profiles[id]);
    return profile ? {id, name: get(profile.name), avatar: get(profile.imageUrl)} : null;
  }).filter(Boolean);
  const timestamp = get(event.startDatetime);
  if (typeof timestamp !== 'number') throw new Error('Start time unavailable');
  return {title: get(event.name), start: new Date(timestamp * 1000).toISOString(), players};
}
export function validateReclubUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'reclub.co' || url.port || url.username || url.password || !/^\/(?:[a-z]{2}\/)?m\/[A-Za-z0-9]+\/?$/.test(url.pathname)) throw new Error('Enter a valid Reclub tournament link');
  return url.toString();
}
