import { getErrorText } from "./cart.utils";

export default function ErrorBanner({ error }: { error?: string | null }) {
    if (!error) return null;

    return (
        <div className="mb-5 rounded-[22px] border border-red-100 bg-red-50/90 px-5 py-4 text-sm leading-7 text-red-600 backdrop-blur-sm">
            {getErrorText(error)}
        </div>
    );
}
