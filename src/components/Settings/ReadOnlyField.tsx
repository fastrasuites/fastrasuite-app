export default function ReadOnlyField({
  label,
  value,
  className,
}: {
  label: string;
  className?: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-sm font-semibold ${className ?? "text-[#1A1A1A]"}`}>
        {label}
      </span>

      <p className="text-base text-[#1A1A1A]">{value}</p>
    </div>
  );
}
