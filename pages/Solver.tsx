import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Send, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { useAssignment } from '../context/AssignmentContext';

// 20MB Limit for Gemini Flash Inline Data
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const Solver: React.FC = () => {
  const navigate = useNavigate();
  const { setInputData } = useAssignment();
  
  const [questions, setQuestions] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
        setError(`File is too large (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is 20MB.`);
        return;
    }

    if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Only PDF or Image files are supported.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!questions.trim() && !file) {
      setError("Please enter questions or upload a question paper PDF.");
      return;
    }

    // Save to context and navigate
    setInputData({ questions, file });
    navigate('/result');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-brand-600 px-8 py-6">
           <h2 className="text-2xl font-bold text-white">New Assignment</h2>
           <p className="text-brand-100 mt-1">Upload your question paper or paste questions to get started.</p>
        </div>
        
        <div className="p-8 flex flex-col gap-8">
          {/* File Upload Area */}
          <div>
            <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-semibold text-gray-900">Upload Question Paper (PDF)</label>
                 <span className="text-xs text-gray-500 font-medium">Max size: 20MB</span>
            </div>
            <div 
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-300 min-h-[160px]
                ${isDragging ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-100 scale-[1.01]' : ''}
                ${!isDragging && file ? 'border-brand-200 bg-brand-50/50' : ''}
                ${!isDragging && !file ? 'border-gray-200 hover:border-brand-400 hover:bg-gray-50' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/*"
                className="hidden"
                id="file-upload"
              />
              
              {!file ? (
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                    <Upload className={`h-6 w-6 ${isDragging ? 'text-brand-600' : 'text-gray-400'}`} />
                  </div>
                  <span className="text-base font-semibold text-gray-900">{isDragging ? 'Drop file here' : 'Click to upload'}</span>
                  <span className="text-sm text-gray-500 mt-1 text-center max-w-xs">{isDragging ? 'Release to upload' : 'or drag and drop PDF/Images'}</span>
                </label>
              ) : (
                <div className="flex items-center justify-between w-full max-w-md bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-brand-100 p-2 rounded-lg">
                      <FileText className="h-6 w-6 text-brand-600 flex-shrink-0" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                       <span className="text-sm font-semibold text-gray-900 truncate">{file.name}</span>
                       <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button onClick={handleClearFile} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Text Input */}
          <div className="flex-grow flex flex-col">
            <label htmlFor="questions" className="block text-sm font-semibold text-gray-900 mb-2">
              Paste Questions Manually
            </label>
            <textarea
              id="questions"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="e.g. Q1. Discuss the impact of Green Revolution in India. (20 marks)..."
              className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm p-4 border resize-y min-h-[150px] transition-shadow duration-200 focus:shadow-md"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <Button 
              onClick={handleSubmit} 
              className="w-full py-3 text-base shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transform transition-all active:scale-[0.98]"
              disabled={!questions && !file}
            >
              <Send size={18} className="mr-2" />
              Start Solving Assignment
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500 max-w-md mx-auto">
        <p>This AI tool generates academic answers based on IGNOU study materials. Please review and verify all content.</p>
      </div>
    </div>
  );
};