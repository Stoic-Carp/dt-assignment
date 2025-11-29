import dotenv from "dotenv";
import { Todo, AIAnalysisResponse } from "../types";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "meta-llama/llama-3.2-3b-instruct:free";
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || "500", 10);
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

export async function analyzeTodosWithAI(todos: Todo[]): Promise<AIAnalysisResponse> {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is not configured");
    }

    if (todos.length === 0) {
        return {
            summary: "You have no todos yet. Start by adding your first task!",
            insights: ["Your todo list is empty", "Consider adding tasks to track your work"],
            prioritySuggestions: [],
        };
    }

    const systemPrompt = `You are a task management assistant. Analyze the user's todo list and provide:
1. A brief summary of their workload (1-2 sentences)
2. 2-3 actionable insights about task organization
3. Priority recommendations if tasks seem urgent

Keep responses concise and actionable. Format as JSON.`;

    const pendingTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    const todoList = todos.map(t =>
        `- [${t.completed ? 'x' : ' '}] ${t.title}${t.description ? ': ' + t.description : ''}`
    ).join('\n');

    const userPrompt = `Analyze these todos:
${todoList}

Statistics: ${todos.length} total (${pendingTodos.length} pending, ${completedTodos.length} completed)

Provide analysis in this JSON format:
{
  "summary": "Brief workload summary",
  "insights": ["insight 1", "insight 2"],
  "prioritySuggestions": ["suggestion 1", "suggestion 2"]
}`;

    const messages: OpenRouterMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3001",
                "X-Title": "Todo List AI Analysis"
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: messages,
                max_tokens: AI_MAX_TOKENS,
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

        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("AI response was not valid JSON:", aiResponse);
            throw new Error("AI response was not in expected JSON format");
        }

        const parsedResponse = JSON.parse(jsonMatch[0]);

        return {
            summary: parsedResponse.summary || "Analysis completed",
            insights: Array.isArray(parsedResponse.insights) ? parsedResponse.insights : [],
            prioritySuggestions: Array.isArray(parsedResponse.prioritySuggestions)
                ? parsedResponse.prioritySuggestions
                : undefined,
        };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error("AI analysis request timed out. Please try again.");
        }

        console.error("Error calling OpenRouter API:", error);

        if (error.message.includes("API error")) {
            throw error;
        }

        throw new Error("Failed to analyze todos with AI. Please try again later.");
    }
}
