import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { generateTaskBreakdown } from '../taskBreakdownService';
import { TaskBreakdownRequest } from '../../types';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Task Breakdown Service', () => {
    const originalApiKey = process.env.OPENROUTER_API_KEY;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.OPENROUTER_API_KEY = 'test-api-key';
        process.env.AI_MODEL = 'test-model';
        process.env.TASK_BREAKDOWN_MAX_TOKENS = '800';
        process.env.TASK_BREAKDOWN_MAX_TASKS = '8';
    });

    afterEach(() => {
        if (originalApiKey) {
            process.env.OPENROUTER_API_KEY = originalApiKey;
        } else {
            delete process.env.OPENROUTER_API_KEY;
        }
        delete process.env.AI_MODEL;
        delete process.env.TASK_BREAKDOWN_MAX_TOKENS;
        delete process.env.TASK_BREAKDOWN_MAX_TASKS;
    });

    describe('generateTaskBreakdown', () => {
        const validRequest: TaskBreakdownRequest = {
            goal: 'Plan a camping trip',
        };

        const mockSuccessResponse = {
            suggestedTasks: [
                {
                    title: 'Research campsites',
                    description: 'Find available campsites within 2-hour drive',
                    estimatedPriority: 'high' as const,
                },
                {
                    title: 'Check weather forecast',
                    description: 'Review 3-day forecast for camping location',
                    estimatedPriority: 'high' as const,
                },
                {
                    title: 'Create packing list',
                    description: 'List tent, sleeping bags, cooking gear',
                    estimatedPriority: 'medium' as const,
                },
            ],
            reasoning: 'Prioritized by time-sensitivity',
        };

        it('should throw error when API key is not configured', async () => {
            delete process.env.OPENROUTER_API_KEY;

            await expect(generateTaskBreakdown(validRequest)).rejects.toThrow(
                'OPENROUTER_API_KEY is not configured'
            );
        });

        it('should throw error when goal is empty', async () => {
            const invalidRequest: TaskBreakdownRequest = {
                goal: '',
            };

            await expect(generateTaskBreakdown(invalidRequest)).rejects.toThrow(
                'Goal cannot be empty'
            );
        });

        it('should throw error when goal is too short', async () => {
            const invalidRequest: TaskBreakdownRequest = {
                goal: 'Go',
            };

            await expect(generateTaskBreakdown(invalidRequest)).rejects.toThrow(
                'Please provide a more specific goal (at least 5 characters)'
            );
        });

        it('should throw error when goal is too long', async () => {
            const invalidRequest: TaskBreakdownRequest = {
                goal: 'a'.repeat(501),
            };

            await expect(generateTaskBreakdown(invalidRequest)).rejects.toThrow(
                'Goal is too long (maximum 500 characters)'
            );
        });

        it('should successfully generate task breakdown', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify(mockSuccessResponse),
                            },
                        },
                    ],
                }),
            } as Response);

            const result = await generateTaskBreakdown(validRequest);

            expect(result.goal).toBe('Plan a camping trip');
            expect(result.suggestedTasks).toEqual(mockSuccessResponse.suggestedTasks);
            expect(result.reasoning).toBe('Prioritized by time-sensitivity');
            expect(fetch).toHaveBeenCalledWith(
                'https://openrouter.ai/api/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });

        it('should handle request with context and maxTasks', async () => {
            const requestWithOptions: TaskBreakdownRequest = {
                goal: 'Prepare presentation',
                context: 'For board meeting',
                maxTasks: 5,
            };

            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify(mockSuccessResponse),
                            },
                        },
                    ],
                }),
            } as Response);

            const result = await generateTaskBreakdown(requestWithOptions);

            expect(result.goal).toBe('Prepare presentation');
            expect(fetch).toHaveBeenCalled();
        });

        it('should sanitize and truncate long goal', async () => {
            const longGoal = 'a'.repeat(400) + '  ';
            const request: TaskBreakdownRequest = {
                goal: longGoal,
            };

            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify(mockSuccessResponse),
                            },
                        },
                    ],
                }),
            } as Response);

            const result = await generateTaskBreakdown(request);

            // Should trim and accept the goal
            expect(result.goal).toBe('a'.repeat(400));
        });

        it('should throw error when API returns error status', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: async () => 'Invalid API key',
            } as Response);

            await expect(generateTaskBreakdown(validRequest)).rejects.toThrow(
                'OpenRouter API error'
            );
        });

        it('should throw error when API returns no choices', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [],
                }),
            } as Response);

            await expect(generateTaskBreakdown(validRequest)).rejects.toThrow(
                'No response from AI model'
            );
        });

        it('should throw error when API returns non-JSON response', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: 'This is not JSON',
                            },
                        },
                    ],
                }),
            } as Response);

            await expect(generateTaskBreakdown(validRequest)).rejects.toThrow(
                'AI response was not in expected JSON format'
            );
        });

        it('should throw error when response has no suggested tasks', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify({
                                    suggestedTasks: [],
                                }),
                            },
                        },
                    ],
                }),
            } as Response);

            await expect(generateTaskBreakdown(validRequest)).rejects.toThrow(
                'AI response did not contain valid suggested tasks'
            );
        });

        it('should filter out invalid suggested tasks', async () => {
            const responseWithInvalidTasks = {
                suggestedTasks: [
                    {
                        title: 'Valid task',
                        description: 'This is valid',
                    },
                    {
                        // Missing title
                        description: 'Invalid task',
                    },
                    {
                        title: '',  // Empty title
                        description: 'Invalid',
                    },
                    {
                        title: 'Another valid task',
                    },
                ],
            };

            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify(responseWithInvalidTasks),
                            },
                        },
                    ],
                }),
            } as Response);

            const result = await generateTaskBreakdown(validRequest);

            // Should only include valid tasks (those with non-empty titles)
            expect(result.suggestedTasks).toHaveLength(2);
            expect(result.suggestedTasks[0]?.title).toBe('Valid task');
            expect(result.suggestedTasks[1]?.title).toBe('Another valid task');
        });

        it('should handle timeout error', async () => {
            const abortError = new Error('Aborted');
            abortError.name = 'AbortError';

            (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(abortError);

            await expect(generateTaskBreakdown(validRequest)).rejects.toThrow(
                'Task breakdown request timed out'
            );
        });

        it('should handle fetch network error', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
                new Error('Network error')
            );

            await expect(generateTaskBreakdown(validRequest)).rejects.toThrow(
                'Failed to generate task breakdown'
            );
        });

        it('should validate priority values', async () => {
            const responseWithPriorities = {
                suggestedTasks: [
                    {
                        title: 'High priority task',
                        estimatedPriority: 'high',
                    },
                    {
                        title: 'Medium priority task',
                        estimatedPriority: 'medium',
                    },
                    {
                        title: 'Low priority task',
                        estimatedPriority: 'low',
                    },
                    {
                        title: 'Invalid priority task',
                        estimatedPriority: 'urgent', // Invalid priority
                    },
                ],
            };

            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify(responseWithPriorities),
                            },
                        },
                    ],
                }),
            } as Response);

            const result = await generateTaskBreakdown(validRequest);

            expect(result.suggestedTasks[0]?.estimatedPriority).toBe('high');
            expect(result.suggestedTasks[1]?.estimatedPriority).toBe('medium');
            expect(result.suggestedTasks[2]?.estimatedPriority).toBe('low');
            // Invalid priority should not be included
            expect(result.suggestedTasks[3]?.estimatedPriority).toBeUndefined();
        });
    });
});
