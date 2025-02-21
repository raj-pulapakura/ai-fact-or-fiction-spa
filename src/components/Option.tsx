
interface OptionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    border?: boolean;
}

export default function Option({ border = true, ...props }: OptionProps) {
    let className = "bg-white text-2xl p-2 rounded-lg flex-1 hover:bg-accent hover:bg-opacity-20 transition-all";
    if (border) {
        className += " border-[3px] border-primary text-primary";
    }

    return (
        <button {...props} className={`${className} ${props.className}`}>
            {props.children}
        </button>
    )
}
