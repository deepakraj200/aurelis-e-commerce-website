export const passwordRules = (value: string) => [
  { label: '8+ characters', met: value.length >= 8 },
  { label: 'Upper & lowercase', met: /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: 'A number', met: /\d/.test(value) },
];

export const passwordScore = (value: string) => {
  const rules = passwordRules(value);
  let score = rules.filter((rule) => rule.met).length;
  if (value.length >= 12) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(5, score);
};
