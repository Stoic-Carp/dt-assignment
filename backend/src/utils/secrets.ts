/**
 * Utility for fetching secrets from AWS Secrets Manager
 * 
 * This module provides secure access to API keys and other sensitive
 * configuration stored in AWS Secrets Manager, with caching to avoid
 * unnecessary API calls.
 */

import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// Cache for secrets to avoid repeated API calls
const secretsCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get OpenRouter API key from environment or Secrets Manager.
 * 
 * Behavior:
 * - If OPENROUTER_API_KEY is set in environment, use it directly (for local dev)
 * - If OPENROUTER_SECRET_NAME is set, fetch from AWS Secrets Manager
 * - Otherwise, throw an error
 * 
 * @returns The OpenRouter API key
 * @throws Error if API key is not configured
 */
export async function getOpenRouterApiKey(): Promise<string> {
    // For local development or if key is provided directly
    const directKey = process.env.OPENROUTER_API_KEY;
    if (directKey) {
        return directKey;
    }

    // For AWS deployment, fetch from Secrets Manager
    const secretName = process.env.OPENROUTER_SECRET_NAME;
    if (secretName) {
        return await getSecretValue(secretName);
    }

    throw new Error(
        "OPENROUTER_API_KEY is not configured. " +
        "Set OPENROUTER_API_KEY env var for local dev, or " +
        "OPENROUTER_SECRET_NAME for AWS deployment."
    );
}

/**
 * Fetch a secret value from AWS Secrets Manager with caching.
 * 
 * @param secretName - The name/ARN of the secret in Secrets Manager
 * @returns The secret value as a string
 * @throws Error if secret cannot be retrieved
 */
async function getSecretValue(secretName: string): Promise<string> {
    // Check cache first
    const cached = secretsCache.get(secretName);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
        return cached.value;
    }

    // Fetch from Secrets Manager
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    const client = new SecretsManagerClient({ region });

    try {
        const command = new GetSecretValueCommand({
            SecretId: secretName,
        });

        const response = await client.send(command);

        if (!response.SecretString) {
            throw new Error(`Secret ${secretName} has no string value`);
        }

        // Cache the result
        secretsCache.set(secretName, {
            value: response.SecretString,
            timestamp: now,
        });

        return response.SecretString;
    } catch (error) {
        console.error(`Failed to fetch secret ${secretName}:`, error);
        throw new Error(`Failed to retrieve secret from AWS Secrets Manager: ${secretName}`);
    }
}

