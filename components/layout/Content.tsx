interface ContentProps {
  children: React.ReactNode;
}

export default function Content({ children }: ContentProps) {
  return (
    <main className="flex-1 p-3 bg-gray-700 overflow-y-auto min-h-[calc(100vh-4rem-4rem)]">
      {children}
    </main>
  );
}