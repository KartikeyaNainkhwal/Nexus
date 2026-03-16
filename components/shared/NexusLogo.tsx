import React from 'react';

export const NexusLogo = ({ className = "w-10 h-10", color = "currentColor" }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M28 75L48 25H35L20 75H28Z"
                fill={color}
            />
            <path
                d="M48 25L40 45L55 75H65L48 25Z"
                fill={color}
            />
            <path
                d="M60 25L50 55L65 75H80L60 25Z"
                fill={color}
            />
        </svg>
    );
};
