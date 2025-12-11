import React, { createContext, useContext, useState } from 'react';

interface AssignmentContextType {
  inputData: { questions: string; file: File | null };
  setInputData: (data: { questions: string; file: File | null }) => void;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export const AssignmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inputData, setInputData] = useState<{ questions: string; file: File | null }>({ questions: '', file: null });

  return (
    <AssignmentContext.Provider value={{ inputData, setInputData }}>
      {children}
    </AssignmentContext.Provider>
  );
};

export const useAssignment = () => {
  const context = useContext(AssignmentContext);
  if (!context) {
    throw new Error('useAssignment must be used within an AssignmentProvider');
  }
  return context;
};
