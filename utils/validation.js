/**
 * Validation utility functions
 * Used for validating user input in forms (username, password, etc.)
 */

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateUsername = (username) => {
  if (!username || username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  return null;
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  // Check for capital letter
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one capital letter';
  }
  // Check for symbol (non-alphanumeric character)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one symbol';
  }
  return null;
};
