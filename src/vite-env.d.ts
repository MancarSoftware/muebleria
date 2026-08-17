/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
    'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      'ios-src'?: string;
      alt?: string;
      ar?: boolean;
      'ar-modes'?: string;
      'ar-scale'?: string;
      'ar-placement'?: string;
      'camera-controls'?: boolean;
      'auto-rotate'?: boolean;
      'shadow-intensity'?: string;
      'environment-image'?: string;
      exposure?: string;
      'interaction-prompt'?: string;
      'touch-action'?: string;
      'camera-orbit'?: string;
    };
    }
  }
}
