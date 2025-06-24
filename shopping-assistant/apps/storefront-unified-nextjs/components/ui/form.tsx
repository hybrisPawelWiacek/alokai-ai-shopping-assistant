'use client';
import type { PropsWithStyle, SfButtonProps } from '@storefront-ui/react';
import { SfButton, SfLoaderCircular } from '@storefront-ui/react';
import classNames from 'classnames';
import { type HTMLProps, type PropsWithChildren, useRef } from 'react';
import { useFormStatus } from 'react-dom';

export interface FormProps extends HTMLProps<HTMLFormElement>, PropsWithChildren {
  /**
   * If true, the form will be reset after action promise resolves
   */
  resetOnSubmit?: boolean;
}

function Form({ action, children, resetOnSubmit, ...rest }: FormProps) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      {...rest}
      action={
        typeof action === 'function'
          ? async (formData) => {
              action(formData);
              if (resetOnSubmit) {
                form.current?.reset();
              }
            }
          : action
      }
    >
      {children}
    </form>
  );
}

export default Form;

export interface FormLabelProps extends PropsWithChildren, PropsWithStyle {}

export function FormLabel({ children, className }: FormLabelProps) {
  return (
    <span className={classNames('pb-0.5 text-sm font-medium', className)} data-testid="form-label">
      {children}
    </span>
  );
}

export interface FormSubmitProps extends SfButtonProps {
  /**
   * If true, the button will be disabled and a loader will be shown
   * Component is uncontrolled by default, but you can pass this prop to make it controlled
   */
  pending?: boolean;
}

export function FormSubmit({ children, className, pending: controlledPending, ...rest }: FormSubmitProps) {
  const { pending: uncontrolledPending } = useFormStatus();
  const pending = controlledPending ?? uncontrolledPending;

  return (
    <SfButton
      className={classNames('relative min-w-[120px]', className)}
      data-testid="save"
      disabled={pending}
      type="submit"
      variant="primary"
      {...rest}
    >
      {pending && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <SfLoaderCircular />
        </div>
      )}
      <div className={classNames(pending && 'opacity-0')}>{children}</div>
    </SfButton>
  );
}

export type FormHelperTextProps = PropsWithChildren;

export function FormHelperText({ children }: FormHelperTextProps) {
  return <p className="mt-0.5 text-neutral-500 typography-text-xs">{children}</p>;
}
