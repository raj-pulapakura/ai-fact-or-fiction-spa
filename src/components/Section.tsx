import React from 'react'

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> { }

export default function Section({ children, ...props }: SectionProps) {
    let className = "bg-white p-5 rounded-lg shadow-[-10px_10px_black]";

    return (
        <div className={`${className} ${props.className}`}>
            {children}
        </div>
    )
}
