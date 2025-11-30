import { useState } from 'react';
import type { SuggestedTask, TaskBreakdownResponse } from '../types';
import { generateTaskBreakdown } from '../services/taskBreakdown';
import { createTodo } from '../services/api';

export interface UseTaskBreakdownReturn {
    suggestions: SuggestedTask[];
    selectedTasks: Set<number>;
    editedTasks: Map<number, SuggestedTask>;
    isLoading: boolean;
    error: string | null;
    reasoning: string | undefined;
    generateBreakdown: (goal: string, context?: string, maxTasks?: number) => Promise<void>;
    toggleTaskSelection: (index: number) => void;
    selectAll: () => void;
    deselectAll: () => void;
    updateTask: (index: number, updates: Partial<SuggestedTask>) => void;
    removeTask: (index: number) => void;
    addSelectedTasks: () => Promise<void>;
    clearSuggestions: () => void;
}

export const useTaskBreakdown = (onTasksAdded?: () => void): UseTaskBreakdownReturn => {
    const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
    const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
    const [editedTasks, setEditedTasks] = useState<Map<number, SuggestedTask>>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reasoning, setReasoning] = useState<string | undefined>();

    const generateBreakdown = async (goal: string, context?: string, maxTasks?: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const response: TaskBreakdownResponse = await generateTaskBreakdown(goal, context, maxTasks);
            setSuggestions(response.suggestedTasks);
            setReasoning(response.reasoning);

            // Auto-select all tasks by default
            const allIndices = new Set<number>();
            response.suggestedTasks.forEach((_, index) => allIndices.add(index));
            setSelectedTasks(allIndices);

            // Clear edited tasks
            setEditedTasks(new Map());
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to generate task breakdown. Please try again.');
            }
            setSuggestions([]);
            setSelectedTasks(new Set());
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTaskSelection = (index: number) => {
        setSelectedTasks((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        const allIndices = new Set<number>();
        suggestions.forEach((_, index) => allIndices.add(index));
        setSelectedTasks(allIndices);
    };

    const deselectAll = () => {
        setSelectedTasks(new Set());
    };

    const updateTask = (index: number, updates: Partial<SuggestedTask>) => {
        setEditedTasks((prev) => {
            const newMap = new Map(prev);
            const currentTask = prev.get(index) || suggestions[index];
            newMap.set(index, { ...currentTask, ...updates });
            return newMap;
        });
    };

    const removeTask = (index: number) => {
        setSuggestions((prev) => prev.filter((_, i) => i !== index));

        // Update selected tasks indices
        setSelectedTasks((prev) => {
            const newSet = new Set<number>();
            prev.forEach((selectedIndex) => {
                if (selectedIndex < index) {
                    newSet.add(selectedIndex);
                } else if (selectedIndex > index) {
                    newSet.add(selectedIndex - 1);
                }
                // Skip the removed index
            });
            return newSet;
        });

        // Update edited tasks indices
        setEditedTasks((prev) => {
            const newMap = new Map<number, SuggestedTask>();
            prev.forEach((task, editedIndex) => {
                if (editedIndex < index) {
                    newMap.set(editedIndex, task);
                } else if (editedIndex > index) {
                    newMap.set(editedIndex - 1, task);
                }
                // Skip the removed index
            });
            return newMap;
        });
    };

    const addSelectedTasks = async () => {
        if (selectedTasks.size === 0) {
            setError('Please select at least one task to add');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const tasksToAdd: SuggestedTask[] = [];
            selectedTasks.forEach((index) => {
                const task = editedTasks.get(index) || suggestions[index];
                tasksToAdd.push(task);
            });

            // Validate all tasks have titles
            for (const task of tasksToAdd) {
                if (!task.title || task.title.trim().length === 0) {
                    throw new Error('All tasks must have a title');
                }
            }

            // Add tasks to the todo list
            const promises = tasksToAdd.map((task) =>
                createTodo({
                    title: task.title,
                    description: task.description,
                })
            );

            await Promise.all(promises);

            // Clear suggestions and selections after successful addition
            setSuggestions([]);
            setSelectedTasks(new Set());
            setEditedTasks(new Map());
            setReasoning(undefined);

            // Call the callback to refresh the todo list
            if (onTasksAdded) {
                onTasksAdded();
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to add tasks. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearSuggestions = () => {
        setSuggestions([]);
        setSelectedTasks(new Set());
        setEditedTasks(new Map());
        setError(null);
        setReasoning(undefined);
    };

    return {
        suggestions,
        selectedTasks,
        editedTasks,
        isLoading,
        error,
        reasoning,
        generateBreakdown,
        toggleTaskSelection,
        selectAll,
        deselectAll,
        updateTask,
        removeTask,
        addSelectedTasks,
        clearSuggestions,
    };
};
