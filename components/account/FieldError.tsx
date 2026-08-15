import { T } from "./utils";

export function FieldError({ id, message }: { id?: string; message?: string }) {
    if (!message) return null;

    return (
        <p
            id={id}
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-[11px] font-normal leading-[1.6]"
            style={{ color: T.danger }}
        >
            <span
                aria-hidden="true"
                className="mt-[6px] inline-block h-[3px] w-[3px] shrink-0 rounded-full"
                style={{ background: T.danger }}
            />
            {message}
        </p>
    );
}

export default FieldError;
