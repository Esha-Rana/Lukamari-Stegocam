/**
 * Avatar component — shows avatar_url image or initials fallback.
 * @param {{ name?: string, avatarUrl?: string|null, size?: 'sm'|'md'|'lg'|'xl' }} props
 */
export default function Avatar({ name = '', avatarUrl = null, size = 'md' }) {
  const initials = name
    .trim()
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const cls = `${sizeClasses[size] ?? sizeClasses.md} rounded-full flex items-center justify-center font-semibold select-none shrink-0`;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${cls} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${cls} bg-gradient-to-br from-purple-600 to-indigo-700 text-white`}
    >
      {initials || '?'}
    </div>
  );
}
