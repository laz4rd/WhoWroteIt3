export default function DuelStatus({ message }: { message: string }) {
  return (
    <div className="text-center animate-pop-in">
      <div className="font-display text-2xl md:text-4xl font-bold uppercase tracking-wide text-white/70 animate-flash">
        {message}
      </div>
    </div>
  );
}
