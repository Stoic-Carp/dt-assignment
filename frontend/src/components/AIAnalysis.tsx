import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Brain, Lightbulb, Target, X, AlertCircle } from 'lucide-react';
import type { Todo, AIAnalysisResponse } from '../types';
import { analyzeWithAI } from '../services/ai';
import { clsx } from 'clsx';

interface AIAnalysisProps {
    todos: Todo[];
}

const LOADING_MESSAGES = [
    "🧠 Waking up the AI brain...",
    "🔍 Finding patterns in your tasks...",
    "📊 Analyzing task complexity...",
    "💡 Generating insights...",
    "🎯 Prioritizing recommendations...",
    "✨ Polishing suggestions...",
    "🚀 Almost ready..."
];

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ todos }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    // Cycle through loading messages 
    useEffect(() => {
        if (!isAnalyzing) {
            setLoadingMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2500);

        return () => clearInterval(interval);
    }, [isAnalyzing]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);

        try {
            const result = await analyzeWithAI(todos);
            setAnalysis(result);
            setIsExpanded(true);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to analyze todos with AI';
            setError(errorMessage);
            setAnalysis(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClose = () => {
        setIsExpanded(false);
        setError(null);
    };

    return (
        <div className="space-y-4">
            {/* AI Analysis Button */}
            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={clsx(
                    "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg",
                    isAnalyzing
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white cursor-wait"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:shadow-xl hover:scale-[1.02]"
                )}
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{LOADING_MESSAGES[loadingMessageIndex]}</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        <span>AI Analyze Tasks</span>
                        <Brain className="w-5 h-5" />
                    </>
                )}
            </button>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-slide-up">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-red-900 mb-1">Analysis Failed</h4>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            {isExpanded && analysis && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 shadow-xl animate-slide-up">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">AI Insights</h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="mb-6 p-4 bg-white/70 rounded-xl border border-purple-100">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-1">Summary</h4>
                                <p className="text-slate-700 leading-relaxed">{analysis.summary}</p>
                            </div>
                        </div>
                    </div>

                    {/* Insights */}
                    {analysis.insights && analysis.insights.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-5 h-5 text-yellow-600" />
                                <h4 className="font-semibold text-slate-900">Key Insights</h4>
                            </div>
                            <ul className="space-y-2">
                                {analysis.insights.map((insight, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-purple-100"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-2"></span>
                                        <span className="text-slate-700 text-sm leading-relaxed flex-1">
                                            {insight}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Priority Suggestions */}
                    {analysis.prioritySuggestions && analysis.prioritySuggestions.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="w-5 h-5 text-indigo-600" />
                                <h4 className="font-semibold text-slate-900">Priority Suggestions</h4>
                            </div>
                            <ul className="space-y-2">
                                {analysis.prioritySuggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-indigo-100"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                            {index + 1}
                                        </span>
                                        <span className="text-slate-700 text-sm leading-relaxed flex-1">
                                            {suggestion}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
