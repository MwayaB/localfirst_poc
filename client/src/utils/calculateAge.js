  export function calculateAge(birthdate) {
    const age = Date.now() - new Date(birthdate);
    return Math.floor(age / (1000 * 60 * 60 * 24 * 365.25));
  }
