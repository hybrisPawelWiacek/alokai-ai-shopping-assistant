import classNames from 'classnames';

export interface DividerProps {
  /**
   * Optional class to apply to the Divider.
   */
  className?: string;
}

export default function Divider({ className }: DividerProps) {
  return <hr className={classNames('h-px w-full bg-neutral-200', className)} />;
}
