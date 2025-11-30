import React, { useState } from 'react';
import { Wand2, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { SuggestedTask } from '../types';
import { TaskSuggestionsList } from './TaskSuggestionsList';

interface TaskBreakdownProps {
    suggestions: SuggestedTask[];
    selectedTasks: Set<number>;
    editedTasks: Map<number, SuggestedTask>;
    isLoading: boolean;
    error: string | null;
    reasoning: string | undefined;
    onGenerate: (goal: string, context?: string, maxTasks?: number) => Promise<void>;
    onToggleSelection: (index: number) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onUpdateTask: (index: number, updates: Partial<SuggestedTask>) => void;
    onRemoveTask: (index: number) => void;
    onAddSelected: () => Promise<void>;
    onClear: () => void;
}

const LOADING_MESSAGES = [
    "🧠 Thinking about your goal...",
    "🔍 Breaking down into tasks...",
    "📋 Organizing steps...",
    "💡 Adding details...",
    "🎯 Prioritizing tasks...",
    "✨ Finalizing suggestions...",
];

export const TaskBreakdown: React.FC<TaskBreakdownProps> = ({
    suggestions,
    selectedTasks,
    editedTasks,
    isLoading,
    error,
    reasoning,
    onGenerate,
    onToggleSelection,
    onSelectAll,
    onDeselectAll,
    onUpdateTask,
    onRemoveTask,
    onAddSelected,
    onClear,
}) => {
    const [goal, setGoal] = useState('');
    const [context, setContext] = useState('');
    const [showContext, setShowContext] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Cycle through loading messages
    React.useEffect(() => {
        if (!isLoading) {
            setLoadingMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [isLoading]);

    // Auto-expand when there are suggestions or errors
    React.useEffect(() => {
        if (suggestions.length > 0 || error) {
            setIsExpanded(true);
        }
    }, [suggestions.length, error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!goal.trim() || isLoading) return;

        await onGenerate(goal.trim(), context.trim() || undefined);
    };

    const handleClear = () => {
        setGoal('');
        setContext('');
        setShowContext(false);
        onClear();
    };

    return (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            {/* Collapsed Header Button */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-emerald-50/50 transition-colors duration-200"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Wand2 className="w-6 h-6 text-emerald-600" />
                            <Sparkles className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-lg font-bold text-slate-900">Break Down a Goal into Tasks</h2>
                            <p className="text-sm text-slate-600">Use AI to generate actionable sub-tasks</p>
                        </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                </button>
            )}

            {/* Expanded Form */}
            {isExpanded && (
                <div className="space-y-6 p-6">
                    {/* Header with Collapse Button */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Wand2 className="w-6 h-6 text-emerald-600" />
                                <h2 className="text-xl font-bold text-slate-900">Break Down a Goal</h2>
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                            </div>
                            <p className="text-sm text-slate-600">
                                Describe what you want to accomplish, and AI will suggest actionable sub-tasks
                            </p>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            disabled={isLoading}
                            className="ml-4 p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Collapse"
                        >
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="goal" className="block text-sm font-semibold text-slate-700 mb-2">
                        What do you want to accomplish?
                    </label>
                    <input
                        type="text"
                        id="goal"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., Plan a weekend camping trip"
                        disabled={isLoading}
                        className={clsx(
                            "w-full px-4 py-3 rounded-xl border-2 transition-all duration-200",
                            "focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500",
                            "disabled:bg-slate-100 disabled:cursor-not-allowed",
                            error ? "border-red-300" : "border-slate-200"
                        )}
                        maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-1">
                        <button
                            type="button"
                            onClick={() => setShowContext(!showContext)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            {showContext ? '− Hide' : '+ Add'} additional context (optional)
                        </button>
                        <span className="text-xs text-slate-500">{goal.length}/500</span>
                    </div>
                </div>

                {showContext && (
                    <div className="animate-slide-up">
                        <label htmlFor="context" className="block text-sm font-semibold text-slate-700 mb-2">
                            Additional context
                        </label>
                        <textarea
                            id="context"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="e.g., For a group of 4 people, in the mountains"
                            disabled={isLoading}
                            rows={3}
                            className={clsx(
                                "w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none",
                                "focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500",
                                "disabled:bg-slate-100 disabled:cursor-not-allowed",
                                "border-slate-200"
                            )}
                            maxLength={500}
                        />
                        <div className="text-right mt-1">
                            <span className="text-xs text-slate-500">{context.length}/500</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={isLoading || !goal.trim() || goal.trim().length < 5}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg",
                            isLoading || !goal.trim() || goal.trim().length < 5
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white hover:shadow-xl hover:scale-[1.02]"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>{LOADING_MESSAGES[loadingMessageIndex]}</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                <span>Generate Sub-tasks</span>
                            </>
                        )}
                    </button>

                    {(suggestions.length > 0 || error) && (
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={isLoading}
                            className="px-6 py-4 rounded-xl font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slide-up">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-red-900 mb-1">Failed to Generate Tasks</h4>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

                    {/* Suggestions List */}
                    {suggestions.length > 0 && !error && (
                        <TaskSuggestionsList
                            suggestions={suggestions}
                            selectedTasks={selectedTasks}
                            editedTasks={editedTasks}
                            reasoning={reasoning}
                            isAddingTasks={isLoading}
                            onToggleSelection={onToggleSelection}
                            onSelectAll={onSelectAll}
                            onDeselectAll={onDeselectAll}
                            onUpdateTask={onUpdateTask}
                            onRemoveTask={onRemoveTask}
                            onAddSelected={onAddSelected}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
