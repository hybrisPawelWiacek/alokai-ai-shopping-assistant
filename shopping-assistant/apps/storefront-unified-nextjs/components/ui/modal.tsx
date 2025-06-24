'use client';
import { PropsWithStyle, SfButton, SfButtonProps, SfIconClose, SfModal, type SfModalProps } from '@storefront-ui/react';
import classNames from 'classnames';
import { parseAsString, useQueryState } from 'nuqs';
import type { PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';
import { useLockBodyScroll } from 'react-use';

import Overlay from './overlay';
import type { OverlayProps } from './overlay';

interface ModalContextType {
  onClose: () => void;
}

const ModalContext = createContext<ModalContextType>(undefined!);

export interface ModalProps extends Omit<SfModalProps, 'open'> {
  /**
   * Props which could be passed to the overlay component.
   */
  overlayProps?: OverlayProps;
  /**
   * The query parameter name which will be used to trigger the modal.
   * If the query parameter is not provided, the modal will be always open,
   * otherwise it will be open only when the query parameter is set.
   */
  queryParamTrigger?: string;
}

function Modal({
  children,
  className,
  onClose: controlledOnClose,
  overlayProps,
  queryParamTrigger,
  ...rest
}: ModalProps) {
  const [isTriggeredByQueryParam, setQueryParam] = useQueryState(`${queryParamTrigger}`, parseAsString);
  const isModalOpen = !queryParamTrigger || !!isTriggeredByQueryParam;
  useLockBodyScroll(isModalOpen);

  if (!isModalOpen) {
    return null;
  }

  const onClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    }
    if (isTriggeredByQueryParam) {
      setQueryParam(null);
    }
  };

  return (
    <ModalContext.Provider value={{ onClose }}>
      <Overlay onClick={onClose} {...overlayProps}>
        <SfModal
          as="section"
          className={classNames('relative overflow-hidden', className)}
          onClick={(e) => e.stopPropagation()}
          open
          role="dialog"
          {...rest}
          onClose={onClose}
        >
          {children}
        </SfModal>
      </Overlay>
    </ModalContext.Provider>
  );
}

export default Modal;

type ModalCloseProps = SfButtonProps;

export function ModalClose({ className, ...rest }: ModalCloseProps) {
  const { onClose } = useContext(ModalContext);

  return (
    <SfButton
      className={classNames('absolute right-2 top-2 !text-neutral-500', className)}
      data-testid="close-modal"
      onClick={onClose}
      square
      variant="tertiary"
      {...rest}
    >
      <SfIconClose />
    </SfButton>
  );
}

interface ModalHeaderProps extends PropsWithChildren, PropsWithStyle {}

export function ModalHeader({ children, className, ...rest }: ModalHeaderProps) {
  return (
    <header className={classNames('mb-6', className)} data-testid="modal-header" {...rest}>
      <h3 className="font-semibold text-neutral-900 typography-headline-4 md:typography-headline-2">{children}</h3>
    </header>
  );
}

interface ModalActionsProps extends PropsWithChildren, PropsWithStyle {}

export function ModalActions({ children, className, ...rest }: ModalActionsProps) {
  return (
    <div
      className={classNames('mt-6 flex flex-col-reverse justify-end gap-4 md:flex-row', className)}
      data-testid="modal-action"
      {...rest}
    >
      {children}
    </div>
  );
}

interface ModalCancelProps extends SfButtonProps {}

export function ModalCancel({ children, ...rest }: ModalCancelProps) {
  const { onClose } = useContext(ModalContext);

  return (
    <SfButton data-testid="form-cancel" onClick={onClose} variant="secondary" {...rest}>
      {children}
    </SfButton>
  );
}
