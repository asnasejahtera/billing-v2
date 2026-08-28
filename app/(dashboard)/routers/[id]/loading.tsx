import { Skeleton } from "@/components/ui/skeleton";

export default function RouterDetailLoading() {
    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
            <Skeleton className="h-4 w-40" />

            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>

            <Skeleton className="h-36 rounded-xl" />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({
                    length: 4,
                }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className="h-32 rounded-xl"
                    />
                ))}
            </div>

            <Skeleton className="h-96 rounded-xl" />
        </div>
    );
}