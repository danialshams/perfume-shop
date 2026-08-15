import LuxuryFooter from "@/components/home-sections/LuxuryFooter";
import LuxuryNavbar from "@/components/home-sections/navbar";

export default function CartSkeleton() {
    return (
        <>
            <LuxuryNavbar />

            <main className="relative min-h-[100svh] overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(229,238,248,0.9)_0%,transparent_30%),radial-gradient(circle_at_left_center,rgba(236,243,250,0.85)_0%,transparent_28%),linear-gradient(180deg,#FCFDFF_0%,#F6F8FB_100%)] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
                <div className="relative mx-auto max-w-7xl">
                    <div className="mb-7 h-24 animate-pulse rounded-[28px] border border-[#E7EDF4] bg-white/70 backdrop-blur-xl" />

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
                        <div className="space-y-4 md:space-y-5">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-[162px] animate-pulse rounded-[28px] border border-[#E7EDF4] bg-white/80 backdrop-blur-xl md:h-[176px]"
                                />
                            ))}
                        </div>

                        <div className="hidden h-[430px] animate-pulse rounded-[32px] border border-[#E7EDF4] bg-white/85 backdrop-blur-xl lg:block" />
                    </div>
                </div>
            </main>

            <LuxuryFooter />
        </>
    );
}
