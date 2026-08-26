export default function NotFound() {
  return (
    <div className="rounded-2xl border border-flour bg-white px-6 py-12 text-center">
      <p className="text-lg font-semibold">Team not found</p>
      <p className="mt-2 text-sm text-mute">
        This team does not exist or you are not its owner.
      </p>
    </div>
  );
}
