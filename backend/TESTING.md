# Testing Guide

This document describes the testing strategy and how to run tests for the backend.

## Test Types

### Unit Tests (Mocked)

Unit tests use mocked dependencies and do not make real API calls. They run quickly and are suitable for CI/CD pipelines.

**Location**: `src/**/__tests__/*.test.ts`

**Run unit tests:**
```bash
npm test                 # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

**Coverage:**
- AI Service: 10 tests
- AI Controller: 8 tests
- **Total: 18 unit tests**

### Integration Tests (Real API Calls)

Integration tests make **real API calls to OpenRouter** and test the full request/response cycle. These tests require:
- Valid `OPENROUTER_API_KEY` in `.env` file
- Active internet connection
- OpenRouter API availability

**Location**: `src/**/__tests__/*.integration.test.ts`

**Run integration tests:**
```bash
npm run test:integration    # Run integration tests only
npm run test:all           # Run both unit and integration tests
```

**Important Notes:**
- Integration tests will be **skipped** if `OPENROUTER_API_KEY` is not configured
- Tests may fail with **429 (Rate Limited)** if you run them too frequently
- Each test makes a real API call and can take 5-15 seconds
- Costs apply based on your OpenRouter API usage

**Coverage:**
- AI Service Integration: 8 tests (real API calls)
- AI Controller Integration: 9 tests (HTTP requests + real API calls)
- **Total: 17 integration tests**

## Test Results Example

### Successful Integration Test Output

```
✅ HTTP request successful!
📊 Response: {
  "summary": "You have 2 remaining development tasks...",
  "insights": [
    "The authentication task is complex and would benefit from being broken into smaller subtasks",
    "Testing should ideally happen before deployment for new security features"
  ],
  "prioritySuggestions": [
    "Prioritize authentication implementation as it's critical for security",
    "Complete unit tests for authentication after implementation"
  ]
}
```

### Rate Limiting (Expected)

If you see `429 Too Many Requests` errors, this is **normal** when running many tests quickly. The free tier of OpenRouter has rate limits. Solutions:

1. **Wait a few minutes** between test runs
2. **Run specific tests** instead of all at once:
   ```bash
   jest aiService.integration.test.ts -t "should successfully analyze todos"
   ```
3. **Use a paid API key** with higher rate limits

## Test Scripts Summary

| Script | Description | API Calls |
|--------|-------------|-----------|
| `npm test` | Unit tests only (mocked) | ❌ No |
| `npm run test:watch` | Unit tests in watch mode | ❌ No |
| `npm run test:coverage` | Unit tests with coverage | ❌ No |
| `npm run test:integration` | Integration tests (real API) | ✅ Yes |
| `npm run test:all` | All tests | ✅ Yes |

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, jest } from '@jest/globals';

// Mock dependencies
jest.mock('module-name');

describe('Feature', () => {
    it('should do something', () => {
        // Arrange
        const input = 'test';

        // Act
        const result = functionUnderTest(input);

        // Assert
        expect(result).toBe('expected');
    });
});
```

### Integration Test Template

```typescript
import { describe, it, expect } from '@jest/globals';

const hasApiKey = Boolean(process.env.OPENROUTER_API_KEY);

describe('Feature - Integration', () => {
    if (!hasApiKey) {
        it('skipped - API key not configured', () => {
            expect(true).toBe(true);
        });
        return;
    }

    it('should work with real API', async () => {
        // Make real API call
        const result = await realApiFunction();

        // Verify real response
        expect(result).toBeDefined();
    }, 15000); // Longer timeout for API calls
});
```

## CI/CD Recommendations

### For CI Pipelines

Run **unit tests only** in CI to avoid:
- API costs
- Rate limiting issues
- Network dependency

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test  # Unit tests only
```

### For Manual Testing

Run **integration tests** manually before:
- Major releases
- Deploying to production
- Changing AI integration logic

```bash
npm run test:integration
```

## Troubleshooting

### "OPENROUTER_API_KEY is not configured"

**Solution**: Create a `.env` file in `/backend` with your API key:
```bash
cp .env.example .env
# Edit .env and add your OpenRouter API key
```

### "429 Too Many Requests"

**Solution**: You're hitting OpenRouter's rate limit. Wait 1-5 minutes and try again, or run fewer tests at once.

### "Network request failed"

**Solution**: Check your internet connection and verify OpenRouter is accessible:
```bash
curl https://openrouter.ai/api/v1/models
```

### Tests timing out

**Solution**: Increase the timeout in individual tests:
```typescript
it('slow test', async () => {
    // test code
}, 30000); // 30 second timeout
```

## Best Practices

1. **Run unit tests frequently** during development
2. **Run integration tests** before pushing to main branch
3. **Don't commit API keys** - use `.env` files
4. **Monitor API usage** at https://openrouter.ai/dashboard
5. **Use test:watch** for rapid feedback during development
6. **Check coverage** regularly: `npm run test:coverage`

## Test Coverage Goals

- **Unit Test Coverage**: 80%+ for all services and controllers
- **Integration Tests**: Cover all critical paths and edge cases
- **Error Handling**: Test all error scenarios (timeouts, invalid keys, rate limits)
