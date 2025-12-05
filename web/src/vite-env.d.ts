/// <reference types="vite/client" />

// Make this file a module
export {};

// Styled-JSX support - augment React's intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      style: React.DetailedHTMLProps<React.StyleHTMLAttributes<HTMLStyleElement> & {
        jsx?: boolean;
        global?: boolean;
      }, HTMLStyleElement>;
    }
  }
}

// Timeline stubs - @mui/lab not installed due to version conflicts
declare module '@mui/lab' {
  import { FC } from 'react';
  export const Timeline: FC<any>;
  export const TimelineItem: FC<any>;
  export const TimelineSeparator: FC<any>;
  export const TimelineConnector: FC<any>;
  export const TimelineContent: FC<any>;
  export const TimelineDot: FC<any>;
  export const TimelineOppositeContent: FC<any>;
}
