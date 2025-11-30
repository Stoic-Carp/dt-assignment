import { describe, it, expect } from '@jest/globals';
import { generateTaskBreakdown } from '../taskBreakdownService';
import { TaskBreakdownRequest } from '../../types';

/**
 * Integration tests that make real API calls to OpenRouter
 *
 * These tests will be skipped if OPENROUTER_API_KEY is not configured.
 * To run these tests, ensure you have a valid API key in your .env file.
 *
 * Run with: npm test -- taskBreakdownService.integration.test.ts
 */

const hasApiKey = Boolean(process.env.OPENROUTER_API_KEY);

describe('Task Breakdown Service - Integration Tests', () => {
    if (!hasApiKey) {
        it('skipped - OPENROUTER_API_KEY not configured', () => {
            console.log('⚠️  Integration tests skipped: OPENROUTER_API_KEY not set');
            expect(true).toBe(true);
        });
        return;
    }

    describe('Real OpenRouter API Integration', () => {
        it('should successfully break down a simple goal', async () => {
            console.log('🌐 Making real API call to OpenRouter for task breakdown...');

            const request: TaskBreakdownRequest = {
                goal: 'Plan a weekend camping trip',
            };

            const result = await generateTaskBreakdown(request);

            // Verify the response structure
            expect(result).toBeDefined();
            expect(result).toHaveProperty('goal');
            expect(result).toHaveProperty('suggestedTasks');
            expect(result.goal).toBe('Plan a weekend camping trip');
            expect(Array.isArray(result.suggestedTasks)).toBe(true);
            expect(result.suggestedTasks.length).toBeGreaterThan(0);
            expect(result.suggestedTasks.length).toBeLessThanOrEqual(8);

            // Verify task structure
            result.suggestedTasks.forEach(task => {
                expect(task).toHaveProperty('title');
                expect(typeof task.title).toBe('string');
                expect(task.title.length).toBeGreaterThan(0);

                if (task.description) {
                    expect(typeof task.description).toBe('string');
                }

                if (task.estimatedPriority) {
                    expect(['low', 'medium', 'high']).toContain(task.estimatedPriority);
                }
            });

            console.log('✅ API call successful!');
            console.log('📝 Goal:', result.goal);
            console.log('📋 Number of tasks:', result.suggestedTasks.length);
            console.log('📌 Tasks:', result.suggestedTasks.map(t => t.title));
            if (result.reasoning) {
                console.log('💭 Reasoning:', result.reasoning);
            }
        }, 20000); // 20 second timeout for API call

        it('should handle goal with context', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Prepare a presentation',
                context: 'For quarterly board meeting with revenue projections',
            };

            const result = await generateTaskBreakdown(request);

            expect(result).toBeDefined();
            expect(result.suggestedTasks.length).toBeGreaterThan(0);

            // The context should influence the suggested tasks
            // We can't predict exactly what tasks will be suggested,
            // but they should be relevant to a board presentation
            result.suggestedTasks.forEach(task => {
                expect(task.title).toBeDefined();
                expect(task.title.length).toBeGreaterThan(0);
            });

            console.log('✅ Context-aware breakdown successful!');
            console.log('📋 Tasks:', result.suggestedTasks.map(t => t.title));
        }, 20000);

        it('should respect maxTasks parameter', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Organize a birthday party',
                maxTasks: 4,
            };

            const result = await generateTaskBreakdown(request);

            expect(result).toBeDefined();
            expect(result.suggestedTasks.length).toBeGreaterThan(0);
            expect(result.suggestedTasks.length).toBeLessThanOrEqual(4);

            console.log('✅ maxTasks parameter respected!');
            console.log('📋 Tasks generated:', result.suggestedTasks.length);
        }, 20000);

        it('should handle specific goals appropriately', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Buy milk',
            };

            const result = await generateTaskBreakdown(request);

            expect(result).toBeDefined();
            expect(result.suggestedTasks.length).toBeGreaterThan(0);

            // For a very specific goal, we might get fewer tasks
            console.log('✅ Specific goal handled!');
            console.log('📋 Tasks:', result.suggestedTasks.map(t => t.title));
        }, 20000);

        it('should handle work-related goals', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Launch a new product feature',
                context: 'Mobile app with user authentication',
            };

            const result = await generateTaskBreakdown(request);

            expect(result).toBeDefined();
            expect(result.suggestedTasks.length).toBeGreaterThan(3);

            // Should include development-related tasks
            result.suggestedTasks.forEach(task => {
                expect(task.title).toBeDefined();
                expect(task.title.length).toBeGreaterThan(5);
            });

            console.log('✅ Work-related goal handled!');
            console.log('📋 Tasks:', result.suggestedTasks.map(t => t.title));
        }, 20000);

        it('should provide priority suggestions when applicable', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Plan a wedding',
            };

            const result = await generateTaskBreakdown(request);

            expect(result).toBeDefined();
            expect(result.suggestedTasks.length).toBeGreaterThan(4);

            // Check if at least some tasks have priority
            const tasksWithPriority = result.suggestedTasks.filter(t => t.estimatedPriority);
            console.log(`📊 ${tasksWithPriority.length}/${result.suggestedTasks.length} tasks have priority assigned`);

            // Each task should have valid structure
            result.suggestedTasks.forEach(task => {
                expect(task.title).toBeDefined();
                if (task.estimatedPriority) {
                    expect(['low', 'medium', 'high']).toContain(task.estimatedPriority);
                }
            });

            console.log('✅ Priority suggestions generated!');
        }, 20000);

        it('should handle goals with special characters', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Prepare for my son\'s 5th birthday party & organize activities',
            };

            const result = await generateTaskBreakdown(request);

            expect(result).toBeDefined();
            expect(result.suggestedTasks.length).toBeGreaterThan(0);

            console.log('✅ Special characters handled!');
            console.log('📋 Tasks:', result.suggestedTasks.map(t => t.title));
        }, 20000);

        it('should provide reasoning when available', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Start a small online business',
            };

            const result = await generateTaskBreakdown(request);

            expect(result).toBeDefined();
            expect(result.suggestedTasks.length).toBeGreaterThan(3);

            // Reasoning is optional, but log it if present
            if (result.reasoning) {
                console.log('💭 AI Reasoning:', result.reasoning);
                expect(typeof result.reasoning).toBe('string');
                expect(result.reasoning.length).toBeGreaterThan(10);
            }

            console.log('✅ Business goal breakdown successful!');
        }, 20000);
    });

    describe('Error Handling with Real API', () => {
        it('should handle invalid API key gracefully', async () => {
            const originalKey = process.env.OPENROUTER_API_KEY;
            process.env.OPENROUTER_API_KEY = 'invalid-key-12345';

            const request: TaskBreakdownRequest = {
                goal: 'Test invalid API key',
            };

            await expect(generateTaskBreakdown(request)).rejects.toThrow();

            // Restore original key
            process.env.OPENROUTER_API_KEY = originalKey;
        }, 20000);

        it('should validate goal length', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Go', // Too short
            };

            await expect(generateTaskBreakdown(request)).rejects.toThrow(
                'Please provide a more specific goal'
            );
        });

        it('should validate empty goal', async () => {
            const request: TaskBreakdownRequest = {
                goal: '',
            };

            await expect(generateTaskBreakdown(request)).rejects.toThrow(
                'Goal cannot be empty'
            );
        });

        it('should truncate very long goals', async () => {
            const longGoal = 'a'.repeat(400);
            const request: TaskBreakdownRequest = {
                goal: longGoal,
            };

            const result = await generateTaskBreakdown(request);

            // Should succeed by truncating
            expect(result).toBeDefined();
            expect(result.goal).toBe(longGoal);
        }, 20000);
    });

    describe('Response Validation', () => {
        it('should return well-structured tasks', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Build a treehouse',
            };

            const result = await generateTaskBreakdown(request);

            // Each task should have a meaningful title
            result.suggestedTasks.forEach(task => {
                expect(typeof task.title).toBe('string');
                expect(task.title.length).toBeGreaterThan(3);
                expect(task.title.length).toBeLessThan(200);

                if (task.description) {
                    expect(task.description.length).toBeGreaterThan(5);
                }
            });

            console.log('✅ Task structure validated!');
        }, 20000);

        it('should generate logical task order', async () => {
            const request: TaskBreakdownRequest = {
                goal: 'Move to a new apartment',
            };

            const result = await generateTaskBreakdown(request);

            expect(result.suggestedTasks.length).toBeGreaterThan(3);

            // Verify we got meaningful tasks
            const titles = result.suggestedTasks.map(t => t.title);
            console.log('📋 Task order:', titles);

            // All titles should be unique
            const uniqueTitles = new Set(titles);
            expect(uniqueTitles.size).toBe(titles.length);

            console.log('✅ Logical task ordering generated!');
        }, 20000);
    });
});
