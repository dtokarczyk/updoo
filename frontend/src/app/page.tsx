import { ListingsFeed } from "@/app/components/ListingsFeed";
import { OnboardingRedirect } from "@/app/components/OnboardingRedirect";
import { HomeNav } from "@/app/components/HomeNav";

export default function Home() {
  return (
    <OnboardingRedirect>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
        <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
          <header className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Updoo
            </h1>
            <HomeNav />
          </header>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                Ogłoszenia
              </h2>
              <HomeNav showCreateOnly />
            </div>
            <ListingsFeed />
          </section>
        </main>
      </div>
    </OnboardingRedirect>
  );
}
