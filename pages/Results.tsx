import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Download, Copy, Check, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { useAssignment } from '../context/AssignmentContext';
import { generateAssignment } from '../services/geminiService';

export const Results: React.FC = () => {
  const navigate = useNavigate();
  const { inputData } = useAssignment();
  
  const [result, setResult] = useState<string>('');
  const [status, setStatus] = useState<string>('Initializing...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const outputEndRef = useRef<HTMLDivElement>(null);
  const isGeneratingRef = useRef<boolean>(false);

  useEffect(() => {
    // Redirect if no input data
    if (!inputData.questions && !inputData.file) {
      navigate('/');
      return;
    }

    // Prevent double invocation in StrictMode
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    const startGeneration = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await generateAssignment(
          inputData.questions, 
          inputData.file, 
          (partialResult, currentStatus) => {
            setResult(partialResult);
            setStatus(currentStatus);
            // Auto-scroll
            if (outputEndRef.current) {
                outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }
        );
        
        setIsLoading(false);
        setStatus('Completed');
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during generation.");
        setIsLoading(false);
        setStatus('Error');
      }
    };

    startGeneration();
  }, [inputData, navigate]);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'IGNOU_Assignment_Solution.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    if (isLoading) {
      if (window.confirm("Generation is in progress. Are you sure you want to go back? This will stop the current task.")) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Header / Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            title="Back to Input"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assignment Solutions</h1>
            <div className="flex items-center gap-2 mt-0.5">
               {isLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-brand-600" />
                    <span className="text-xs text-brand-600 font-medium">{status}</span>
                  </>
               ) : error ? (
                 <span className="text-xs text-red-600 font-medium">Generation Failed</span>
               ) : (
                 <span className="text-xs text-green-600 font-medium">Generation Complete</span>
               )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
           {error && (
             <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
               <RefreshCw size={16} className="mr-2" /> Retry
             </Button>
           )}
           <Button variant="outline" size="sm" onClick={handleCopy} disabled={!result} className="hidden sm:flex">
             {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
             {copied ? 'Copied' : 'Copy Text'}
           </Button>
           <Button variant="primary" size="sm" onClick={handleDownload} disabled={!result}>
             <Download size={16} className="mr-2" /> Download Markdown
           </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-hidden relative">
        <div className="h-full overflow-y-auto px-4 sm:px-8 py-8 max-w-5xl mx-auto">
           {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center text-center mt-10">
                 <div className="bg-red-100 p-3 rounded-full mb-4">
                    <Loader2 className="h-8 w-8 text-red-500" /> 
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
                 <p className="text-gray-600 mb-6 max-w-md">{error}</p>
                 <Button onClick={() => navigate('/')} variant="outline">Try Again</Button>
              </div>
           ) : !result && isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 mt-20 space-y-6">
                 <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-brand-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
                 </div>
                 <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">Generating Answers...</h3>
                    <p className="text-gray-500">{status}</p>
                 </div>
              </div>
           ) : (
              <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
                 <div className="markdown-body">
                    <ReactMarkdown>{result}</ReactMarkdown>
                 </div>
                 <div ref={outputEndRef} className="h-4" />
                 
                 {isLoading && (
                    <div className="flex items-center justify-center py-8">
                       <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                          <Loader2 size={16} className="animate-spin text-brand-600" />
                          <span className="text-sm text-gray-600">Writing next section...</span>
                       </div>
                    </div>
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
