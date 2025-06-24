'use client';

import { type HTMLProps, useRef } from 'react';

export type NewsletterBoxFormProps = HTMLProps<HTMLFormElement>;

export default function NewsletterBoxForm({ children, ...rest }: NewsletterBoxFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  async function formAction(_formData: FormData) {
    /*
     * Here you can send the form data to your API, e.g.
     *
     * const email = _formData.get('email');
     * await fetch('/api/newsletter', {
     *  method: 'POST',
     *  body: JSON.stringify({ email }),
     * })
     */
    formRef.current?.reset();
  }
  return (
    <form action={formAction} ref={formRef} {...rest}>
      {children}
    </form>
  );
}
