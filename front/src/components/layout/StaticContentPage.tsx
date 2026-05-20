type StaticContentPageProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function StaticContentPage({
  title,
  description,
  children,
}: StaticContentPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground font-serif">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
