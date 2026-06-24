import { cn, getInitials, stringToColor } from '../../lib/utils';

export function Avatar({ name, src, size = 'md', className }) {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
    xl: 'h-14 w-14 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full text-white font-semibold select-none shrink-0',
        stringToColor(name || '?'),
        sizes[size],
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
