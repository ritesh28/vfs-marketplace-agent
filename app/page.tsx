import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        VFS Marketplace Agent
      </h1>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        Phase 0 bootstrap — Next.js, Tailwind, and shadcn are ready.
      </p>
      <Button type="button" variant="outline">
        Ready
      </Button>
    </main>
  );
}
