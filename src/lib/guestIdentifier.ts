// Generate or retrieve guest identifier
// This creates a persistent identifier for guest users across sessions

const GUEST_ID_KEY = 'trailerhub_guest_id';

export const getOrCreateGuestIdentifier = (): string => {
  // Try to get from localStorage first
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  
  if (!guestId) {
    // Generate new guest ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    guestId = `guest_${timestamp}_${random}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  
  return guestId;
};

export const getGuestIdentifier = (): string | null => {
  return localStorage.getItem(GUEST_ID_KEY);
};

