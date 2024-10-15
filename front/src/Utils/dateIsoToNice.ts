
export function dateIsoToNice(isoDate: string): string {
  return isoDate.substring(0, isoDate.length - 5).replace('T', ' ');
}
