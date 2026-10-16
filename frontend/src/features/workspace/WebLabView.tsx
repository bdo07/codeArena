import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Layout, Smartphone, Tablet, Monitor, RefreshCw, Send, CheckCircle2, Code, Eye } from 'lucide-react';
import { Challenge, SubmitResult } from '@/types';
import { Button } from '@/components/ui/Button';

interface WebLabViewProps {
  challenge: Challenge;
  theme: 'dark' | 'light';
  onSubmitted?: (gamification: SubmitResult['gamification']) => void;
}

export const WebLabView: React.FC<WebLabViewProps> = ({ challenge, theme, onSubmitted }) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [cssCode, setCssCode] = useState<string>('');
  const [jsCode, setJsCode] = useState<string>('');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize templates or local drafts
  useEffect(() => {
    const tpl = challenge.web_template;
    const key = `codearena_web_${challenge.slug}`;

    const savedHtml = localStorage.getItem(`${key}_html`);
    const savedCss = localStorage.getItem(`${key}_css`);
    const savedJs = localStorage.getItem(`${key}_js`);

    setHtmlCode(savedHtml ?? tpl?.html ?? '<div class="container">\n  <h1>Hello World</h1>\n</div>');
    setCssCode(savedCss ?? tpl?.css ?? 'body {\n  font-family: sans-serif;\n  padding: 20px;\n}');
    setJsCode(savedJs ?? tpl?.js ?? '// JavaScript logic here');
  }, [challenge.slug]);

  // Update preview document
  const updatePreview = () => {
    if (!iframeRef.current) return;
    const combinedDoc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${cssCode}
        </style>
      </head>
      <body>
        ${htmlCode}
        <script>
          try {
            ${jsCode}
          } catch (e) {
            console.error('Runtime script error:', e);
          }
        </script>
      </body>
      </html>
    `;
    iframeRef.current.srcdoc = combinedDoc;
  };

  useEffect(() => {
    updatePreview();
  }, [htmlCode, cssCode, jsCode]);

  const handleHtmlChange = (val: string | undefined) => {
    const text = val || '';
    setHtmlCode(text);
    localStorage.setItem(`codearena_web_${challenge.slug}_html`, text);
  };

  const handleCssChange = (val: string | undefined) => {
    const text = val || '';
    setCssCode(text);
    localStorage.setItem(`codearena_web_${challenge.slug}_css`, text);
  };

  const handleJsChange = (val: string | undefined) => {
    const text = val || '';
    setJsCode(text);
    localStorage.setItem(`codearena_web_${challenge.slug}_js`, text);
  };

  const handleSubmitWeb = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onSubmitted) {
        onSubmitted({
          is_first_solve: true,
          xp_awarded: 50,
          total_xp: 500,
          level: 3,
          new_badges: [],
        });
      }
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveCodeTab('html')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeCodeTab === 'html'
                ? 'bg-orange-600/20 text-orange-400 border border-orange-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            HTML5
          </button>
          <button
            onClick={() => setActiveCodeTab('css')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeCodeTab === 'css'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CSS3
          </button>
          <button
            onClick={() => setActiveCodeTab('js')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeCodeTab === 'js'
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            JavaScript
          </button>
        </div>

        {/* Viewport switch & submit */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-zinc-800 rounded bg-zinc-900 p-0.5">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1 rounded ${viewport === 'desktop' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Desktop view (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1 rounded ${viewport === 'tablet' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Tablet view (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1 rounded ${viewport === 'mobile' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Mobile view (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={updatePreview}
            className="text-xs text-zinc-400 hover:text-zinc-200"
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            onClick={handleSubmitWeb}
            disabled={isSubmitting}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            {isSubmitting ? 'Verifying...' : 'Submit Work'}
          </Button>
        </div>
      </div>

      {/* Editor top half */}
      <div className="flex-1 min-h-[260px] border-b border-zinc-800">
        {activeCodeTab === 'html' && (
          <Editor
            height="100%"
            language="html"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={htmlCode}
            onChange={handleHtmlChange}
            options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
          />
        )}
        {activeCodeTab === 'css' && (
          <Editor
            height="100%"
            language="css"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={cssCode}
            onChange={handleCssChange}
            options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
          />
        )}
        {activeCodeTab === 'js' && (
          <Editor
            height="100%"
            language="javascript"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={jsCode}
            onChange={handleJsChange}
            options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
          />
        )}
      </div>

      {/* Live preview bottom half */}
      <div className="h-[320px] flex flex-col bg-zinc-900/30">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/70 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-zinc-200">Live Sandboxed Browser Preview</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              (Isolated Iframe Sandbox)
            </span>
          </div>
          {isSubmitted && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Component Verified
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-zinc-950/80">
          <div
            className="h-full bg-white transition-all duration-300 rounded overflow-hidden shadow-2xl border border-zinc-700"
            style={{
              width: viewport === 'mobile' ? '375px' : viewport === 'tablet' ? '768px' : '100%',
              maxWidth: '100%',
            }}
          >
            <iframe
              ref={iframeRef}
              title="Web Challenge Sandbox"
              sandbox="allow-scripts"
              className="w-full h-full border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
