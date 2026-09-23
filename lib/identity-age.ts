/**
 * What 360dep keeps from the date of birth on a CCCD: whether the person is 18
 * or over, and the year they were born. Never the date itself -- a full date of
 * birth next to a verified name is most of an identity, and nothing here needs it.
 *
 * `today` is the civil date in Vietnam (yyyy-mm-dd), passed in so the rule can be
 * tested on any day.
 */
export function ageFromCard(dateOfBirth: string, today: string): { adult: boolean; birthYear: number } | null {
  const match = dateOfBirth.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (!match) return null
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])]
  // Reject dates that do not exist (31/02), which a misread card can produce.
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null

  const [ty, tm, td] = today.split("-").map(Number)
  if (year < 1900 || year > ty) return null
  const birthdayPassed = tm > month || (tm === month && td >= day)
  const age = ty - year - (birthdayPassed ? 0 : 1)
  if (age < 0) return null
  return { adult: age >= 18, birthYear: year }
}
