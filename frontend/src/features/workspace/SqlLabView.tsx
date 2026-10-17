import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoLoadingSkeleton } from '@/components/ui/MonacoLoadingSkeleton';
import { Play, Send, Database, Table, CheckCircle2, XCircle, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Challenge, SqlResult, SubmitResult } from '@/types';
import { Button } from '@/components/ui/Button';

interface SqlLabViewProps {
  challenge: Challenge;
  theme: 'dark' | 'light';
  onSubmitted?: (gamification: SubmitResult['gamification']) => void;
}

export const SqlLabView: React.FC<SqlLabViewProps> = ({ challenge, theme, onSubmitted }) => {
  const { t } = useTranslation();
  const [queryCode, setQueryCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'result' | 'schema'>('result');

  // Load starter code or local draft
  useEffect(() => {
    const draftKey = `codearena_sql_draft_${challenge.slug}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      setQueryCode(saved);
    } else if (challenge.starter_code && challenge.starter_code.sql) {
      setQueryCode(challenge.starter_code.sql);
    } else {
      setQueryCode('-- Write your SQL query here\nSELECT * FROM ...;');
    }
  }, [challenge.slug]);

  const handleCodeChange = (val: string | undefined) => {
    const text = val || '';
    setQueryCode(text);
    localStorage.setItem(`codearena_sql_draft_${challenge.slug}`, text);
  };

  const handleReset = () => {
    const starter = challenge.starter_code?.sql || '-- Write your SQL query here\n';
    setQueryCode(starter);
    localStorage.setItem(`codearena_sql_draft_${challenge.slug}`, starter);
  };

  const handleRunSql = async () => {
    setIsRunning(true);
    try {
      const res = await api.post(`/challenges/${challenge.id}/run-sql`, {
        query: queryCode,
      });
      setSqlResult(res.data);
      setActiveBottomTab('result');
    } catch (err: any) {
      setSqlResult({
        success: false,
        passed: false,
        error: err.response?.data?.message || 'Failed to execute query.',
        execution_time_ms: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSql = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post(`/challenges/${challenge.id}/submit-sql`, {
        query: queryCode,
      });
      setSqlResult(res.data.result);
      setActiveBottomTab('result');
      if (res.data.gamification && onSubmitted) {
        onSubmitted(res.data.gamification);
      }
    } catch (err: any) {
      setSqlResult({
        success: false,
        passed: false,
        error: err.response?.data?.message || 'Submission error.',
        execution_time_ms: 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">SQL Query Editor</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
            SQLite Sandbox
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="text-xs text-zinc-400 hover:text-zinc-200"
            title="Reset code"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunSql}
            disabled={isRunning || isSubmitting}
            className="text-xs border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            <Play className={`w-3.5 h-3.5 mr-1 text-emerald-400 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Executing...' : 'Run Query'}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmitSql}
            disabled={isSubmitting || isRunning}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            {isSubmitting ? 'Submitting...' : 'Submit SQL'}
          </Button>
        </div>
      </div>

      {/* Editor top half */}
      <div className="flex-1 min-h-[260px] border-b border-zinc-800">
        <Editor
          height="100%"
          loading={<MonacoLoadingSkeleton />}
          language="sql"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={queryCode}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Results bottom half */}
      <div className="h-[280px] flex flex-col bg-zinc-900/40">
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/70">
          <button
            onClick={() => setActiveBottomTab('result')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activeBottomTab === 'result'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-emerald-400" />
            Query Output
            {sqlResult?.user_result && (
              <span className="text-[10px] text-zinc-400 ml-1">({sqlResult.user_result.row_count} rows)</span>
            )}
          </button>
          <button
            onClick={() => setActiveBottomTab('schema')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              activeBottomTab === 'schema'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Database Schema & Seed
          </button>
          {sqlResult && (
            <div className="ml-auto flex items-center gap-2 text-xs">
              {sqlResult.passed ? (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Passed
                </span>
              ) : sqlResult.error ? (
                <span className="flex items-center gap-1 text-red-400 font-medium">
                  <AlertCircle className="w-4 h-4" /> Syntax / Runtime Error
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <XCircle className="w-4 h-4" /> Wrong Result
                </span>
              )}
              <span className="text-zinc-500 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" /> {sqlResult.execution_time_ms}ms
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 text-xs font-mono">
          {activeBottomTab === 'schema' ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">DDL Schema</h4>
                <pre className="p-3 rounded bg-zinc-950 border border-zinc-800 text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {challenge.sql_schema || '-- No DDL schema specified'}
                </pre>
              </div>
              {challenge.sql_seed && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Initial Records Seed</h4>
                  <pre className="p-3 rounded bg-zinc-950 border border-zinc-800 text-blue-300 overflow-x-auto whitespace-pre-wrap">
                    {challenge.sql_seed}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div>
              {sqlResult?.error && (
                <div className="p-3 mb-3 rounded bg-red-950/50 border border-red-800/80 text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <div className="whitespace-pre-wrap">{sqlResult.error}</div>
                </div>
              )}

              {sqlResult?.user_result ? (
                <div className="overflow-x-auto rounded border border-zinc-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-800/80 border-b border-zinc-700 text-zinc-200">
                        {sqlResult.user_result.columns.map((col, idx) => (
                          <th key={idx} className="px-3 py-2 font-semibold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/60">
                      {sqlResult.user_result.rows.length === 0 ? (
                        <tr>
                          <td colSpan={sqlResult.user_result.columns.length || 1} className="px-3 py-4 text-center text-zinc-500 italic">
                            Empty result set (0 rows returned)
                          </td>
                        </tr>
                      ) : (
                        sqlResult.user_result.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-zinc-900/60">
                            {sqlResult.user_result?.columns.map((col, cIdx) => (
                              <td key={cIdx} className="px-3 py-1.5 text-zinc-300 whitespace-nowrap">
                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-zinc-600">NULL</span>}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : !sqlResult ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-10">
                  <Play className="w-8 h-8 mb-2 stroke-1" />
                  <p>Click "Run Query" or "Submit SQL" to evaluate your query against the isolated database.</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
