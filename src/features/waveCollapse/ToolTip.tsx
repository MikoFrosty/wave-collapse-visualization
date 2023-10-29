import { styled } from '@mui/material';
import React from 'react';

const StyledTooltip = styled('div')({
  position: 'absolute',
  backgroundColor: '#333',
  color: '#fff',
  padding: '10px 15px',
  borderRadius: '5px',
  zIndex: '10',
});

interface TooltipProps {
  content: string;
  x: number;
  y: number;
  isVisible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ content, x, y, isVisible }) => {
  return (
    <StyledTooltip
      style={{
        left: `${x}px`,
        top: `${y}px`,
        display: isVisible ? 'block' : 'none',
      }}
    >
      {content}
    </StyledTooltip>
  );
};

export default Tooltip;
