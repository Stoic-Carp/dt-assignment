import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';

/**
 * Integration tests for Task Breakdown controller endpoints
 *
 * These tests make real HTTP requests to the Express app
 * and verify the full request/response cycle.
 *
 * Tests requiring OpenRouter API will be skipped if API key is not configured.
 */

const hasApiKey = Boolean(process.env.OPENROUTER_API_KEY);

describe('Task Breakdown Controller - Integration Tests', () => {
    describe('POST /todos/breakdown', () => {
        it('should return 400 when goal is missing', async () => {
            const response = await request(app)
                .post('/todos/breakdown')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Goal is required');
        });

        it('should return 400 when goal is not a string', async () => {
            const response = await request(app)
                .post('/todos/breakdown')
                .send({ goal: 123 })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Goal must be a string');
        });

        it('should return 400 when goal is too short', async () => {
            const response = await request(app)
                .post('/todos/breakdown')
                .send({ goal: 'Go' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Please provide a more specific goal');
        });

        it('should return 400 when context is not a string', async () => {
            const response = await request(app)
                .post('/todos/breakdown')
                .send({ goal: 'Valid goal', context: 123 })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Context must be a string');
        });

        it('should return 400 when maxTasks is invalid', async () => {
            const response = await request(app)
                .post('/todos/breakdown')
                .send({ goal: 'Valid goal', maxTasks: 'invalid' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('maxTasks must be a number');
        });

        it('should return 400 when maxTasks is out of range', async () => {
            const response = await request(app)
                .post('/todos/breakdown')
                .send({ goal: 'Valid goal', maxTasks: 25 })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('maxTasks must be a number between 1 and 20');
        });

        if (!hasApiKey) {
            it('should return 503 when API key is not configured', async () => {
                const response = await request(app)
                    .post('/todos/breakdown')
                    .send({ goal: 'Plan a camping trip' })
                    .expect(503);

                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toContain('AI service is not configured');
            });
        }

        if (hasApiKey) {
            describe('Real API Integration', () => {
                it('should successfully break down a simple goal', async () => {
                    console.log('🌐 Making real HTTP request for task breakdown...');

                    const response = await request(app)
                        .post('/todos/breakdown')
                        .send({ goal: 'Plan a weekend camping trip' })
                        .set('Content-Type', 'application/json')
                        .expect(200);

                    // Verify response structure
                    expect(response.body).toHaveProperty('goal');
                    expect(response.body).toHaveProperty('suggestedTasks');
                    expect(response.body.goal).toBe('Plan a weekend camping trip');
                    expect(Array.isArray(response.body.suggestedTasks)).toBe(true);
                    expect(response.body.suggestedTasks.length).toBeGreaterThan(0);

                    // Verify task structure
                    response.body.suggestedTasks.forEach((task: any) => {
                        expect(task).toHaveProperty('title');
                        expect(typeof task.title).toBe('string');
                        expect(task.title.length).toBeGreaterThan(0);
                    });

                    console.log('✅ HTTP request successful!');
                    console.log('📝 Goal:', response.body.goal);
                    console.log('📋 Tasks generated:', response.body.suggestedTasks.length);
                    console.log('📌 Sample tasks:', response.body.suggestedTasks.slice(0, 3).map((t: any) => t.title));
                }, 20000);

                it('should handle goal with context', async () => {
                    const response = await request(app)
                        .post('/todos/breakdown')
                        .send({
                            goal: 'Prepare a presentation',
                            context: 'For quarterly board meeting with revenue projections',
                        })
                        .set('Content-Type', 'application/json')
                        .expect(200);

                    expect(response.body).toHaveProperty('suggestedTasks');
                    expect(response.body.suggestedTasks.length).toBeGreaterThan(0);

                    console.log('✅ Context-aware breakdown successful!');
                    console.log('📋 Tasks:', response.body.suggestedTasks.map((t: any) => t.title));
                }, 20000);

                it('should respect maxTasks parameter', async () => {
                    const response = await request(app)
                        .post('/todos/breakdown')
                        .send({
                            goal: 'Organize a birthday party',
                            maxTasks: 4,
                        })
                        .set('Content-Type', 'application/json')
                        .expect(200);

                    expect(response.body.suggestedTasks.length).toBeGreaterThan(0);
                    expect(response.body.suggestedTasks.length).toBeLessThanOrEqual(4);

                    console.log('✅ maxTasks parameter respected!');
                    console.log('📋 Tasks generated:', response.body.suggestedTasks.length);
                }, 20000);

                it('should include optional fields when present', async () => {
                    const response = await request(app)
                        .post('/todos/breakdown')
                        .send({ goal: 'Launch a new product' })
                        .set('Content-Type', 'application/json')
                        .expect(200);

                    expect(response.body).toHaveProperty('goal');
                    expect(response.body).toHaveProperty('suggestedTasks');

                    // Check if tasks have descriptions and priorities
                    const tasksWithDescriptions = response.body.suggestedTasks.filter(
                        (t: any) => t.description
                    );
                    const tasksWithPriority = response.body.suggestedTasks.filter(
                        (t: any) => t.estimatedPriority
                    );

                    console.log(`📝 ${tasksWithDescriptions.length}/${response.body.suggestedTasks.length} tasks have descriptions`);
                    console.log(`📊 ${tasksWithPriority.length}/${response.body.suggestedTasks.length} tasks have priorities`);

                    // If reasoning is present, verify it
                    if (response.body.reasoning) {
                        expect(typeof response.body.reasoning).toBe('string');
                        console.log('💭 Reasoning provided:', response.body.reasoning);
                    }
                }, 20000);

                it('should handle goals with special characters', async () => {
                    const response = await request(app)
                        .post('/todos/breakdown')
                        .send({
                            goal: 'Prepare for son\'s 5th birthday & organize activities',
                        })
                        .set('Content-Type', 'application/json')
                        .expect(200);

                    expect(response.body.suggestedTasks.length).toBeGreaterThan(0);

                    console.log('✅ Special characters handled!');
                }, 20000);

                it('should set correct response headers', async () => {
                    const response = await request(app)
                        .post('/todos/breakdown')
                        .send({ goal: 'Build a treehouse' })
                        .expect(200);

                    expect(response.headers['content-type']).toMatch(/application\/json/);
                }, 20000);

                it('should validate task structure in response', async () => {
                    const response = await request(app)
                        .post('/todos/breakdown')
                        .send({ goal: 'Start learning piano' })
                        .expect(200);

                    // Validate each task
                    response.body.suggestedTasks.forEach((task: any) => {
                        expect(task.title).toBeDefined();
                        expect(typeof task.title).toBe('string');
                        expect(task.title.length).toBeGreaterThan(0);

                        if (task.description) {
                            expect(typeof task.description).toBe('string');
                        }

                        if (task.estimatedPriority) {
                            expect(['low', 'medium', 'high']).toContain(task.estimatedPriority);
                        }
                    });

                    console.log('✅ Task structure validated!');
                }, 20000);

                it('should handle work-related goals', async () => {
                    const response = await request(app)
                        .post('/todos/breakdown')
                        .send({
                            goal: 'Implement a new authentication system',
                            context: 'Using JWT tokens and OAuth2',
                        })
                        .expect(200);

                    expect(response.body.suggestedTasks.length).toBeGreaterThan(2);

                    console.log('✅ Work-related goal handled!');
                    console.log('📋 Technical tasks:', response.body.suggestedTasks.map((t: any) => t.title));
                }, 20000);

                it('should handle personal goals', async () => {
                    const response = await request(app)
                        .post('/todos/breakdown')
                        .send({ goal: 'Get in shape for summer' })
                        .expect(200);

                    expect(response.body.suggestedTasks.length).toBeGreaterThan(2);

                    console.log('✅ Personal goal handled!');
                    console.log('📋 Fitness tasks:', response.body.suggestedTasks.map((t: any) => t.title));
                }, 20000);
            });
        }

        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/todos/breakdown')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }')
                .expect(400);

            expect(response.status).toBe(400);
        });
    });

    describe('CORS and Headers', () => {
        it('should have CORS enabled', async () => {
            const response = await request(app)
                .options('/todos/breakdown')
                .set('Origin', 'http://localhost:3000')
                .expect(204);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        if (hasApiKey) {
            it('should return 400 for empty goal string', async () => {
                const response = await request(app)
                    .post('/todos/breakdown')
                    .send({ goal: '   ' })
                    .expect(400);

                expect(response.body).toHaveProperty('error');
            });

            it('should sanitize very long goals', async () => {
                const longGoal = 'a'.repeat(400);
                const response = await request(app)
                    .post('/todos/breakdown')
                    .send({ goal: longGoal })
                    .expect(200);

                expect(response.body.goal).toBe(longGoal);
            }, 20000);
        }

        it('should return appropriate error for maxTasks = 0', async () => {
            const response = await request(app)
                .post('/todos/breakdown')
                .send({ goal: 'Valid goal', maxTasks: 0 })
                .expect(400);

            expect(response.body.error).toContain('maxTasks must be a number between 1 and 20');
        });

        it('should return appropriate error for negative maxTasks', async () => {
            const response = await request(app)
                .post('/todos/breakdown')
                .send({ goal: 'Valid goal', maxTasks: -5 })
                .expect(400);

            expect(response.body.error).toContain('maxTasks must be a number between 1 and 20');
        });
    });
});
