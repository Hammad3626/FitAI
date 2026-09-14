// Simple Button component
export function Button({ children, className = '', disabled = false, variant = 'primary', size = 'md', ...props }) {
  const baseClass = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[oklch(0.62_0.22_275)] to-[oklch(0.74_0.18_285)] text-primary-foreground hover:opacity-90 shadow-glow',
    outline: 'border border-border text-foreground hover:bg-secondary/60',
    ghost: 'text-foreground hover:bg-secondary/40',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
