'use client';
import type { SfInputProps } from '@storefront-ui/react';
import { SfIconVisibility, SfIconVisibilityOff, SfInput } from '@storefront-ui/react';
import { useToggle } from 'react-use';

export interface PasswordInputProps extends SfInputProps {}

export default function PasswordInput({ ...rest }: PasswordInputProps) {
  const [isPasswordVisible, togglePasswordVisible] = useToggle(false);

  return (
    <SfInput
      pattern="(?=.*\d)(?=.*[a-zA-Z]).{8,}"
      slotSuffix={
        <button onClick={togglePasswordVisible} type="button">
          {isPasswordVisible ? <SfIconVisibilityOff /> : <SfIconVisibility />}
        </button>
      }
      type={isPasswordVisible ? 'text' : 'password'}
      {...rest}
    />
  );
}
