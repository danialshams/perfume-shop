export default function FilterBarSkeleton() {
    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-5xl gap-2 overflow-hidden rounded-[30px] border border-white/70 bg-white/70 p-2 shadow-[0_14px_38px_rgba(15,23,42,0.07)] backdrop-blur-md">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-slate-100/90 sm:w-28"
                    />
                ))}
            </div>
        </section>
    );
}
