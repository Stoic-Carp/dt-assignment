import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { analyzeTodosWithAI } from '../aiService';
import { Todo } from '../../types';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('AI Service', () => {
    const mockTodos: Todo[] = [
        {
            id: '1',
            title: 'Implement authentication',
            description: 'Add JWT-based auth',
            completed: false,
            createdAt: '2025-11-29T00:00:00Z',
            updatedAt: '2025-11-29T00:00:00Z',
        },
        {
            id: '2',
            title: 'Write tests',
            completed: false,
            createdAt: '2025-11-29T00:00:00Z',
            updatedAt: '2025-11-29T00:00:00Z',
        },
        {
            id: '3',
            title: 'Update docs',
            completed: true,
            createdAt: '2025-11-29T00:00:00Z',
            updatedAt: '2025-11-29T00:00:00Z',
        },
    ];

    const originalApiKey = process.env.OPENROUTER_API_KEY;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.OPENROUTER_API_KEY = 'test-api-key';
        process.env.AI_MODEL = 'test-model';
        process.env.AI_MAX_TOKENS = '500';
    });

    afterEach(() => {
        if (originalApiKey) {
            process.env.OPENROUTER_API_KEY = originalApiKey;
        } else {
            delete process.env.OPENROUTER_API_KEY;
        }
        delete process.env.AI_MODEL;
        delete process.env.AI_MAX_TOKENS;
    });

    describe('analyzeTodosWithAI', () => {
        it('should return default response for empty todo list', async () => {
            const result = await analyzeTodosWithAI([]);

            expect(result).toEqual({
                summary: 'You have no todos yet. Start by adding your first task!',
                insights: ['Your todo list is empty', 'Consider adding tasks to track your work'],
                prioritySuggestions: [],
            });

            expect(fetch).not.toHaveBeenCalled();
        });

        it('should throw error when API key is not configured', async () => {
            const savedKey = process.env.OPENROUTER_API_KEY;
            process.env.OPENROUTER_API_KEY = '';

            await expect(analyzeTodosWithAI(mockTodos)).rejects.toThrow();

            process.env.OPENROUTER_API_KEY = savedKey;
        });

        it('should successfully analyze todos and return parsed response', async () => {
            const mockResponse = {
                summary: 'You have 3 tasks with 2 pending',
                insights: ['Focus on authentication first', 'Tests are important'],
                prioritySuggestions: ['Start with auth', 'Then add tests'],
            };

            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify(mockResponse),
                            },
                        },
                    ],
                }),
            } as Response);

            const result = await analyzeTodosWithAI(mockTodos);

            expect(result).toEqual(mockResponse);
            expect(fetch).toHaveBeenCalledWith(
                'https://openrouter.ai/api/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                })
            );

            // Verify headers separately without checking the exact API key
            const fetchCall = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
            if (fetchCall) {
                const headers = (fetchCall[1] as any).headers;
                expect(headers['Content-Type']).toBe('application/json');
                expect(headers['Authorization']).toMatch(/^Bearer /);
            }
        });

        it('should handle API errors with non-ok response', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: async () => 'Invalid API key',
            } as Response);

            await expect(analyzeTodosWithAI(mockTodos)).rejects.toThrow(
                'OpenRouter API error: 401 Unauthorized'
            );
        });

        it('should handle empty AI response', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [],
                }),
            } as Response);

            await expect(analyzeTodosWithAI(mockTodos)).rejects.toThrow(
                'Failed to analyze todos with AI'
            );
        });

        it('should handle invalid JSON in AI response', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: 'This is not JSON format',
                            },
                        },
                    ],
                }),
            } as Response);

            await expect(analyzeTodosWithAI(mockTodos)).rejects.toThrow(
                'Failed to analyze todos with AI'
            );
        });

        it('should extract JSON from AI response with surrounding text', async () => {
            const mockResponse = {
                summary: 'Test summary',
                insights: ['Insight 1'],
                prioritySuggestions: ['Suggestion 1'],
            };

            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: `Here is the analysis:\n${JSON.stringify(mockResponse)}\nHope this helps!`,
                            },
                        },
                    ],
                }),
            } as Response);

            const result = await analyzeTodosWithAI(mockTodos);

            expect(result).toEqual(mockResponse);
        });

        it('should handle timeout errors', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(() => {
                return new Promise((_, reject) => {
                    const error = new Error('The operation was aborted');
                    (error as any).name = 'AbortError';
                    reject(error);
                });
            });

            await expect(analyzeTodosWithAI(mockTodos)).rejects.toThrow(
                'AI analysis request timed out. Please try again.'
            );
        });

        it('should handle network errors gracefully', async () => {
            (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
                new Error('Network error')
            );

            await expect(analyzeTodosWithAI(mockTodos)).rejects.toThrow(
                'Failed to analyze todos with AI. Please try again later.'
            );
        });

        it('should send correct payload to AI API', async () => {
            const mockResponse = {
                summary: 'Test',
                insights: [],
            };

            (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: JSON.stringify(mockResponse) } }],
                }),
            } as Response);

            await analyzeTodosWithAI(mockTodos);

            const fetchCall = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
            if (fetchCall && fetchCall[1]?.body) {
                const requestBody = JSON.parse(fetchCall[1].body as string);

                expect(requestBody).toHaveProperty('model');
                expect(requestBody).toHaveProperty('messages');
                expect(requestBody.messages).toHaveLength(2);
                expect(requestBody.messages[0].role).toBe('system');
                expect(requestBody.messages[1].role).toBe('user');
                expect(requestBody.messages[1].content).toContain('Implement authentication');
            }
        });
    });
});
