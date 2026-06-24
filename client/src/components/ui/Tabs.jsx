import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

export const Tabs = RadixTabs.Root;

export function TabsList({ className, children, ...props }) {
  return (
    <RadixTabs.List
      className={cn(
        'inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full overflow-x-auto',
        className
      )}
      {...props}
    >
      {children}
    </RadixTabs.List>
  );
}

export function TabsTrigger({ className, children, ...props }) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background',
        'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
        className
      )}
      {...props}
    >
      {children}
    </RadixTabs.Trigger>
  );
}

export function TabsContent({ className, children, ...props }) {
  return (
    <RadixTabs.Content
      className={cn(
        'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      {children}
    </RadixTabs.Content>
  );
}
