interface PlaceholderViewProps {
  title: string;
  description: string;
}

export function PlaceholderView({ title, description }: PlaceholderViewProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center py-16 px-8 bg-forest-surface border border-forest-border rounded-2xl max-w-md">
        <h1 className="text-2xl font-bold text-forest-text mb-2">{title}</h1>
        <p className="text-forest-muted">{description}</p>
      </div>
    </div>
  );
}
