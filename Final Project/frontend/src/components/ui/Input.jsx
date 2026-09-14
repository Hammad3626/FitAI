// Simple Input component
export function Input({ type = 'text', className = '', placeholder, value, onChange, disabled = false, ...props }) {
  return (
    <input
      type={type}
      className={`w-full bg-input/60 text-foreground rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed ${ className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      {...props}
    />
  );
}
