import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export default function Input({ ...props }) {
    let className = "border-[3px] border-primary rounded-lg p-2 text-2xl text-center";

    return (
        <input
            {...props}
            className={`${className} ${props.className}`}
        />
    )
}
