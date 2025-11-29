import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { analyzeTodos } from '../aiController';
import * as aiService from '../../services/aiService';

// Mock the AI service
jest.mock('../../services/aiService');

describe('AI Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let responseJson: jest.Mock;
    let responseStatus: jest.Mock;

    beforeEach(() => {
        responseJson = jest.fn().mockReturnThis();
        responseStatus = jest.fn().mockReturnThis();

        mockRequest = {
            body: {},
        };

        mockResponse = {
            json: responseJson,
            status: responseStatus,
        };

        mockNext = jest.fn();

        jest.clearAllMocks();
    });

    describe('analyzeTodos', () => {
        const mockTodos = [
            {
                id: '1',
                title: 'Test todo',
                completed: false,
                createdAt: '2025-11-29T00:00:00Z',
                updatedAt: '2025-11-29T00:00:00Z',
            },
        ];

        it('should return 400 if todos field is missing', async () => {
            mockRequest.body = {};

            await analyzeTodos(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'Todos array is required',
            });
        });

        it('should return 400 if todos is not an array', async () => {
            mockRequest.body = { todos: 'not an array' };

            await analyzeTodos(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'Todos must be an array',
            });
        });

        it('should successfully analyze todos and return results', async () => {
            const mockAnalysisResult = {
                summary: 'Test summary',
                insights: ['Insight 1', 'Insight 2'],
                prioritySuggestions: ['Suggestion 1'],
            };

            mockRequest.body = { todos: mockTodos };

            (aiService.analyzeTodosWithAI as jest.MockedFunction<typeof aiService.analyzeTodosWithAI>)
                .mockResolvedValueOnce(mockAnalysisResult);

            await analyzeTodos(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(aiService.analyzeTodosWithAI).toHaveBeenCalledWith(mockTodos);
            expect(responseJson).toHaveBeenCalledWith(mockAnalysisResult);
            expect(responseStatus).not.toHaveBeenCalled();
        });

        it('should filter out invalid todos before analysis', async () => {
            const mixedTodos = [
                mockTodos[0],
                null,
                { id: '2' }, // Missing title
                'invalid',
                { id: '3', title: 'Valid todo', completed: false },
            ];

            mockRequest.body = { todos: mixedTodos };

            const mockResult = {
                summary: 'Test',
                insights: [],
            };

            (aiService.analyzeTodosWithAI as jest.MockedFunction<typeof aiService.analyzeTodosWithAI>)
                .mockResolvedValueOnce(mockResult);

            await analyzeTodos(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Should only pass valid todos (those with title)
            expect(aiService.analyzeTodosWithAI).toHaveBeenCalledWith([
                mockTodos[0],
                { id: '3', title: 'Valid todo', completed: false },
            ]);
        });

        it('should return 503 if API key is not configured', async () => {
            mockRequest.body = { todos: mockTodos };

            (aiService.analyzeTodosWithAI as jest.MockedFunction<typeof aiService.analyzeTodosWithAI>)
                .mockRejectedValueOnce(new Error('OPENROUTER_API_KEY is not configured'));

            await analyzeTodos(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(503);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'AI service is not configured. Please contact the administrator.',
                details: 'OPENROUTER_API_KEY is not configured',
            });
        });

        it('should return 504 if request times out', async () => {
            mockRequest.body = { todos: mockTodos };

            (aiService.analyzeTodosWithAI as jest.MockedFunction<typeof aiService.analyzeTodosWithAI>)
                .mockRejectedValueOnce(new Error('AI analysis request timed out. Please try again.'));

            await analyzeTodos(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(504);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'AI analysis timed out. Please try again.',
                details: 'AI analysis request timed out. Please try again.',
            });
        });

        it('should call next middleware for unexpected errors', async () => {
            mockRequest.body = { todos: mockTodos };

            const unexpectedError = new Error('Unexpected error');

            (aiService.analyzeTodosWithAI as jest.MockedFunction<typeof aiService.analyzeTodosWithAI>)
                .mockRejectedValueOnce(unexpectedError);

            await analyzeTodos(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(unexpectedError);
            expect(responseJson).not.toHaveBeenCalled();
        });

        it('should handle empty todos array', async () => {
            mockRequest.body = { todos: [] };

            const mockResult = {
                summary: 'Empty list',
                insights: [],
            };

            (aiService.analyzeTodosWithAI as jest.MockedFunction<typeof aiService.analyzeTodosWithAI>)
                .mockResolvedValueOnce(mockResult);

            await analyzeTodos(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(aiService.analyzeTodosWithAI).toHaveBeenCalledWith([]);
            expect(responseJson).toHaveBeenCalledWith(mockResult);
        });
    });
});
