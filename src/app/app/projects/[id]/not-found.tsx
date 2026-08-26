export default function NotFound() {
  return (
    <div className="rounded-2xl border border-flour bg-white px-6 py-12 text-center">
      <p className="text-lg font-semibold">Project not found</p>
      <p className="mt-2 text-sm text-mute">
        This project does not exist or is not attached to your email.
      </p>
    </div>
  );
}
