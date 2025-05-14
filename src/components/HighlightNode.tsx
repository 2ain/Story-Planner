
import { useState, useRef, useEffect } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Define the data structure for highlight nodes
export interface HighlightNodeData {
  label: string;
  color: string;
  isViewMode?: boolean;
}

// The HighlightNode component with correct typing
const HighlightNode = ({ 
  data, id, selected 
}: NodeProps) => {
  // Safely cast data to our expected type with default values for required properties
  const typedData: HighlightNodeData = {
    label: (data?.label as string) || '',
    color: (data?.color as string) || '#FFEB3B',
    isViewMode: (data?.isViewMode as boolean) || false
  };

  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(typedData.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!typedData.isViewMode) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Don't update if empty or unchanged
    if (labelText !== typedData.label) {
      // The parent component will handle the node data update
      const event = new CustomEvent('highlight:labelchange', {
        detail: { id, label: labelText }
      });
      document.dispatchEvent(event);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (labelText !== typedData.label) {
        const event = new CustomEvent('highlight:labelchange', {
          detail: { id, label: labelText }
        });
        document.dispatchEvent(event);
      }
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const event = new CustomEvent('highlight:colorchange', {
      detail: { id, color: e.target.value }
    });
    document.dispatchEvent(event);
  };

  const handleDelete = () => {
    const event = new CustomEvent('highlight:delete', {
      detail: { id }
    });
    document.dispatchEvent(event);
  };

  // Calculate opacity based on the color to ensure text visibility
  const getTextColor = () => {
    const hex = typedData.color?.replace('#', '') || '';
    if (!hex) return 'text-black';
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate perceived brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness >= 128 ? 'text-black' : 'text-white';
  };

  return (
    <div
      style={{ 
        backgroundColor: `${typedData.color || '#FFEB3B'}80`, // 50% opacity
        borderColor: 'white',
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: '0 0 0 2px white',
        position: 'relative', // Added to position the label correctly
      }}
      className={cn(
        "transition-shadow rounded-sm select-none p-2 min-h-full min-w-full",
        selected && !typedData.isViewMode ? "shadow-md" : "",
        typedData.isViewMode ? "pointer-events-none" : "cursor-pointer",
        // Make the highlight always non-draggable
        "nodrag"
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Display label in top left corner */}
      <div 
        className={cn(
          "absolute top-1 left-1 font-medium px-1", 
          getTextColor(),
          "bg-white bg-opacity-50 rounded"
        )}
      >
        {typedData.label}
      </div>
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={labelText}
          onChange={(e) => setLabelText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border border-gray-400 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="Add highlight label..."
        />
      ) : (
        <div className="h-full w-full"></div> // Empty div to maintain the highlight area
      )}
      
      {!typedData.isViewMode && selected && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 mt-1 bg-gray-800/70 backdrop-blur-sm p-1 rounded shadow-lg">
          <input 
            type="color" 
            value={typedData.color || '#FFEB3B'} 
            onChange={handleColorChange}
            className="w-6 h-6 rounded-sm cursor-pointer" 
          />
          <Button 
            variant="destructive" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleDelete}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default HighlightNode;
