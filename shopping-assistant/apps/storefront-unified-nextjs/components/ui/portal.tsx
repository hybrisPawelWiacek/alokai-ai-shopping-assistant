'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ children }: React.PropsWithChildren) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(<>{children}</>, document.body) : null;
}
