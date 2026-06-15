/** Root loading state shown during navigation and server work. */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  );
}
