/// <reference types="vite/client" />

// Import React to make this a proper module augmentation
import 'react';

// Styled-JSX support - augment React's HTMLAttributes
declare module 'react' {
  interface HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
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
