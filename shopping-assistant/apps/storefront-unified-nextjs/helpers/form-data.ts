import { mapValues } from 'lodash-es';

const mapEmptyStringsToNulls = (value: unknown) => (value === '' ? null : value);

/**
 * @description Get form data as an object from a form element.
 *
 * @param form - The form element.
 *
 * @returns The form data as an object.
 *
 * @example Resolve form data from a form element.
 * function onSubmit(event: React.FormEvent<HTMLFormElement>) {
 *  event.preventDefault();
 *  const payload = resolveFormData<RegisterCustomerArgs>(event.currentTarget);
 *  mutation.mutate(payload);
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- by default we don't know the shape of the form data
export function resolveFormData<T = any>(form: HTMLFormElement) {
  const formData = new FormData(form);
  const formState = Object.fromEntries(formData.entries());

  return mapValues(formState, mapEmptyStringsToNulls) as T;
}
