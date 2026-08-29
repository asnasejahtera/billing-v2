import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-72" />
            </div>

            <div className="flex gap-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
            </div>

            <div className="space-y-2">
                {Array.from({
                    length: 10,
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