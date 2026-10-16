import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, Send, Award, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Challenge, QuizResult, SubmitResult } from '@/types';
import { Button } from '@/components/ui/Button';

interface QuizLabViewProps {
  challenge: Challenge;
  onSubmitted?: (gamification: SubmitResult['gamification']) => void;
}

export const QuizLabView: React.FC<QuizLabViewProps> = ({ challenge, onSubmitted }) => {
  const questions = challenge.quiz_data?.questions || [];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (quizResult) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(`/challenges/${challenge.id}/submit-quiz`, {
        answers: selectedAnswers,
      });
      setQuizResult(res.data);
      if (res.data.gamification && onSubmitted) {
        onSubmitted(res.data.gamification);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              {challenge.title}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Answer the multiple-choice questions below. 70% or higher is required to pass and earn XP.
            </p>
          </div>
          {quizResult && (
            <div className={`px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
              quizResult.passed
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}>
              {quizResult.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span>Score: {quizResult.score}% ({quizResult.correct_count}/{quizResult.total_questions})</span>
            </div>
          )}
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => {
            const review = quizResult?.review.find((r) => r.id === q.id);
            const isAnswered = selectedAnswers[q.id] !== undefined;

            return (
              <div
                key={q.id}
                className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-sm font-medium text-zinc-200">
                    <span className="text-indigo-400 font-bold mr-2">Q{qIndex + 1}.</span>
                    {q.question}
                  </h3>
                  {review && (
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold shrink-0 ${
                      review.is_correct
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : 'bg-red-950 text-red-400 border border-red-800/60'
                    }`}>
                      {review.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  )}
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = selectedAnswers[q.id] === optIndex;
                    const isCorrectAnswer = review && review.correct_answer === optIndex;
                    const isUserWrongAnswer = review && !review.is_correct && isSelected;

                    let optionStyle = 'border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/60 text-zinc-300';
                    if (isSelected && !review) {
                      optionStyle = 'border-indigo-500 bg-indigo-950/40 text-indigo-200 font-medium';
                    } else if (isCorrectAnswer) {
                      optionStyle = 'border-emerald-600 bg-emerald-950/60 text-emerald-200 font-medium';
                    } else if (isUserWrongAnswer) {
                      optionStyle = 'border-red-600 bg-red-950/60 text-red-200';
                    }

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIndex)}
                        className={`w-full text-left p-3 rounded-lg border text-xs flex items-center gap-3 transition-all ${optionStyle}`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-zinc-600'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {review && review.explanation && (
                  <div className="mt-3 p-3 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-300 block mb-1">Explanation:</span>
                    {review.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        {!quizResult && (
          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting || Object.keys(selectedAnswers).length < questions.length}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Evaluating Answers...' : 'Submit Answers'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
