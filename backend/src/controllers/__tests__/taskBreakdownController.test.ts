import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { breakdownTask } from '../taskBreakdownController';
import * as taskBreakdownService from '../../services/taskBreakdownService';

// Mock the task breakdown service
jest.mock('../../services/taskBreakdownService');

describe('Task Breakdown Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let responseJson: jest.MockedFunction<Response['json']>;
    let responseStatus: jest.MockedFunction<Response['status']>;

    beforeEach(() => {
        responseJson = jest.fn().mockReturnThis() as jest.MockedFunction<Response['json']>;
        responseStatus = jest.fn().mockReturnThis() as jest.MockedFunction<Response['status']>;

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

    describe('breakdownTask', () => {
        const mockBreakdownResult = {
            goal: 'Plan a camping trip',
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
            ],
            reasoning: 'Prioritized by time-sensitivity and dependencies',
        };

        it('should return 400 if goal field is missing', async () => {
            mockRequest.body = {};

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'Goal is required',
            });
        });

        it('should return 400 if goal is not a string', async () => {
            mockRequest.body = { goal: 123 };

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'Goal must be a string',
            });
        });

        it('should return 400 if context is not a string', async () => {
            mockRequest.body = { goal: 'Test goal', context: 123 };

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'Context must be a string',
            });
        });

        it('should return 400 if maxTasks is invalid', async () => {
            mockRequest.body = { goal: 'Test goal', maxTasks: 'invalid' };

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'maxTasks must be a number between 1 and 20',
            });
        });

        it('should return 400 if maxTasks is out of range', async () => {
            mockRequest.body = { goal: 'Test goal', maxTasks: 25 };

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'maxTasks must be a number between 1 and 20',
            });
        });

        it('should successfully breakdown task and return results', async () => {
            mockRequest.body = { goal: 'Plan a camping trip' };

            (taskBreakdownService.generateTaskBreakdown as jest.MockedFunction<typeof taskBreakdownService.generateTaskBreakdown>)
                .mockResolvedValueOnce(mockBreakdownResult);

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(taskBreakdownService.generateTaskBreakdown).toHaveBeenCalledWith({
                goal: 'Plan a camping trip',
            });
            expect(responseJson).toHaveBeenCalledWith(mockBreakdownResult);
            expect(responseStatus).not.toHaveBeenCalled();
        });

        it('should handle breakdown with context and maxTasks', async () => {
            mockRequest.body = {
                goal: 'Prepare presentation',
                context: 'For board meeting',
                maxTasks: 5,
            };

            (taskBreakdownService.generateTaskBreakdown as jest.MockedFunction<typeof taskBreakdownService.generateTaskBreakdown>)
                .mockResolvedValueOnce(mockBreakdownResult);

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(taskBreakdownService.generateTaskBreakdown).toHaveBeenCalledWith({
                goal: 'Prepare presentation',
                context: 'For board meeting',
                maxTasks: 5,
            });
            expect(responseJson).toHaveBeenCalledWith(mockBreakdownResult);
        });

        it('should return 503 if API key is not configured', async () => {
            mockRequest.body = { goal: 'Test goal' };

            (taskBreakdownService.generateTaskBreakdown as jest.MockedFunction<typeof taskBreakdownService.generateTaskBreakdown>)
                .mockRejectedValueOnce(new Error('OPENROUTER_API_KEY is not configured'));

            await breakdownTask(
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
            mockRequest.body = { goal: 'Test goal' };

            (taskBreakdownService.generateTaskBreakdown as jest.MockedFunction<typeof taskBreakdownService.generateTaskBreakdown>)
                .mockRejectedValueOnce(new Error('Task breakdown request timed out. Please try again with a simpler goal.'));

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(504);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'Task breakdown timed out. Please try again with a simpler goal.',
                details: 'Task breakdown request timed out. Please try again with a simpler goal.',
            });
        });

        it('should return 400 if goal validation fails', async () => {
            mockRequest.body = { goal: 'Test' };

            (taskBreakdownService.generateTaskBreakdown as jest.MockedFunction<typeof taskBreakdownService.generateTaskBreakdown>)
                .mockRejectedValueOnce(new Error('Please provide a more specific goal (at least 5 characters)'));

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(400);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'Please provide a more specific goal (at least 5 characters)',
            });
        });

        it('should return 500 if response format is invalid', async () => {
            mockRequest.body = { goal: 'Test goal' };

            (taskBreakdownService.generateTaskBreakdown as jest.MockedFunction<typeof taskBreakdownService.generateTaskBreakdown>)
                .mockRejectedValueOnce(new Error('AI response was not in expected format'));

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(responseStatus).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith({
                error: 'AI response was not in expected format. Please try again.',
                details: 'AI response was not in expected format',
            });
        });

        it('should call next middleware for unexpected errors', async () => {
            mockRequest.body = { goal: 'Test goal' };

            const unexpectedError = new Error('Unexpected error');

            (taskBreakdownService.generateTaskBreakdown as jest.MockedFunction<typeof taskBreakdownService.generateTaskBreakdown>)
                .mockRejectedValueOnce(unexpectedError);

            await breakdownTask(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalledWith(unexpectedError);
            expect(responseJson).not.toHaveBeenCalled();
        });
    });
});
