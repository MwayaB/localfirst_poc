  export function calculateAge(birthdate) {
    const age = Date.now() - new Date(birthdate);
    return Math.floor(age / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Helper: formats a Date object to 'HH:mm' 24-hour time string
export const toTimeString = (date) => {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
