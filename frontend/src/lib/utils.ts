/**
 * Utility function to conditionally join classNames together
 * Similar to the classnames or clsx libraries
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
} 