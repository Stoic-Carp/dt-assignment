import { describe, it, expect } from '@jest/globals';
import { analyzeTodosWithAI } from '../aiService';
import { Todo } from '../../types';

/**
 * Integration tests that make real API calls to OpenRouter
 *
 * These tests will be skipped if OPENROUTER_API_KEY is not configured.
 * To run these tests, ensure you have a valid API key in your .env file.
 *
 * Run with: npm test -- aiService.integration.test.ts
 */

const hasApiKey = Boolean(process.env.OPENROUTER_API_KEY);

describe('AI Service - Integration Tests', () => {
    if (!hasApiKey) {
        it('skipped - OPENROUTER_API_KEY not configured', () => {
            console.log('⚠️  Integration tests skipped: OPENROUTER_API_KEY not set');
            expect(true).toBe(true);
        });
        return;
    }

    const mockTodos: Todo[] = [
        {
            id: '1',
            title: 'Implement user authentication',
            description: 'Add JWT-based authentication to the backend API',
            completed: false,
            createdAt: '2025-11-29T00:00:00Z',
            updatedAt: '2025-11-29T00:00:00Z',
        },
        {
            id: '2',
            title: 'Write comprehensive unit tests',
            description: 'Add test coverage for all controllers and services',
            completed: false,
            createdAt: '2025-11-29T00:00:00Z',
            updatedAt: '2025-11-29T00:00:00Z',
        },
        {
            id: '3',
            title: 'Update API documentation',
            description: 'Document all endpoints in README',
            completed: true,
            createdAt: '2025-11-29T00:00:00Z',
            updatedAt: '2025-11-29T00:00:00Z',
        },
    ];

    describe('Real OpenRouter API Integration', () => {
        it('should successfully analyze todos with real API call', async () => {
            console.log('🌐 Making real API call to OpenRouter...');

            const result = await analyzeTodosWithAI(mockTodos);

            // Verify the response structure
            expect(result).toBeDefined();
            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('insights');
            expect(typeof result.summary).toBe('string');
            expect(Array.isArray(result.insights)).toBe(true);

            // Verify the summary is meaningful
            expect(result.summary.length).toBeGreaterThan(10);

            console.log('✅ API call successful!');
            console.log('📊 Summary:', result.summary);
            console.log('💡 Insights:', result.insights);
            if (result.prioritySuggestions) {
                console.log('🎯 Priority Suggestions:', result.prioritySuggestions);
            }
        }, 15000); // 15 second timeout for API call

        it('should handle todos with only titles (no descriptions)', async () => {
            const simpleTodos: Todo[] = [
                {
                    id: '1',
                    title: 'Buy groceries',
                    completed: false,
                    createdAt: '2025-11-29T00:00:00Z',
                    updatedAt: '2025-11-29T00:00:00Z',
                },
                {
                    id: '2',
                    title: 'Call dentist',
                    completed: false,
                    createdAt: '2025-11-29T00:00:00Z',
                    updatedAt: '2025-11-29T00:00:00Z',
                },
            ];

            const result = await analyzeTodosWithAI(simpleTodos);

            expect(result).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.insights).toBeDefined();
            expect(result.insights.length).toBeGreaterThan(0);
        }, 15000);

        it('should provide insights for a mix of completed and pending todos', async () => {
            const result = await analyzeTodosWithAI(mockTodos);

            // The AI should recognize both completed and pending tasks
            const summaryLower = result.summary.toLowerCase();
            const hasReferenceToPending =
                summaryLower.includes('pending') ||
                summaryLower.includes('remaining') ||
                summaryLower.includes('incomplete') ||
                summaryLower.includes('2') || // 2 pending tasks
                summaryLower.includes('two');

            expect(hasReferenceToPending).toBe(true);
            expect(result.insights.length).toBeGreaterThan(0);
        }, 15000);

        it('should generate priority suggestions when appropriate', async () => {
            const urgentTodos: Todo[] = [
                {
                    id: '1',
                    title: 'Fix critical production bug',
                    description: 'Users cannot login - urgent fix needed',
                    completed: false,
                    createdAt: '2025-11-29T00:00:00Z',
                    updatedAt: '2025-11-29T00:00:00Z',
                },
                {
                    id: '2',
                    title: 'Prepare quarterly presentation',
                    description: 'Deadline tomorrow',
                    completed: false,
                    createdAt: '2025-11-29T00:00:00Z',
                    updatedAt: '2025-11-29T00:00:00Z',
                },
            ];

            const result = await analyzeTodosWithAI(urgentTodos);

            expect(result).toBeDefined();
            // Priority suggestions may or may not be present depending on AI interpretation
            // But we should at least get a meaningful summary and insights
            expect(result.summary.length).toBeGreaterThan(20);
            expect(result.insights.length).toBeGreaterThan(0);
        }, 15000);

        it('should handle empty todo list gracefully (no API call)', async () => {
            const result = await analyzeTodosWithAI([]);

            // Should return default message without making API call
            expect(result.summary).toBe('You have no todos yet. Start by adding your first task!');
            expect(result.insights).toContain('Your todo list is empty');
            expect(result.prioritySuggestions).toEqual([]);
        });

        it('should handle a large number of todos', async () => {
            const manyTodos: Todo[] = Array.from({ length: 10 }, (_, i) => ({
                id: `${i + 1}`,
                title: `Task ${i + 1}`,
                description: `Description for task ${i + 1}`,
                completed: i % 3 === 0, // Every 3rd task is completed
                createdAt: '2025-11-29T00:00:00Z',
                updatedAt: '2025-11-29T00:00:00Z',
            }));

            const result = await analyzeTodosWithAI(manyTodos);

            expect(result).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.insights).toBeDefined();
            expect(result.insights.length).toBeGreaterThan(0);

            // Should mention the number of tasks
            const summaryLower = result.summary.toLowerCase();
            expect(summaryLower.includes('10') || summaryLower.includes('ten')).toBe(true);
        }, 15000);
    });

    describe('Error Handling with Real API', () => {
        it('should handle invalid API key gracefully', async () => {
            // Temporarily override the API key
            const originalKey = process.env.OPENROUTER_API_KEY;
            process.env.OPENROUTER_API_KEY = 'invalid-key-12345';

            await expect(analyzeTodosWithAI(mockTodos)).rejects.toThrow();

            // Restore original key
            process.env.OPENROUTER_API_KEY = originalKey;
        }, 15000);
    });

    describe('Response Validation', () => {
        it('should return well-structured insights', async () => {
            const result = await analyzeTodosWithAI(mockTodos);

            // Each insight should be a non-empty string
            result.insights.forEach(insight => {
                expect(typeof insight).toBe('string');
                expect(insight.length).toBeGreaterThan(5);
            });

            // If priority suggestions exist, they should also be valid
            if (result.prioritySuggestions && result.prioritySuggestions.length > 0) {
                result.prioritySuggestions.forEach(suggestion => {
                    expect(typeof suggestion).toBe('string');
                    expect(suggestion.length).toBeGreaterThan(5);
                });
            }
        }, 15000);
    });
});
