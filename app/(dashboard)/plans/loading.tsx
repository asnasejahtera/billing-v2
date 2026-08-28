import { Skeleton } from "@/components/ui/skeleton";

export default function PlansLoading() {
    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>

                <Skeleton className="h-9 w-72" />
            </div>

            <Skeleton className="h-16 rounded-lg" />

            <div className="space-y-2 rounded-lg border p-4">
                {Array.from({
                    length: 7,
                }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className="h-12 w-full"
                    />
                ))}
            </div>
        </div>
    );
}