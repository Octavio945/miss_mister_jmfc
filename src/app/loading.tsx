export default function Loading() {
  return (
    <div className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-accent">
      <div className="w-12 h-12 flex items-center justify-center relative">
        <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
