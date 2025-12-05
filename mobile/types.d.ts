/**
 * Type Declarations for Third-Party Libraries
 * Provides type definitions for libraries without @types support
 */

declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    allowFontScaling?: boolean;
  }

  class Icon extends Component<IconProps> {}
  export = Icon;
}
