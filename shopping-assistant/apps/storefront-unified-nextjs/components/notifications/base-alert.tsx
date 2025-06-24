'use client';

import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

import Alert from '@/components/ui/alert';
import type { AlertProps } from '@/components/ui/alert';

export default function BaseAlert({ children, slotPrefix, slotSuffix, variant, ...rest }: AlertProps) {
  const nodeRef = useRef(null);

  return (
    <CSSTransition classNames="fade-in" nodeRef={nodeRef} timeout={100} {...rest}>
      <div className="w-full" ref={nodeRef}>
        <Alert
          className="pointer-events-auto shadow-md"
          slotPrefix={slotPrefix}
          slotSuffix={slotSuffix}
          variant={variant}
        >
          {children}
        </Alert>
      </div>
    </CSSTransition>
  );
}
