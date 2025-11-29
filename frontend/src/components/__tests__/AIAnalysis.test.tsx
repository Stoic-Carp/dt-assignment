import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIAnalysis } from '../AIAnalysis';
import * as aiService from '../../services/ai';
import type { Todo } from '../../types';

vi.mock('../../services/ai');

describe('AIAnalysis Component', () => {
    const mockTodos: Todo[] = [
        {
            id: '1',
            title: 'Test todo 1',
            completed: false,
            createdAt: '2025-11-29T00:00:00Z',
            updatedAt: '2025-11-29T00:00:00Z',
        },
        {
            id: '2',
            title: 'Test todo 2',
            completed: true,
            createdAt: '2025-11-29T00:00:00Z',
            updatedAt: '2025-11-29T00:00:00Z',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the analyze button', () => {
        render(<AIAnalysis todos={mockTodos} />);

        const button = screen.getByRole('button', { name: /AI Analyze Tasks/i });
        expect(button).toBeInTheDocument();
    });

    it('should show loading state when analyzing', async () => {
        const mockAnalyzeWithAI = vi.fn().mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
        (aiService.analyzeWithAI as any) = mockAnalyzeWithAI;

        render(<AIAnalysis todos={mockTodos} />);

        const button = screen.getByRole('button', { name: /AI Analyze Tasks/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/Analyzing your tasks/i)).toBeInTheDocument();
        });
    });

    it('should display analysis results when successful', async () => {
        const mockResponse = {
            summary: 'You have 2 tasks',
            insights: ['Focus on the first task', 'Complete the second task'],
            prioritySuggestions: ['Start with task 1'],
        };

        (aiService.analyzeWithAI as any) = vi.fn().mockResolvedValue(mockResponse);

        render(<AIAnalysis todos={mockTodos} />);

        const button = screen.getByRole('button', { name: /AI Analyze Tasks/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('AI Insights')).toBeInTheDocument();
        });

        expect(screen.getByText('You have 2 tasks')).toBeInTheDocument();
        expect(screen.getByText('Focus on the first task')).toBeInTheDocument();
        expect(screen.getByText('Complete the second task')).toBeInTheDocument();
        expect(screen.getByText('Start with task 1')).toBeInTheDocument();
    });

    it('should display error message when analysis fails', async () => {
        const mockError = {
            response: {
                data: {
                    error: 'AI service is not configured',
                },
            },
        };

        (aiService.analyzeWithAI as any) = vi.fn().mockRejectedValue(mockError);

        render(<AIAnalysis todos={mockTodos} />);

        const button = screen.getByRole('button', { name: /AI Analyze Tasks/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
        });

        expect(screen.getByText('AI service is not configured')).toBeInTheDocument();
    });

    it('should close analysis results when close button is clicked', async () => {
        const mockResponse = {
            summary: 'Test summary',
            insights: ['Test insight'],
        };

        (aiService.analyzeWithAI as any) = vi.fn().mockResolvedValue(mockResponse);

        const { container } = render(<AIAnalysis todos={mockTodos} />);

        const analyzeButton = screen.getByRole('button', { name: /AI Analyze Tasks/i });
        fireEvent.click(analyzeButton);

        await waitFor(() => {
            expect(screen.getByText('AI Insights')).toBeInTheDocument();
        });

        // Find close button by looking for the X icon within the analysis panel
        const closeButton = container.querySelector('.bg-gradient-to-br button:last-child');

        if (closeButton) {
            fireEvent.click(closeButton);

            // The panel should collapse but may still be in DOM
            // Check if it's not visible instead
            await waitFor(() => {
                const analysisPanel = container.querySelector('.bg-gradient-to-br');
                expect(analysisPanel).not.toBeInTheDocument();
            });
        } else {
            // Skip test if close button not found
            expect(closeButton).not.toBeNull();
        }
    });

    it('should handle network errors gracefully', async () => {
        const mockError = new Error('Network connection failed');

        (aiService.analyzeWithAI as any) = vi.fn().mockRejectedValue(mockError);

        render(<AIAnalysis todos={mockTodos} />);

        const button = screen.getByRole('button', { name: /AI Analyze Tasks/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
        });

        expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('should call analyzeWithAI with correct todos', async () => {
        const mockAnalyzeWithAI = vi.fn().mockResolvedValue({
            summary: 'Test',
            insights: [],
        });

        (aiService.analyzeWithAI as any) = mockAnalyzeWithAI;

        render(<AIAnalysis todos={mockTodos} />);

        const button = screen.getByRole('button', { name: /AI Analyze Tasks/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockAnalyzeWithAI).toHaveBeenCalledWith(mockTodos);
        });
    });

    it('should not render insights section if insights array is empty', async () => {
        const mockResponse = {
            summary: 'Test summary',
            insights: [],
        };

        (aiService.analyzeWithAI as any) = vi.fn().mockResolvedValue(mockResponse);

        render(<AIAnalysis todos={mockTodos} />);

        const button = screen.getByRole('button', { name: /AI Analyze Tasks/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Test summary')).toBeInTheDocument();
        });

        expect(screen.queryByText('Key Insights')).not.toBeInTheDocument();
    });

    it('should not render priority suggestions if not provided', async () => {
        const mockResponse = {
            summary: 'Test summary',
            insights: ['Test insight'],
        };

        (aiService.analyzeWithAI as any) = vi.fn().mockResolvedValue(mockResponse);

        render(<AIAnalysis todos={mockTodos} />);

        const button = screen.getByRole('button', { name: /AI Analyze Tasks/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Test summary')).toBeInTheDocument();
        });

        expect(screen.queryByText('Priority Suggestions')).not.toBeInTheDocument();
    });
});
