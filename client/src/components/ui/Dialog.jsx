import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Dialog({ children, ...props }) {
  return <RadixDialog.Root {...props}>{children}</RadixDialog.Root>;
}

export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({ children, className, title, description, ...props }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <RadixDialog.Content
        className={cn(
          'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
          'bg-card border border-border rounded-xl shadow-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
          'p-6 max-h-[90vh] overflow-y-auto',
          className
        )}
        {...props}
      >
        {title && (
          <RadixDialog.Title className="text-lg font-semibold mb-1">{title}</RadixDialog.Title>
        )}
        {description && (
          <RadixDialog.Description className="text-sm text-muted-foreground mb-4">{description}</RadixDialog.Description>
        )}
        {children}
        <RadixDialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring transition-opacity">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const DialogClose = RadixDialog.Close;
