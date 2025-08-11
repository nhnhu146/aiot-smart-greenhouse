import React, { useEffect, useState } from 'react';
import './HighlightWrapper.css';
import { AppConstants } from '../../config/AppConfig';

interface HighlightWrapperProps {
    trigger: any;
    children: React.ReactNode;
    className?: string;
}

const HighlightWrapper: React.FC<HighlightWrapperProps> = ({ 
    trigger, 
    children, 
    className = '' 
}) => {
    const [isHighlighted, setIsHighlighted] = useState(false);

    useEffect(() => {
        if (trigger !== undefined && trigger !== null && trigger !== '') {
            setIsHighlighted(true);
            const timer = setTimeout(() => {
                setIsHighlighted(false);
            }, AppConstants.UI.DEBOUNCE_DELAY * 3); // ~1 second
            return () => clearTimeout(timer);
        }
    }, [trigger]);

    return (
        <div className={`highlight-wrapper ${isHighlighted ? 'highlighted' : ''} ${className}`}>
            {children}
        </div>
    );
};

export default HighlightWrapper;
