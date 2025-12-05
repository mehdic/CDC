/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  // Add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Styled-JSX support - augment React's JSX namespace
declare module 'react' {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}

// Timeline stubs - @mui/lab not installed due to version conflicts
declare module '@mui/lab' {
  import React from 'react';
  export const Timeline: React.FC<any>;
  export const TimelineItem: React.FC<any>;
  export const TimelineSeparator: React.FC<any>;
  export const TimelineConnector: React.FC<any>;
  export const TimelineContent: React.FC<any>;
  export const TimelineDot: React.FC<any>;
  export const TimelineOppositeContent: React.FC<any>;
}
