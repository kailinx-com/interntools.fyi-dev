import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { SearchPageClient } from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center pt-16">
          <Spinner className="size-8" />
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
