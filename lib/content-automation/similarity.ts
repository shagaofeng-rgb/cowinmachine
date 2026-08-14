const normalizedTokens = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((token) => token.length > 2);

export function tokenSimilarity(first: string, second: string) {
  const a = new Set(normalizedTokens(first));
  const b = new Set(normalizedTokens(second));
  const union = new Set([...a, ...b]).size;
  if (!union) return 0;
  return [...a].filter((token) => b.has(token)).length / union;
}

export function ngramSimilarity(first: string, second: string, size = 3) {
  const grams = (value: string) => {
    const tokens = normalizedTokens(value);
    return new Set(tokens.slice(0, 600).flatMap((_, index) => index + size <= tokens.length ? [tokens.slice(index, index + size).join(" ")] : []));
  };
  const a = grams(first); const b = grams(second); const union = new Set([...a, ...b]).size;
  return union ? [...a].filter((gram) => b.has(gram)).length / union : 0;
}
