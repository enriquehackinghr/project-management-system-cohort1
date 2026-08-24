export function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p className="text-sm font-medium text-crust">{eyebrow}</p>
      ) : null}
      <h2 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {title}
      </h2>
      {body ? (
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-mute">{body}</p>
      ) : null}
    </div>
  );
}
