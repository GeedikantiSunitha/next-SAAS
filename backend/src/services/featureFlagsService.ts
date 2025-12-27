/**
 * Feature Flags Service
 * 
 * Manages feature flags from environment variables with caching support.
 * Feature flags are read from environment variables prefixed with "FEATURE_"
 * 
 * Example:
 * - FEATURE_NEW_DASHBOARD=true → isFeatureEnabled('NEW_DASHBOARD') returns true
 * - FEATURE_API_VERSION=v2 → getFeatureFlag('API_VERSION') returns 'v2'
 */

// Cache for feature flags (simple in-memory cache)
const flagCache: Map<string, any> = new Map();
let cacheEnabled = true;

/**
 * Clear the feature flag cache
 */
export const clearCache = (): void => {
  flagCache.clear();
};

/**
 * Disable caching (useful for testing)
 */
export const disableCache = (): void => {
  cacheEnabled = false;
  clearCache();
};

/**
 * Enable caching
 */
export const enableCache = (): void => {
  cacheEnabled = true;
};

/**
 * Get the environment variable name for a feature flag
 */
const getEnvVarName = (flagName: string): string => {
  return `FEATURE_${flagName}`;
};

/**
 * Check if a feature is enabled
 * Returns true if FEATURE_{flagName} is set to "true" (case-insensitive)
 * Returns false otherwise
 */
export const isFeatureEnabled = (flagName: string): boolean => {
  const cacheKey = `enabled:${flagName}`;
  
  if (cacheEnabled && flagCache.has(cacheKey)) {
    return flagCache.get(cacheKey);
  }

  const envVar = getEnvVarName(flagName);
  const value = process.env[envVar];
  
  const result = value?.toLowerCase() === 'true';
  
  if (cacheEnabled) {
    flagCache.set(cacheKey, result);
  }
  
  return result;
};

/**
 * Get a feature flag value as string
 * Returns the value of FEATURE_{flagName} or default if not set
 */
export const getFeatureFlag = (flagName: string, defaultValue: string | null = null): string | null => {
  const cacheKey = `flag:${flagName}`;
  
  if (cacheEnabled && flagCache.has(cacheKey)) {
    return flagCache.get(cacheKey);
  }

  const envVar = getEnvVarName(flagName);
  const value = process.env[envVar];
  
  const result = value || defaultValue;
  
  if (cacheEnabled && result !== null) {
    flagCache.set(cacheKey, result);
  }
  
  return result;
};

/**
 * Get a feature flag value as number
 * Returns the numeric value of FEATURE_{flagName} or default if not set/invalid
 */
export const getFeatureFlagAsNumber = (flagName: string, defaultValue: number | null = null): number | null => {
  const cacheKey = `number:${flagName}`;
  
  if (cacheEnabled && flagCache.has(cacheKey)) {
    return flagCache.get(cacheKey);
  }

  const envVar = getEnvVarName(flagName);
  const value = process.env[envVar];
  
  if (!value) {
    if (cacheEnabled && defaultValue !== null) {
      flagCache.set(cacheKey, defaultValue);
    }
    return defaultValue;
  }

  const numValue = Number(value);
  const result = isNaN(numValue) ? defaultValue : numValue;
  
  if (cacheEnabled && result !== null) {
    flagCache.set(cacheKey, result);
  }
  
  return result;
};

/**
 * Get a feature flag value as boolean
 * Returns true if FEATURE_{flagName} is "true" (case-insensitive), false otherwise
 * Returns default if flag is not set
 */
export const getFeatureFlagAsBoolean = (flagName: string, defaultValue: boolean | null = null): boolean | null => {
  const cacheKey = `boolean:${flagName}`;
  
  if (cacheEnabled && flagCache.has(cacheKey)) {
    return flagCache.get(cacheKey);
  }

  const envVar = getEnvVarName(flagName);
  const value = process.env[envVar];
  
  if (!value) {
    if (cacheEnabled && defaultValue !== null) {
      flagCache.set(cacheKey, defaultValue);
    }
    return defaultValue;
  }

  const result = value.toLowerCase() === 'true';
  
  if (cacheEnabled) {
    flagCache.set(cacheKey, result);
  }
  
  return result;
};

/**
 * Get all feature flags as an object
 * Returns an object with all FEATURE_* environment variables
 */
export const getAllFeatureFlags = (): Record<string, any> => {
  const flags: Record<string, any> = {};
  
  // Get all environment variables that start with FEATURE_
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('FEATURE_')) {
      const flagName = key.substring(8); // Remove "FEATURE_" prefix
      const value = process.env[key];
      
      // Try to determine type and convert
      if (value?.toLowerCase() === 'true' || value?.toLowerCase() === 'false') {
        flags[flagName] = value.toLowerCase() === 'true';
      } else if (value && !isNaN(Number(value))) {
        flags[flagName] = Number(value);
      } else {
        flags[flagName] = value || null;
      }
    }
  });
  
  return flags;
};

