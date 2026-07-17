export default function PasswordStrength({ password }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Weak',   color: 'bg-red-500',    text: 'text-red-400',    width: 'w-1/4' },
    { label: 'Fair',   color: 'bg-yellow-500',  text: 'text-yellow-400', width: 'w-2/4' },
    { label: 'Good',   color: 'bg-blue-500',    text: 'text-blue-400',   width: 'w-3/4' },
    { label: 'Strong', color: 'bg-green-500',   text: 'text-green-400',  width: 'w-full' },
  ];
  const { label, color, text, width } = levels[Math.min(score - 1, 3)] ?? levels[0];

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-700/50 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${color} ${width}`} />
      </div>
      <p className={`text-xs mt-1 font-medium ${text}`}>{label} password</p>
    </div>
  );
}
