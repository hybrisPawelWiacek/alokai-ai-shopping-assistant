'use client';
import { createContext, useContext, useState } from 'react';

import type { AccordionProps } from './accordion';

export const AccordionContext = createContext<{
  /**
   * Method to check if an accordion item is open
   */
  isOpen(id: number | string): boolean;
  /**
   * Opened accordion items
   */
  opened: (number | string)[];
  /**
   * Method to toggle an accordion item
   */
  toggle(id: number | string, open: boolean): void;
}>(undefined!);

export interface AccordionContextProps extends Pick<AccordionProps, 'allowMultipleOpen' | 'children'> {
  /**
   * Initial opened accordion items
   */
  active?: (number | string)[];
}

export default function AccordionProvider({ active = [], allowMultipleOpen, children }: AccordionContextProps) {
  const [opened, setOpened] = useState<(number | string)[]>(active);

  function isOpen(id: number | string) {
    return opened.includes(id);
  }

  function toggle(id: number | string, open: boolean) {
    if (open) {
      if (!allowMultipleOpen) {
        setOpened([id]);
      } else {
        setOpened((prevOpened) => [...prevOpened, id]);
      }
    } else if (isOpen(id)) {
      setOpened((prevOpened) => prevOpened.filter((openedId) => openedId !== id));
    }
  }
  return (
    <AccordionContext.Provider
      value={{
        isOpen,
        opened,
        toggle,
      }}
    >
      {children}
    </AccordionContext.Provider>
  );
}

export const useAccordion = () => {
  const contextData = useContext(AccordionContext);

  if (!contextData) {
    throw new Error('useAccordion must be used within a AccordionProvider');
  }

  return contextData;
};
