import { Skeleton } from "@PNN/components/ui/skeleton";

export default async function Loading() {
  return (
    <div className="flex flex-col space-y-3 justify-center items-center min-h-screen">
      <Skeleton className="w-[375px] h-[225px] rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

