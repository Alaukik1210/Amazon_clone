interface CartActionsProps {
  onDelete: () => void;
  onSaveForLater: () => void;
}

function ActionLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] text-[#007185] hover:underline cursor-pointer"
    >
      {label}
    </button>
  );
}

export function CartActions({ onDelete, onSaveForLater }: CartActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] mt-3">
      <ActionLink label="Delete" onClick={onDelete} />
      <span className="text-[#DDD]">|</span>
      <ActionLink label="Save for later" onClick={onSaveForLater} />
      <span className="text-[#DDD]">|</span>
      <ActionLink label="See more like this" onClick={() => {}} />
      <span className="text-[#DDD]">|</span>
      <ActionLink label="Share" onClick={() => {}} />
    </div>
  );
}
