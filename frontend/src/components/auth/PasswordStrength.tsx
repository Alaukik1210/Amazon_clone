interface PasswordStrengthProps {
  password: string;
}

type Strength = { label: string; color: string; bars: number };

function getStrength(password: string): Strength {
  if (!password) return { label: "", color: "", bars: 0 };
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak",   color: "bg-red-500",    bars: 1 };
  if (score <= 3) return { label: "Fair",   color: "bg-yellow-400", bars: 2 };
  if (score <= 4) return { label: "Good",   color: "bg-blue-500",   bars: 3 };
  return             { label: "Strong", color: "bg-green-500",  bars: 4 };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              bar <= strength.bars ? strength.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--amazon-text-muted)]">
        Password strength: <span className="font-semibold">{strength.label}</span>
      </p>
    </div>
  );
}
