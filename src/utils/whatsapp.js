export function sendOnboardingWhatsApp({ employee, company, program, url, pct }) {
  const firstName = employee?.name?.split(' ')[0] || 'there'
  const companyName = company?.name || 'the team'
  const programName = program?.name || 'your onboarding program'

  let message
  if (pct === undefined || pct === null) {
    message = `Hi ${firstName}! Here's your onboarding link for ${companyName} — no login needed, just tap and go: ${url}`
  } else if (pct === 0) {
    message = `Hi ${firstName}! Welcome to ${companyName} 🎉 Here's your onboarding link for "${programName}" — no login needed, just tap and go: ${url}`
  } else if (pct >= 100) {
    message = `Hi ${firstName}! Just confirming your onboarding for "${programName}" is fully complete. Great work! ${url}`
  } else {
    message = `Hi ${firstName}, just checking in on your onboarding at ${companyName} — you're at ${pct}% on "${programName}". Here's your link again if you need it: ${url}`
  }

  const digits = (employee?.phone || '').replace(/\D/g, '')
  const waUrl = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(waUrl, '_blank', 'noopener')
}
