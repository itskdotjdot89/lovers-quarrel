/**
 * Check if the microphone API is available in the current environment.
 * Returns false in environments where getUserMedia is not supported
 * (e.g., some native WebViews without proper plugins).
 */
export const isMicrophoneAvailable = (): boolean => {
  return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
};

/**
 * Attempt to get microphone access with proper error handling.
 * Returns the MediaStream on success, or null with a user-friendly message on failure.
 */
export const requestMicrophoneAccess = async (): Promise<MediaStream | null> => {
  if (!isMicrophoneAvailable()) {
    return null;
  }

  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      console.warn('[Microphone] Permission denied by user');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      console.warn('[Microphone] No microphone hardware found');
    } else {
      console.warn('[Microphone] Access failed:', error.message);
    }
    return null;
  }
};
