'use client';
import { SfButton } from '@storefront-ui/react';
import classNames from 'classnames';
import { cloneElement, useState } from 'react';
import { useToggle } from 'react-use';

import Form, { FormSubmit } from './ui/form';
import type { ModalProps } from './ui/modal';
import Modal, { ModalActions, ModalClose } from './ui/modal';

export interface ConfirmationModalProps extends Omit<ModalProps, 'onClose'> {
  /**
   * Cancel button label.
   */
  cancelLabel?: string;
  /**
   * Confirm button label.
   */
  confirmLabel?: string;
  /**
   * On confirm callback.
   */
  onConfirm: () => Promise<void>;
  /**
   * An element that will trigger the modal.
   */
  trigger: React.ReactElement;
}

export function ConfirmationModal({
  cancelLabel,
  children,
  className,
  confirmLabel,
  onConfirm,
  trigger,
  ...rest
}: ConfirmationModalProps) {
  const [isOpen, toggle] = useToggle(false);
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <>
      {cloneElement(trigger, { onClick: toggle })}

      {isOpen && (
        <Modal
          className={classNames('w-[320px] md:w-[480px]', className)}
          data-testid="modal"
          onClose={toggle}
          {...rest}
        >
          <ModalClose />
          <Form
            onSubmit={async (event) => {
              event.preventDefault();
              setIsConfirming(true);
              try {
                await onConfirm();
              } finally {
                setIsConfirming(false);
                toggle();
              }
            }}
          >
            {children}
            <ModalActions>
              <SfButton className="w-full md:w-auto" data-testid="form-cancel" onClick={close} variant="secondary">
                {cancelLabel}
              </SfButton>
              <FormSubmit className="w-full md:w-auto" data-testid="confirm" pending={isConfirming}>
                {confirmLabel}
              </FormSubmit>
            </ModalActions>
          </Form>
        </Modal>
      )}
    </>
  );
}
