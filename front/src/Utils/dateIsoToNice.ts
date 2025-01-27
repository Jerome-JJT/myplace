
function toLocalIso(input: string | number): string {
  const date = new Date(input);
  // const tzo = -date.getTimezoneOffset();
  // const dif = tzo >= 0 ? '+' : '-';
  const pad = function (num: number) {
    return (num < 10 ? '0' : '') + num;
  };

  return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds()) +
      '.' + pad(date.getMilliseconds()) + 'Z';
}

export function dateIsoToNice(isoDate: string | number): string {
  const loc = toLocalIso(isoDate);
  return loc.substring(0, loc.indexOf('.')).replace('T', ' ');
}

