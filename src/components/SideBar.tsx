
import React from 'react';
import { StoryNodeData } from './StoryNode';
import { Button } from './ui/button';
import { Plus, Trash } from 'lucide-react';

const nodeTypes = [
  { id: 'character-intro', label: 'Character Introduction', color: 'bg-blue-900/60 border-blue-600' },
  { id: 'major-event', label: 'Major Event', color: 'bg-red-900/60 border-red-600' },
  { id: 'event', label: 'Event', color: 'bg-purple-900/60 border-purple-600' },
  { id: 'minor-event', label: 'Minor Event', color: 'bg-green-900/60 border-green-600' },
  { id: 'character-present', label: 'Character Present', color: 'bg-yellow-900/60 border-yellow-600' },
  { id: 'character-death', label: 'Character Death', color: 'bg-gray-900/60 border-gray-600' },
];

interface SideBarProps {
  isDisabled?: boolean;
  customNodeTypes?: Array<{
    id: string;
    label: string;
    color: string;
  }>;
  onCreateClick?: () => void;
  onDeleteCustomNodeType?: (id: string) => void;
}

const SideBar = ({ 
  isDisabled = false, 
  customNodeTypes = [], 
  onCreateClick,
  onDeleteCustomNodeType
}: SideBarProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    if (isDisabled) return;
    
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`sidebar w-64 bg-gray-900 text-white border-r border-gray-800 ${isDisabled ? 'opacity-50' : ''}`}>
      <h3 className="text-xl font-bold mb-6 text-white px-1">Story Elements</h3>
      <div className="space-y-2">
        {nodeTypes.map((type) => (
          <div
            key={type.id}
            className={`p-3 my-2 rounded-md cursor-move border-2 ${type.color} hover:ring-1 hover:ring-white/50 transition-all ${isDisabled ? 'pointer-events-none' : ''}`}
            draggable={!isDisabled}
            onDragStart={(e) => onDragStart(e, type.id)}
          >
            <div className="font-medium">{type.label}</div>
          </div>
        ))}

        <div className="my-4 border-t border-gray-700 pt-4">
          <h4 className="text-md font-semibold text-white mb-3">Custom Blocks</h4>
          {customNodeTypes.map((type) => (
            <div
              key={type.id}
              className="p-3 my-2 rounded-md cursor-move border-2 border-gray-600 hover:ring-1 hover:ring-white/50 transition-all relative group"
              style={{ backgroundColor: type.color + 'BF' }} // Add transparency to match other blocks
              draggable={!isDisabled}
              onDragStart={(e) => onDragStart(e, `custom:${type.id}`)}
            >
              <div className="font-medium">{type.label}</div>
              {!isDisabled && onDeleteCustomNodeType && (
                <button
                  className="absolute top-1 right-1 p-1 rounded bg-red-800/0 group-hover:bg-red-800/80 text-white/0 group-hover:text-white/90 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete custom block type: "${type.label}"?`)) {
                      onDeleteCustomNodeType(type.id);
                    }
                  }}
                  title="Delete custom block type"
                >
                  <Trash size={14} />
                </button>
              )}
            </div>
          ))}
          
          {!isDisabled && (
            <Button 
              variant="outline" 
              onClick={onCreateClick}
              className="w-full mt-2 bg-gray-800 border-gray-700 hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Create New Block
            </Button>
          )}
        </div>
      </div>
      <div className="mt-8 px-1">
        <h4 className="text-sm font-semibold mb-3 text-gray-300">Instructions:</h4>
        <ul className="text-sm space-y-2 text-gray-400">
          <li className="flex items-start">
            <span className="mr-2">•</span> 
            <span>Drag elements to the canvas</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span> 
            <span>Connect nodes by dragging between connection points</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span> 
            <span>Click on a connection to select and delete it</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span> 
            <span>Right-click to change node type</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Use + and - buttons to resize nodes</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span> 
            <span>Click on text to edit</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span> 
            <span>Use mouse wheel to zoom</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span> 
            <span>Drag canvas to pan</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span> 
            <span>Toggle View Mode for a clean reading experience</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SideBar;
