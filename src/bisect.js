export function estimate(entries) {
  return Math.ceil(Math.log2(entries.length));
}

export async function bisect(fn, entries) {
  let from = 0;
  let to = entries.length - 1;
  let attempt = 0;

  while (from <= to) {
    attempt += 1;

    const mid = Math.floor((from + (to + 1)) / 2);
    const entry = entries[mid];

    const passed = await Promise.resolve(fn(entry, attempt));

    if (passed) {
      from = mid + 1;
    } else {
      to = mid - 1;
    }
  }

  return { lastGood: entries[to], firstBad: entries[from] };
}
