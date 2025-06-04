export default function Content({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 p-6 bg-gray-700 min-h-[calc(100vh-4rem-4rem)]">
      {children}
    </main>
  );
}
