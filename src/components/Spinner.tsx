export default function Spinner({ full = false }: { full?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${full ? 'min-h-[60vh]' : 'py-10'}`}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ink" />
    </div>
  );
}
