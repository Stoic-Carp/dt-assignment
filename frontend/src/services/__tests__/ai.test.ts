import { describe, it, expect, vi } from 'vitest';
import type { Todo } from '../../types';

const mockPost = vi.fn();

vi.mock('axios', () => {
    return {
        default: {
            create: vi.fn(() => ({
                post: mockPost,
            })),
        },
    };
});

describe('AI Service', () => {
    const mockTodos: Todo[] = [
        {
            id: '1',
            title: 'Test todo',
            completed: false,
            createdAt: '2025-11-29T00:00:00Z',
            updatedAt: '2025-11-29T00:00:00Z',
        },
    ];

    it('should successfully analyze todos', async () => {
        const mockResponse = {
            summary: 'Test summary',
            insights: ['Insight 1', 'Insight 2'],
            prioritySuggestions: ['Suggestion 1'],
        };

        mockPost.mockResolvedValueOnce({ data: mockResponse });

        // Dynamic import after mock is set up
        const { analyzeWithAI } = await import('../ai');
        const result = await analyzeWithAI(mockTodos);

        expect(result).toEqual(mockResponse);
        expect(mockPost).toHaveBeenCalledWith('/analyze', { todos: mockTodos });
    });

    it('should throw error when API call fails', async () => {
        const mockError = new Error('Network error');
        mockPost.mockRejectedValueOnce(mockError);

        const { analyzeWithAI } = await import('../ai');

        await expect(analyzeWithAI(mockTodos)).rejects.toThrow('Network error');
    });
});
