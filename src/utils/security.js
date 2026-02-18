import * as yup from "yup";

// Input sanitization function
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  // Remove any HTML tags and potentially dangerous characters
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>]/g, "") // Remove any remaining < or >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/onerror=/gi, "") // Remove onerror attributes
    .replace(/onload=/gi, "") // Remove onload attributes
    .replace(/onclick=/gi, "") // Remove onclick attributes
    .replace(/onmouseover=/gi, "") // Remove onmouseover attributes
    .replace(/onfocus=/gi, "") // Remove onfocus attributes
    .replace(/onblur=/gi, "") // Remove onblur attributes
    .replace(/onchange=/gi, "") // Remove onchange attributes
    .replace(/onsubmit=/gi, "") // Remove onsubmit attributes
    .replace(/onreset=/gi, "") // Remove onreset attributes
    .replace(/onselect=/gi, "") // Remove onselect attributes
    .replace(/onkeydown=/gi, "") // Remove onkeydown attributes
    .replace(/onkeypress=/gi, "") // Remove onkeypress attributes
    .replace(/onkeyup=/gi, "") // Remove onkeyup attributes
    .trim();
};

// Email validation with additional security checks
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;

  // Additional checks for common email abuse patterns
  const suspiciousPatterns = [
    /\.\./, // Consecutive dots
    /^\./, // Starting with dot
    /\.$/, // Ending with dot
    /[^\x00-\x7F]/, // Non-ASCII characters
    /[\s]/, // Whitespace
    /[<>]/, // HTML tags
    /['"]/, // Quotes
    /[()]/, // Parentheses
    /[;,]/, // Semicolons and commas
  ];

  return !suspiciousPatterns.some((pattern) => pattern.test(email));
};

// Password strength validation
export const validatePasswordStrength = (password) => {
  const checks = {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    minLength: password.length >= 8,
    maxLength: password.length <= 128,
    noCommonPatterns:
      !/(password|123456|qwerty|admin|letmein|welcome|monkey|dragon|baseball|football|master|hello|abc123|shadow|sunshine|iloveyou|princess)/i.test(
        password,
      ),
    noSequentialChars:
      !/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
        password,
      ),
    noRepeatedChars: !/(.)\1{2,}/.test(password), // No character repeated 3+ times
  };

  const strengthScore = Object.values(checks).filter(Boolean).length;

  return {
    isValid: strengthScore >= 6, // Require at least 6 criteria
    strengthScore,
    checks,
    message: getPasswordStrengthMessage(checks),
  };
};

const getPasswordStrengthMessage = (checks) => {
  const missingRequirements = [];
  if (!checks.hasUpperCase) missingRequirements.push("uppercase letter");
  if (!checks.hasLowerCase) missingRequirements.push("lowercase letter");
  if (!checks.hasNumbers) missingRequirements.push("number");
  if (!checks.hasSpecialChar) missingRequirements.push("special character");
  if (!checks.minLength) missingRequirements.push("minimum 8 characters");
  if (!checks.maxLength) missingRequirements.push("maximum 128 characters");
  if (!checks.noCommonPatterns) missingRequirements.push("no common passwords");
  if (!checks.noSequentialChars)
    missingRequirements.push("no sequential characters");
  if (!checks.noRepeatedChars)
    missingRequirements.push("no repeated characters");

  if (missingRequirements.length === 0) return "Strong password";
  return `Password must include: ${missingRequirements.join(", ")}`;
};

// Rate limiting for failed attempts
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  check(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];

    // Clean old attempts
    const recentAttempts = userAttempts.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    this.attempts.set(key, recentAttempts);

    return {
      allowed: recentAttempts.length < this.maxAttempts,
      remaining: Math.max(0, this.maxAttempts - recentAttempts.length),
      resetTime:
        recentAttempts.length > 0
          ? new Date(recentAttempts[0] + this.windowMs)
          : new Date(now + this.windowMs),
    };
  }

  increment(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    userAttempts.push(now);
    this.attempts.set(key, userAttempts);
  }

  reset(key) {
    this.attempts.delete(key);
  }
}

// CSRF Token generation and validation
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  // Store with expiry (1 hour)
  const tokenData = {
    token,
    expires: Date.now() + 60 * 60 * 1000,
  };

  sessionStorage.setItem("csrf_token", JSON.stringify(tokenData));
  return token;
};

export const validateCSRFToken = (token) => {
  const storedData = sessionStorage.getItem("csrf_token");
  if (!storedData) return false;

  try {
    const { token: storedToken, expires } = JSON.parse(storedData);
    return storedToken === token && Date.now() < expires;
  } catch {
    return false;
  }
};

// Session timeout management
export const setupSessionTimeout = (timeoutMinutes = 30, onTimeout) => {
  let timeoutId;
  let warningTimeoutId;

  const showWarning = () => {
    // You can implement a warning modal here
    console.log("Session will expire in 1 minute");
  };

  const resetTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (warningTimeoutId) clearTimeout(warningTimeoutId);

    warningTimeoutId = setTimeout(
      showWarning,
      (timeoutMinutes - 1) * 60 * 1000,
    );
    timeoutId = setTimeout(
      () => {
        onTimeout();
      },
      timeoutMinutes * 60 * 1000,
    );
  };

  // Reset timeout on user activity
  ["mousedown", "keydown", "scroll", "touchstart", "mousemove"].forEach(
    (event) => {
      document.addEventListener(event, resetTimeout, { passive: true });
    },
  );

  resetTimeout();

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (warningTimeoutId) clearTimeout(warningTimeoutId);
    ["mousedown", "keydown", "scroll", "touchstart", "mousemove"].forEach(
      (event) => {
        document.removeEventListener(event, resetTimeout);
      },
    );
  };
};

// Validation schemas using yup
export const loginValidationSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .test("secure-email", "Invalid email format", (value) =>
      validateEmail(value),
    )
    .max(255, "Email is too long"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

export const registerValidationSchema = yup.object({
  name: yup
    .string()
    .required("Full name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .matches(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens and apostrophes",
    )
    .test(
      "no-xss",
      "Invalid characters detected",
      (value) => !/[<>]/.test(value),
    ),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .test("secure-email", "Invalid email format", (value) =>
      validateEmail(value),
    )
    .max(255, "Email is too long"),
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}$/,
      "Please enter a valid phone number",
    )
    .max(20, "Phone number is too long")
    .test(
      "no-xss",
      "Invalid characters detected",
      (value) => !/[<>]/.test(value),
    ),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .test(
      "password-strength",
      "Password is not strong enough",
      (value) => validatePasswordStrength(value).isValid,
    ),
  rePassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

// Encryption helper (basic - for production, use a proper encryption library)
export const encryptData = (data) => {
  try {
    // Simple base64 encoding - replace with actual encryption in production
    return btoa(JSON.stringify(data));
  } catch {
    return null;
  }
};

export const decryptData = (encryptedData) => {
  try {
    // Simple base64 decoding - replace with actual decryption in production
    return JSON.parse(atob(encryptedData));
  } catch {
    return null;
  }
};

// Security headers checker
export const checkSecurityHeaders = () => {
  const securityHeaders = [
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ];

  // This would need to be implemented on the server side
  console.log("Security headers should be set on the server");
};

// Create rate limiter instances
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const registerRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
