import dotenv from "dotenv";
import { TaskBreakdownRequest, TaskBreakdownResponse, SuggestedTask } from "../types";

dotenv.config();

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content?: string;
        };
    }>;
}

/**
 * Validates and sanitizes the goal input to prevent prompt injection
 */
function sanitizeInput(input: string): string {
    return input.trim().slice(0, 500);
}

/**
 * Validates the goal input
 */
function validateGoal(goal: string): { valid: boolean; error?: string } {
    const sanitized = goal.trim();

    if (!sanitized) {
        return { valid: false, error: "Goal cannot be empty" };
    }

    if (sanitized.length < 5) {
        return { valid: false, error: "Please provide a more specific goal (at least 5 characters)" };
    }

    if (sanitized.length > 500) {
        return { valid: false, error: "Goal is too long (maximum 500 characters)" };
    }

    return { valid: true };
}

/**
 * Validates the LLM response to ensure it matches expected format
 */
function validateLLMResponse(response: unknown): { valid: boolean; data?: { suggestedTasks: SuggestedTask[]; reasoning?: string } } {
    if (!response || typeof response !== 'object') {
        return { valid: false };
    }

    const data = response as Record<string, unknown>;

    if (!Array.isArray(data.suggestedTasks)) {
        return { valid: false };
    }

    // Validate each suggested task
    const suggestedTasks: SuggestedTask[] = [];
    for (const task of data.suggestedTasks) {
        if (!task || typeof task !== 'object') {
            continue;
        }

        const taskObj = task as Record<string, unknown>;

        if (typeof taskObj.title !== 'string' || !taskObj.title.trim()) {
            continue;
        }

        const suggestedTask: SuggestedTask = {
            title: taskObj.title.trim(),
        };

        if (taskObj.description && typeof taskObj.description === 'string') {
            suggestedTask.description = taskObj.description.trim();
        }

        if (taskObj.estimatedPriority &&
            (taskObj.estimatedPriority === 'low' || taskObj.estimatedPriority === 'medium' || taskObj.estimatedPriority === 'high')) {
            suggestedTask.estimatedPriority = taskObj.estimatedPriority;
        }

        suggestedTasks.push(suggestedTask);
    }

    if (suggestedTasks.length === 0) {
        return { valid: false };
    }

    const result: { suggestedTasks: SuggestedTask[]; reasoning?: string } = {
        suggestedTasks
    };

    if (typeof data.reasoning === 'string') {
        result.reasoning = data.reasoning;
    }

    return {
        valid: true,
        data: result
    };
}

export async function generateTaskBreakdown(request: TaskBreakdownRequest): Promise<TaskBreakdownResponse> {
    // Read configuration dynamically to support testing
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const AI_MODEL = process.env.AI_MODEL || "nvidia/nemotron-nano-12b-v2-vl:free";
    const TASK_BREAKDOWN_MAX_TOKENS = parseInt(process.env.TASK_BREAKDOWN_MAX_TOKENS || "800", 10);
    const TASK_BREAKDOWN_MAX_TASKS = parseInt(process.env.TASK_BREAKDOWN_MAX_TASKS || "8", 10);

    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is not configured");
    }

    // Validate and sanitize input
    const validation = validateGoal(request.goal);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const sanitizedGoal = sanitizeInput(request.goal);
    const sanitizedContext = request.context ? sanitizeInput(request.context) : undefined;
    const maxTasks = Math.min(request.maxTasks || TASK_BREAKDOWN_MAX_TASKS, TASK_BREAKDOWN_MAX_TASKS);

    const systemPrompt = `You are a task decomposition assistant. Break down high-level goals into specific, actionable sub-tasks.

Guidelines:
1. Generate 4-${maxTasks} concrete, actionable tasks
2. Each task should be clear and specific
3. Order tasks logically (dependencies first)
4. Keep task titles concise (5-10 words)
5. Add brief descriptions for clarity
6. Suggest priority levels where applicable

Return ONLY valid JSON, no additional text.`;

    const userPrompt = `Break down this goal into actionable sub-tasks:

Goal: "${sanitizedGoal}"
${sanitizedContext ? `Additional context: "${sanitizedContext}"` : ''}

Return JSON in this exact format:
{
  "suggestedTasks": [
    {
      "title": "Task title here",
      "description": "Brief explanation",
      "estimatedPriority": "high|medium|low"
    }
  ],
  "reasoning": "Brief explanation of breakdown approach"
}`;

    const messages: OpenRouterMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3001",
                "X-Title": "Todo List Task Breakdown"
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: messages,
                max_tokens: TASK_BREAKDOWN_MAX_TOKENS,
                temperature: 0.7,
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API error:", errorText);
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data: OpenRouterResponse = await response.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error("No response from AI model");
        }

        const firstChoice = data.choices[0];
        if (!firstChoice || !firstChoice.message || !firstChoice.message.content) {
            throw new Error("No response from AI model");
        }

        const aiResponse = firstChoice.message.content;

        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("AI response was not valid JSON:", aiResponse);
            throw new Error("AI response was not in expected JSON format");
        }

        const parsedResponse = JSON.parse(jsonMatch[0]);

        // Validate response structure
        const validationResult = validateLLMResponse(parsedResponse);
        if (!validationResult.valid || !validationResult.data) {
            throw new Error("AI response did not contain valid suggested tasks");
        }

        const breakdown: TaskBreakdownResponse = {
            goal: sanitizedGoal,
            suggestedTasks: validationResult.data.suggestedTasks,
        };

        if (validationResult.data.reasoning) {
            breakdown.reasoning = validationResult.data.reasoning;
        }

        return breakdown;

    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error("Task breakdown request timed out. Please try again with a simpler goal.");
        }

        console.error("Error calling OpenRouter API:", error);

        if (error instanceof Error && error.message.includes("API error")) {
            throw error;
        }

        if (error instanceof Error && (error.message.includes("Goal") || error.message.includes("format") || error.message.includes("valid") || error.message.includes("configured") || error.message.includes("No response"))) {
            throw error;
        }

        throw new Error("Failed to generate task breakdown. Please try again later.");
    }
}
