export function SectionIntro({
  eyebrow,
  title,
  body,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "left" ? "max-w-3xl text-left" : "mx-auto max-w-3xl text-center"}>
      {eyebrow ? <p className="text-sm font-medium text-crust">{eyebrow}</p> : null}
      <h2 className="mt-4 font-serif text-[2.15rem] font-semibold leading-[1.15] tracking-tight text-ink sm:text-5xl">
        {title}
      </h2>
      {body ? (
        <p className={`mt-5 text-lg leading-8 text-mute ${align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
          {body}
        </p>
      ) : null}
    </div>
  );
}
