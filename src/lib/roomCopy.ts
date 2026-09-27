// Gästtexter om lager — en källa så rumstabell, checkout och server action
// säger exakt samma sak om hur många rum som finns kvar.

export function roomsLeftMessage(available: number, requested: number, roomName: string): string {
  if (available <= 0) return `The ${roomName} is sold out for those dates.`;
  return `Only ${available} left of the ${roomName} for those dates — you asked for ${requested}.`;
}

// Knapphetsetikett i rumstabellen (booking.com: "Only 2 left"). Visas bara
// när få rum återstår, aldrig som påhittad brådska.
export const FEW_LEFT_THRESHOLD = 3;

export function scarcityLabel(available: number | null): string | null {
  if (available === null) return null;
  if (available <= 0) return "Sold out";
  if (available <= FEW_LEFT_THRESHOLD) return `Only ${available} left`;
  return null;
}
