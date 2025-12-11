export interface AssignmentState {
  questions: string;
  file: File | null;
  isLoading: boolean;
  currentTask?: string;
  result: string | null;
  error: string | null;
}

export interface HeaderProps {
  onReset: () => void;
}