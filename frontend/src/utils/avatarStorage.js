// Utility for storing and synchronizing user profile avatar preview
// Persists client-side and dispatches sync events across components
const AVATAR_KEY_PREFIX = 'medflow_avatar_';

export function getStoredAvatar(userId) {
  if (!userId) return null;
  try {
    return localStorage.getItem(`${AVATAR_KEY_PREFIX}${userId}`) || null;
  } catch {
    return null;
  }
}

export function saveStoredAvatar(userId, dataUrl) {
  if (!userId) return;
  try {
    if (dataUrl) {
      localStorage.setItem(`${AVATAR_KEY_PREFIX}${userId}`, dataUrl);
    } else {
      localStorage.removeItem(`${AVATAR_KEY_PREFIX}${userId}`);
    }
    // Broadcast avatar change event across tabs/components
    window.dispatchEvent(
      new CustomEvent('medflow-avatar-updated', {
        detail: { userId, dataUrl: dataUrl || null },
      })
    );
  } catch (err) {
    console.warn('Unable to persist avatar to localStorage:', err);
  }
}
