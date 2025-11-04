import type { ReactNode } from 'react';

export type CommandEntry = {
  id: string;
  command: string;
  output: ReactNode;
  isTyping?: boolean;
  pendingComponent?: ReactNode;
};

