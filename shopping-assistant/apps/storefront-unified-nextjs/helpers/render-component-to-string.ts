import type { ReactNode } from 'react';
import ReactDOMServer from 'react-dom/server';

/**
 * Render a React component to a string of HTML markup
 *
 * @param Component - The React component to render
 * @returns The HTML markup
 */
export function renderComponentToString(Component: ReactNode) {
  return ReactDOMServer.renderToString(Component);
}
