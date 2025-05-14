
import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

// Define type for the data that will be stored in each node
export type StoryNodeData = {
  title: string;
  description: string;
  nodeType: 'character-intro' | 'major-event' | 'event' | 'minor-event' | 'character-present' | 'character-death' | 'custom';
  color?: string; // For custom node colors
  isViewMode?: boolean; // Added to support view mode
  customLabel?: string; // Added to support custom labels for custom nodes
};

// Create a proper NodeProps interface
export interface StoryNodeProps {
  id: string;
  data: StoryNodeData;
  selected?: boolean;
}

const nodeTypeStyles = {
  'character-intro': 'bg-blue-900/60 border-blue-600',
  'major-event': 'bg-red-900/60 border-red-600',
  'event': 'bg-purple-900/60 border-purple-600',
  'minor-event': 'bg-green-900/60 border-green-600',
  'character-present': 'bg-yellow-900/60 border-yellow-600',
  'character-death': 'bg-gray-900/60 border-gray-700',
  'custom': 'bg-gray-800/60 border-gray-700',
};

const nodeTypeNames = {
  'character-intro': 'Character Introduction',
  'major-event': 'Major Event',
  'event': 'Event',
  'minor-event': 'Minor Event',
  'character-present': 'Character Present',
  'character-death': 'Character Death',
  'custom': 'Custom',
};

// Update all node types to have rounded-md (square corners)
const nodeTypeShapes = {
  'character-intro': 'rounded-md',
  'major-event': 'rounded-md',
  'event': 'rounded-md',
  'minor-event': 'rounded-md',
  'character-present': 'rounded-md',
  'character-death': 'rounded-md',
  'custom': 'rounded-md',
};

const StoryNode = ({ data, selected, id }: StoryNodeProps) => {
  const [title, setTitle] = useState(data.title); // Remove default to allow empty titles
  const [description, setDescription] = useState(data.description || ''); // Ensure description has default
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const { deleteElements, setNodes } = useReactFlow();
  const isViewMode = data.isViewMode || false;
  
  // Sync local state with data props if they change externally
  useEffect(() => {
    setTitle(data.title);
    setDescription(data.description || '');
  }, [data.title, data.description]);
  
  // Use useCallback to prevent unnecessary re-renders
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Update the node data in the React Flow state
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          // Create a new node object with updated data
          return {
            ...node,
            data: {
              ...node.data,
              title: newTitle
            }
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);
  
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDesc = e.target.value;
    setDescription(newDesc);
    
    // Update the node data in the React Flow state
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          // Create a new node object with updated data
          return {
            ...node,
            data: {
              ...node.data,
              description: newDesc
            }
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);
  
  const handleNodeTypeChange = useCallback((newType: StoryNodeData['nodeType']) => {
    // Update the node data in the React Flow state
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === id) {
          // Create a new node object with updated data
          return {
            ...node,
            data: {
              ...node.data,
              nodeType: newType
            }
          };
        }
        return node;
      })
    );
    setShowTypeSelect(false);
  }, [id, setNodes]);
  
  // Delete node
  const handleDeleteNode = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [deleteElements, id]);

  // Fix: Remove the check for character nodes since all nodes should have the same shape now
  const shapeClass = nodeTypeShapes[data.nodeType];
  
  // Check for custom color
  const nodeStyle = data.color ? { backgroundColor: data.color, borderColor: data.color } : {};

  // Determine what to show in the footer
  const getFooterText = () => {
    if (data.nodeType === 'custom' && data.customLabel) {
      return data.customLabel;
    }
    return nodeTypeNames[data.nodeType];
  };

  return (
    <>
      <div 
        className={cn(
          "border-2 min-w-[320px] min-h-[180px] p-3 relative",
          data.color ? '' : nodeTypeStyles[data.nodeType],
          shapeClass,
          selected ? 'ring-2 ring-white/70' : '',
        )}
        style={nodeStyle}
        onContextMenu={(e) => {
          if (!isViewMode) {
            e.preventDefault();
            setShowTypeSelect(!showTypeSelect);
          }
        }}
      >
        {/* Top Handle */}
        {!isViewMode && (
          <Handle 
            type="source" 
            position={Position.Top} 
            id="top"
            className="w-3 h-3 opacity-40 hover:opacity-100 transition-opacity !bg-white border-2 border-gray-600" 
          />
        )}
        
        {/* Left Handle */}
        {!isViewMode && (
          <Handle 
            type="source" 
            position={Position.Left} 
            id="left"
            className="w-3 h-3 opacity-40 hover:opacity-100 transition-opacity !bg-white border-2 border-gray-600" 
          />
        )}
        
        {/* Content area */}
        {isViewMode ? (
          <div className="text-white font-medium px-2 py-1">{title}</div>
        ) : (
          <input
            className="editable-title w-full bg-transparent border-none text-white font-medium focus:outline-none focus:ring-1 focus:ring-white/30 px-2 py-1 rounded"
            value={title}
            onChange={handleTitleChange}
            placeholder="Node Title"
            disabled={isViewMode}
          />
        )}
        
        {isViewMode ? (
          <div className="text-white/90 px-2 py-1 text-wrap min-h-[120px] max-h-[120px] overflow-y-auto">{description}</div>
        ) : (
          <textarea
            className="editable-description w-full bg-transparent border-none text-white/90 focus:outline-none focus:ring-1 focus:ring-white/30 px-2 py-1 resize-none rounded"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Add description..."
            style={{ minHeight: '120px', maxHeight: '120px' }}
            disabled={isViewMode}
          />
        )}

        {/* Show the proper footer text based on node type */}
        <div className="text-xs text-gray-400 text-center absolute bottom-1 left-0 w-full pointer-events-none">
          {getFooterText()}
        </div>

        {/* Right Handle */}
        {!isViewMode && (
          <Handle 
            type="target" 
            position={Position.Right} 
            id="right"
            className="w-3 h-3 opacity-40 hover:opacity-100 transition-opacity !bg-white border-2 border-gray-600" 
          />
        )}
        
        {/* Bottom Handle */}
        {!isViewMode && (
          <Handle 
            type="target" 
            position={Position.Bottom} 
            id="bottom"
            className="w-3 h-3 opacity-40 hover:opacity-100 transition-opacity !bg-white border-2 border-gray-600" 
          />
        )}

        {/* Control buttons - only delete button */}
        {!isViewMode && (
          <div className="absolute top-0 right-0 p-1 bg-black/20 rounded-bl-md">
            <button 
              onClick={handleDeleteNode}
              className="p-1 rounded bg-red-800/80 hover:bg-red-700 transition-colors flex items-center justify-center"
              title="Delete node"
            >
              <Trash2 className="h-3 w-3 text-white" />
            </button>
          </div>
        )}

        {showTypeSelect && !isViewMode && (
          <div className="absolute top-full left-0 z-50 bg-gray-800 border border-gray-600 rounded shadow-lg mt-1">
            {Object.entries(nodeTypeNames).map(([type, name]) => (
              <div
                key={type}
                className="px-3 py-1.5 cursor-pointer hover:bg-gray-700 text-white/90 text-sm"
                onClick={() => handleNodeTypeChange(type as StoryNodeData['nodeType'])}
              >
                {name}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default memo(StoryNode);
