interface IconProps extends React.HTMLAttributes<HTMLElement> {
    color?: string;
}

function Icon({ color, ...props }: IconProps) {

    const classList = (props.className ?? '').split(' ');
    classList.unshift('material-icons');

    const style = { ...props.style, color };

    return (
        <i {...props} className={classList.join(' ')} style={style}>
            {props.children}
        </i>
    )

}

export default Icon
