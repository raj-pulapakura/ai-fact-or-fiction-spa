
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    btype?: "primary" | "border";
}

export default function Button({ btype = "primary", ...props }: ButtonProps) {
    let className = "text-2xl p-2 rounded-lg hover:shadow-[-6px_6px_black] hover:scale-105 transition";

    if (btype === "primary") {
        className += " bg-primary text-white";
    } else if (btype === "border") {
        className += " bg-white border-[3px] border-primary text-primary";
    }

    return (
        <button {...props} className={`${className} ${props.className}`}>
            {props.children}
        </button>
    )
}
