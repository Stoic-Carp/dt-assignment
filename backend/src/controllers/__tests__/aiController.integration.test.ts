import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';

/**
 * Integration tests for AI controller endpoints
 *
 * These tests make real HTTP requests to the Express app
 * and verify the full request/response cycle.
 *
 * Tests requiring OpenRouter API will be skipped if API key is not configured.
 */

const hasApiKey = Boolean(process.env.OPENROUTER_API_KEY);

describe('AI Controller - Integration Tests', () => {
    describe('POST /todos/analyze', () => {
        it('should return 400 when todos array is missing', async () => {
            const response = await request(app)
                .post('/todos/analyze')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Todos array is required');
        });

        it('should return 400 when todos is not an array', async () => {
            const response = await request(app)
                .post('/todos/analyze')
                .send({ todos: 'not an array' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Todos must be an array');
        });

        it('should accept empty todos array', async () => {
            const response = await request(app)
                .post('/todos/analyze')
                .send({ todos: [] })
                .expect(200);

            expect(response.body).toHaveProperty('summary');
            expect(response.body).toHaveProperty('insights');
            expect(response.body.summary).toBe('You have no todos yet. Start by adding your first task!');
        });

        if (!hasApiKey) {
            it('should return 503 when API key is not configured', async () => {
                const mockTodos = [
                    {
                        id: '1',
                        title: 'Test todo',
                        completed: false,
                        createdAt: '2025-11-29T00:00:00Z',
                        updatedAt: '2025-11-29T00:00:00Z',
                    },
                ];

                const response = await request(app)
                    .post('/todos/analyze')
                    .send({ todos: mockTodos })
                    .expect(503);

                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toContain('AI service is not configured');
            });
        }

        if (hasApiKey) {
            describe('Real API Integration', () => {
                it('should successfully analyze todos with real API call', async () => {
                    console.log('🌐 Making real HTTP request with AI analysis...');

                    const mockTodos = [
                        {
                            id: '1',
                            title: 'Implement authentication system',
                            description: 'Add JWT-based auth with user registration',
                            completed: false,
                            createdAt: '2025-11-29T00:00:00Z',
                            updatedAt: '2025-11-29T00:00:00Z',
                        },
                        {
                            id: '2',
                            title: 'Write unit tests',
                            description: 'Achieve 80% code coverage',
                            completed: false,
                            createdAt: '2025-11-29T00:00:00Z',
                            updatedAt: '2025-11-29T00:00:00Z',
                        },
                        {
                            id: '3',
                            title: 'Deploy to production',
                            completed: true,
                            createdAt: '2025-11-29T00:00:00Z',
                            updatedAt: '2025-11-29T00:00:00Z',
                        },
                    ];

                    const response = await request(app)
                        .post('/todos/analyze')
                        .send({ todos: mockTodos })
                        .set('Content-Type', 'application/json')
                        .expect(200);

                    // Verify response structure
                    expect(response.body).toHaveProperty('summary');
                    expect(response.body).toHaveProperty('insights');
                    expect(typeof response.body.summary).toBe('string');
                    expect(Array.isArray(response.body.insights)).toBe(true);

                    // Verify meaningful content
                    expect(response.body.summary.length).toBeGreaterThan(10);
                    expect(response.body.insights.length).toBeGreaterThan(0);

                    console.log('✅ HTTP request successful!');
                    console.log('📊 Response:', JSON.stringify(response.body, null, 2));
                }, 15000);

                it('should handle invalid todos gracefully', async () => {
                    const invalidTodos = [
                        { id: '1', title: 'Valid todo', completed: false },
                        null,
                        { id: '2' }, // Missing title
                        'invalid',
                        { id: '3', title: 'Another valid todo', completed: false },
                    ];

                    const response = await request(app)
                        .post('/todos/analyze')
                        .send({ todos: invalidTodos })
                        .expect(200);

                    // Should still succeed by filtering out invalid todos
                    expect(response.body).toHaveProperty('summary');
                    expect(response.body).toHaveProperty('insights');
                }, 15000);

                it('should set correct response headers', async () => {
                    const mockTodos = [
                        {
                            id: '1',
                            title: 'Test task',
                            completed: false,
                            createdAt: '2025-11-29T00:00:00Z',
                            updatedAt: '2025-11-29T00:00:00Z',
                        },
                    ];

                    const response = await request(app)
                        .post('/todos/analyze')
                        .send({ todos: mockTodos })
                        .expect(200);

                    expect(response.headers['content-type']).toMatch(/application\/json/);
                }, 15000);

                it('should handle todos with special characters', async () => {
                    const specialTodos = [
                        {
                            id: '1',
                            title: 'Review PR #123 & merge',
                            description: 'Check code quality, run tests, and merge into main branch',
                            completed: false,
                            createdAt: '2025-11-29T00:00:00Z',
                            updatedAt: '2025-11-29T00:00:00Z',
                        },
                        {
                            id: '2',
                            title: 'Update README.md with "Getting Started" section',
                            completed: false,
                            createdAt: '2025-11-29T00:00:00Z',
                            updatedAt: '2025-11-29T00:00:00Z',
                        },
                    ];

                    const response = await request(app)
                        .post('/todos/analyze')
                        .send({ todos: specialTodos })
                        .expect(200);

                    expect(response.body).toHaveProperty('summary');
                    expect(response.body.insights.length).toBeGreaterThan(0);
                }, 15000);
            });
        }

        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/todos/analyze')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }')
                .expect(400);

            // Should get a 400 error for bad JSON
            expect(response.status).toBe(400);
        });
    });

    describe('CORS and Headers', () => {
        it('should have CORS enabled', async () => {
            const response = await request(app)
                .options('/todos/analyze')
                .set('Origin', 'http://localhost:3000')
                .expect(204);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });
    });
});
