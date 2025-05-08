declare module 'react-syntax-highlighter' {
  import * as React from 'react';
  export interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  export class Prism extends React.Component<SyntaxHighlighterProps> {}
  export default Prism;
} 