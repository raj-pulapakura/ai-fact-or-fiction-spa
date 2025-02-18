
interface OptionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
}

export default function Option({ ...props }: OptionProps) {
    let className = "text-2xl p-2 rounded-lg flex-1 hover:bg-accent hover:bg-opacity-20 transition-all";
    className += " bg-white border-[3px] border-primary text-primary";

    return (
        <button {...props} className={`${className} ${props.className}`}>
            {props.children}
        </button>
    )
}
