import { Skeleton } from "@/components/ui/skeleton";

export default function RoutersLoading() {
    return (
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-72 max-w-full" />
                </div>

                <Skeleton className="h-9 w-32" />
            </div>

            <Skeleton className="h-16 rounded-lg" />

            <div className="space-y-2 rounded-lg border p-4">
                {Array.from({
                    length: 6,
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