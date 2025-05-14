
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Panel,
  BackgroundVariant,
  ConnectionLineType,
  useReactFlow,
  ReactFlowProvider,
  useOnSelectionChange,
  NodeChange,
  SelectionMode,
  NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2, Square, MousePointer } from 'lucide-react';
import StoryNode, { StoryNodeData } from './StoryNode';
import HighlightNode, { HighlightNodeData } from './HighlightNode';
import { generateUniqueId, cn } from '@/lib/utils';
import SideBar from './SideBar';
import CreateBlockDialog from './CreateBlockDialog';
import { toast } from "sonner";

// Default node size constants - increased for better readability
const DEFAULT_NODE_WIDTH = 320;
const DEFAULT_NODE_HEIGHT = 180;

// Node types registry - properly typed
const nodeTypes: NodeTypes = {
  storyNode: StoryNode,
  highlightNode: HighlightNode
};

const StoryFlowContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customNodeTypes, setCustomNodeTypes] = useState<Array<{
    id: string;
    label: string;
    color: string;
  }>>([]);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [isDrawingHighlight, setIsDrawingHighlight] = useState(false);
  const [highlightStartPos, setHighlightStartPos] = useState({ x: 0, y: 0 });
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [defaultHighlightColor, setDefaultHighlightColor] = useState('#FFEB3B');
  const [currentHighlight, setCurrentHighlight] = useState<Node | null>(null);
  
  const { deleteElements, getNode, setNodes: setNodesReactFlow } = useReactFlow();

  // Subscribe to highlight node events
  useEffect(() => {
    const handleLabelChange = (event: Event) => {
      const { id, label } = (event as CustomEvent).detail;
      setNodes((nds) => nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, label }
          };
        }
        return node;
      }));
    };

    const handleColorChange = (event: Event) => {
      const { id, color } = (event as CustomEvent).detail;
      setNodes((nds) => nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, color }
          };
        }
        return node;
      }));
    };

    const handleDeleteHighlight = (event: Event) => {
      const { id } = (event as CustomEvent).detail;
      deleteElements({ nodes: [{ id }] });
    };

    document.addEventListener('highlight:labelchange', handleLabelChange);
    document.addEventListener('highlight:colorchange', handleColorChange);
    document.addEventListener('highlight:delete', handleDeleteHighlight);

    return () => {
      document.removeEventListener('highlight:labelchange', handleLabelChange);
      document.removeEventListener('highlight:colorchange', handleColorChange);
      document.removeEventListener('highlight:delete', handleDeleteHighlight);
    };
  }, [deleteElements, setNodes]);

  // Track selected highlight
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      const highlightNode = nodes.find(node => node.type === 'highlightNode');
      setSelectedHighlightId(highlightNode ? highlightNode.id : null);
    }
  });

  // Load from localStorage if available
  useEffect(() => {
    const savedFlow = localStorage.getItem('story-flow');
    if (savedFlow) {
      try {
        const flow = JSON.parse(savedFlow);
        
        // Ensure each node has title and description
        const validatedNodes = flow.nodes?.map((node: any) => {
          // For highlight nodes, ensure they have label and color
          if (node.type === 'highlightNode') {
            return {
              ...node,
              data: {
                ...node.data,
                label: node.data?.label || '',
                color: node.data?.color || '#FFEB3B'
              },
              // Make highlight nodes non-draggable
              draggable: false
            };
          }
          
          // For story nodes (or any other type)
          return {
            ...node,
            data: {
              ...node.data,
              title: node.data?.title || '',
              description: node.data?.description || ''
            }
          };
        }) || [];
        
        console.log('Loading flow with nodes:', validatedNodes);
        setNodes(validatedNodes);
        setEdges(flow.edges || []);
      } catch (error) {
        console.error('Failed to load saved flow:', error);
      }
    }

    // Load custom node types if available
    const savedCustomNodeTypes = localStorage.getItem('custom-node-types');
    if (savedCustomNodeTypes) {
      try {
        setCustomNodeTypes(JSON.parse(savedCustomNodeTypes));
      } catch (error) {
        console.error('Failed to load custom node types:', error);
      }
    }
  }, []);

  // Save to localStorage whenever nodes or edges change
  useEffect(() => {
    const saveFlow = () => {
      if (nodes.length || edges.length) {
        console.log('Saving nodes to localStorage:', nodes);
        const flow = { nodes, edges };
        localStorage.setItem('story-flow', JSON.stringify(flow));
      }
    };

    saveFlow();
  }, [nodes, edges]);

  // Save custom node types to localStorage
  useEffect(() => {
    if (customNodeTypes.length) {
      localStorage.setItem('custom-node-types', JSON.stringify(customNodeTypes));
    } else {
      localStorage.removeItem('custom-node-types');
    }
  }, [customNodeTypes]);

  const onConnect = useCallback((params: Connection) => {
    // We explicitly use the sourceHandle and targetHandle to fix the connection bug
    setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#aaa', strokeWidth: 2 },
      type: ConnectionLineType.Bezier,
    }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeTypeData = event.dataTransfer.getData('application/reactflow');
      
      if (typeof nodeTypeData === 'undefined' || !nodeTypeData || !reactFlowInstance || !reactFlowBounds) {
        return;
      }
      
      // Check if it's a custom node type (format: "custom:id")
      let nodeType: StoryNodeData['nodeType'] = 'custom';
      let customColor = undefined;
      let nodeTitle = '';
      let customLabel = undefined;
      
      if (nodeTypeData.startsWith('custom:')) {
        const customId = nodeTypeData.split(':')[1];
        const customNodeType = customNodeTypes.find(nt => nt.id === customId);
        if (customNodeType) {
          customColor = customNodeType.color;
          nodeTitle = customNodeType.label; // Use the custom node's label as the title
          customLabel = customNodeType.label; // Store the custom node's label for the footer
        }
      } else {
        nodeType = nodeTypeData as StoryNodeData['nodeType'];
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create new node with standardized fixed size
      const newNode = {
        id: generateUniqueId(),
        type: 'storyNode',
        position,
        style: {
          width: DEFAULT_NODE_WIDTH,
          height: DEFAULT_NODE_HEIGHT
        },
        data: { 
          title: nodeTitle, 
          description: 'Add description here...', 
          nodeType,
          color: customColor,
          customLabel: customLabel
        },
      };

      console.log('Creating new node with data:', newNode.data);
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, customNodeTypes]
  );

  // Improved export function that ensures titles and descriptions are properly preserved
  const saveToFile = () => {
    try {
      console.log('Current nodes before export:', nodes);
      
      // Deep copy the nodes to ensure we don't modify the original state
      const nodesToExport = JSON.parse(JSON.stringify(nodes)).map((node: any) => {
        // Special handling for highlight nodes
        if (node.type === 'highlightNode') {
          return {
            id: node.id,
            type: node.type,
            position: node.position,
            style: node.style,
            draggable: false, // Ensure highlight nodes are exported as non-draggable
            data: {
              label: node.data.label || '',
              color: node.data.color || '#FFEB3B'
            }
          };
        }
        
        // Regular story nodes
        if (!node.data) {
          node.data = { title: '', description: '', nodeType: 'event' };
          console.warn(`Node ${node.id} was missing data, added defaults`);
        }
        
        // Make sure title and description are explicitly set but don't force default values
        if (node.data.title === undefined) {
          node.data.title = '';
        }
        
        if (!node.data.description) {
          console.warn(`Node ${node.id} was missing description, added default`);
          node.data.description = '';
        }
        
        // Remove any circular references if present
        return {
          id: node.id,
          type: node.type,
          position: node.position,
          style: node.style,
          data: {
            title: node.data.title,
            description: node.data.description,
            nodeType: node.data.nodeType || 'event',
            color: node.data.color,
            customLabel: node.data.customLabel,
            label: node.data.label // For highlight nodes
          }
        };
      });
      
      console.log('Exporting nodes with titles and descriptions:', nodesToExport.map((n: any) => ({
        id: n.id,
        title: n.data.title,
        description: n.data.description ? n.data.description.substring(0, 20) + '...' : 'empty'
      })));
      
      const flow = { 
        nodes: nodesToExport,
        edges: edges,
        customNodeTypes: customNodeTypes
      };
      
      // Format with indentation for better readability
      const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'story-flow.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up to avoid memory leaks
      
      toast.success("Story flow exported successfully with all titles and descriptions");
    } catch (error) {
      console.error('Failed to export flow:', error);
      toast.error("Failed to export flow");
    }
  };

  // Improved import function to ensure titles, descriptions, and highlights are properly restored
  const loadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        if (e.target?.result && typeof e.target.result === 'string') {
          try {
            const flow = JSON.parse(e.target.result);
            
            // Validate that the imported data has the expected structure
            if (!Array.isArray(flow.nodes)) {
              throw new Error('Invalid flow format: nodes array is missing');
            }
            
            // Log before validation
            console.log('Raw imported nodes:', flow.nodes);
            
            // Process and validate each node to ensure it has title and description
            const validNodes = flow.nodes.map((node: any) => {
              // Check for essential properties
              if (!node.id || !node.position) {
                console.warn('Node is missing essential properties, using defaults');
                node.id = node.id || generateUniqueId();
                node.position = node.position || { x: 0, y: 0 };
              }
              
              // Special handling for highlight nodes
              if (node.type === 'highlightNode') {
                return {
                  ...node,
                  draggable: false, // Make sure highlight nodes are not draggable
                  data: {
                    label: node.data?.label || '',
                    color: node.data?.color || '#FFEB3B'
                  }
                };
              }
              
              // Ensure data object exists for story nodes
              if (!node.data) {
                console.warn(`Node ${node.id} is missing data object, creating it`);
                node.data = {};
              }
              
              // Create a complete node with all required fields
              const validNode = {
                ...node,
                type: node.type || 'storyNode',
                data: {
                  // Keep title as is, allowing empty titles
                  title: node.data.title !== undefined ? node.data.title : '',
                  description: node.data.description || '',
                  // Ensure the node type is valid
                  nodeType: node.data.nodeType || 'event',
                  // Preserve custom color and label if present
                  color: node.data.color,
                  customLabel: node.data.customLabel,
                  // For highlight nodes
                  label: node.data.label
                }
              };
              
              console.log(`Imported node ${validNode.id}: Title="${validNode.data.title}", Description="${validNode.data.description ? validNode.data.description.substring(0, 20) + '...' : 'empty'}"`);
              
              return validNode;
            });
            
            console.log('Validated nodes for import:', validNodes);
            
            // Store the validated data directly in memory and localStorage
            setNodes(validNodes);
            setEdges(flow.edges || []);
            
            localStorage.setItem('story-flow', JSON.stringify({ 
              nodes: validNodes, 
              edges: flow.edges || []
            }));
            
            if (flow.customNodeTypes) {
              setCustomNodeTypes(flow.customNodeTypes);
              localStorage.setItem('custom-node-types', JSON.stringify(flow.customNodeTypes));
              console.log("Custom node types imported:", flow.customNodeTypes);
            }
            
            toast.success("Story flow imported successfully with all titles, descriptions, and highlights");
          } catch (error) {
            console.error('Failed to parse flow file:', error);
            toast.error("Failed to import flow: Invalid file format");
          }
        }
      };
    }
  };

  const resetFlow = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      localStorage.removeItem('story-flow');
      setNodes([]);
      setEdges([]);
      toast.success("Story flow cleared");
    }
  };

  // Handle edge selection for deletion
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  }, []);
  
  // Delete selected edge
  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge) {
      deleteElements({ edges: [selectedEdge] });
      setSelectedEdge(null);
    }
  }, [selectedEdge, deleteElements]);

  // Handle custom block creation
  const handleCreateCustomBlock = (blockName: string, blockColor: string) => {
    const newCustomBlockId = generateUniqueId();
    const newCustomNodeType = {
      id: newCustomBlockId,
      label: blockName,
      color: blockColor
    };
    
    setCustomNodeTypes(prev => [...prev, newCustomNodeType]);
    setIsCreateModalOpen(false);
  };

  // Delete custom node type
  const handleDeleteCustomNodeType = useCallback((nodeTypeId: string) => {
    setCustomNodeTypes(prev => prev.filter(type => type.id !== nodeTypeId));
  }, []);

  // Toggle view mode
  const toggleViewMode = () => {
    setIsViewMode(!isViewMode);
    setSelectedEdge(null); // Clear selection when toggling modes
    setIsHighlightMode(false); // Exit highlight mode when toggling view mode
  };

  // Toggle highlight mode
  const toggleHighlightMode = () => {
    if (isViewMode) return; // Don't allow in view mode
    setIsHighlightMode(!isHighlightMode);
  };

  // Mouse handlers for highlight creation
  const onPaneMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!isHighlightMode || isViewMode) return;
      
      // Start drawing highlight
      setIsDrawingHighlight(true);
      
      // Get position in flow coordinates
      const pos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
      
      setHighlightStartPos(pos);
      
      // Create a temporary highlight node
      const id = generateUniqueId();
      const newHighlight = {
        id,
        type: 'highlightNode',
        position: pos,
        draggable: false, // Highlight nodes are non-draggable
        style: {
          width: 1,
          height: 1,
          zIndex: -1, // Place below other nodes
        },
        data: {
          label: '',
          color: defaultHighlightColor,
          isViewMode
        }
      };
      
      setNodes((nds: Node[]) => [...nds, newHighlight as any]);
      setCurrentHighlight(newHighlight as any);
    },
    [isHighlightMode, isViewMode, reactFlowInstance, setNodes, defaultHighlightColor]
  );

  const onPaneMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDrawingHighlight || !currentHighlight) return;
      
      event.preventDefault();
      
      // Get current position in flow coordinates
      const currentPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
      
      // Calculate size and position for the highlight
      const width = Math.abs(currentPos.x - highlightStartPos.x);
      const height = Math.abs(currentPos.y - highlightStartPos.y);
      const position = {
        x: Math.min(highlightStartPos.x, currentPos.x),
        y: Math.min(highlightStartPos.y, currentPos.y)
      };
      
      // Update the highlight node
      setNodes(nds => nds.map(node => {
        if (node.id === currentHighlight.id) {
          return {
            ...node,
            position,
            style: {
              ...node.style,
              width,
              height
            }
          };
        }
        return node;
      }));
    },
    [isDrawingHighlight, currentHighlight, reactFlowInstance, highlightStartPos, setNodes]
  );

  const onPaneMouseUp = useCallback(() => {
    if (!isDrawingHighlight || !currentHighlight) return;
    
    // Finish drawing highlight
    setIsDrawingHighlight(false);
    
    // Get the current node to check its size
    setNodes(nds => {
      const currentNode = nds.find(n => n.id === currentHighlight.id);
      
      // If the size is too small, remove the node
      if (currentNode && 
          (currentNode.style?.width < 20 || currentNode.style?.height < 20)) {
        return nds.filter(n => n.id !== currentHighlight.id);
      }
      
      // Otherwise, prompt for a label
      if (currentNode) {
        const label = prompt('Enter a label for this highlight (optional):') || '';
        
        return nds.map(n => {
          if (n.id === currentHighlight.id) {
            return {
              ...n,
              data: { ...n.data, label }
            };
          }
          return n;
        });
      }
      
      return nds;
    });
    
    setCurrentHighlight(null);
  }, [isDrawingHighlight, currentHighlight, setNodes]);

  // Key handler for deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedEdge) {
          deleteSelectedEdge();
        } else if (selectedHighlightId) {
          deleteElements({ nodes: [{ id: selectedHighlightId }] });
          setSelectedHighlightId(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedEdge, deleteSelectedEdge, selectedHighlightId, deleteElements]);

  return (
    <div className="flex h-screen w-full dark:bg-gray-900">
      <SideBar 
        isDisabled={isViewMode} 
        customNodeTypes={customNodeTypes} 
        onCreateClick={() => setIsCreateModalOpen(true)}
        onDeleteCustomNodeType={handleDeleteCustomNodeType}
      />
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              isViewMode
            },
            // Ensure highlight nodes are non-draggable
            draggable: node.type === 'highlightNode' ? false : !isViewMode && !isHighlightMode
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          maxZoom={2}
          minZoom={0.05} // Increased zoom-out limit
          fitView
          proOptions={{ hideAttribution: true }}
          className={cn("dark bg-gray-900", isViewMode ? "view-mode" : "")}
          connectionLineType={ConnectionLineType.Bezier}
          defaultEdgeOptions={{
            type: 'bezier',
          }}
          nodesDraggable={!isViewMode && !isHighlightMode}
          nodesConnectable={!isViewMode && !isHighlightMode}
          elementsSelectable={!isViewMode || (isViewMode && isHighlightMode)}
          selectionMode={SelectionMode.Partial}
          onMouseDown={isHighlightMode ? onPaneMouseDown : undefined}
          onMouseMove={isHighlightMode ? onPaneMouseMove : undefined}
          onMouseUp={isHighlightMode ? onPaneMouseUp : undefined}
          panOnDrag={!isDrawingHighlight}
        >
          <Background 
            color="#444" 
            gap={16} 
            size={1} 
            variant={BackgroundVariant.Dots}
          />
          <Controls 
            className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg"
            showInteractive={false}
          />
          <MiniMap 
            nodeStrokeWidth={3} 
            zoomable 
            pannable 
            className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg"
          />
          <Panel position="top-right" className="flex gap-2 flex-wrap">
            <Button 
              variant={isHighlightMode ? "secondary" : "outline"} 
              onClick={toggleHighlightMode} 
              disabled={isViewMode}
              className={cn(
                "bg-gray-800 border-gray-700 text-gray-200 flex items-center gap-2",
                isHighlightMode && "bg-blue-700"
              )}
            >
              <Square size={16} />
              {isHighlightMode ? 'Exit Highlight' : 'Add Highlight'}
            </Button>
            {isHighlightMode && (
              <div className="flex items-center gap-2 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg px-2 py-1">
                <span className="text-gray-200 text-sm">Color:</span>
                <input 
                  type="color" 
                  value={defaultHighlightColor} 
                  onChange={(e) => setDefaultHighlightColor(e.target.value)}
                  className="w-6 h-6 rounded-sm cursor-pointer" 
                />
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={toggleViewMode} 
              className="bg-gray-800 border-gray-700 text-gray-200 flex items-center gap-2"
            >
              {isViewMode ? <EyeOff size={16} /> : <Eye size={16} />}
              {isViewMode ? 'Edit Mode' : 'View Mode'}
            </Button>
            {!isViewMode && !isHighlightMode && selectedEdge && (
              <Button 
                variant="outline" 
                onClick={deleteSelectedEdge} 
                className="bg-red-800/80 border-red-700 text-gray-200 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Connection
              </Button>
            )}
            <Button variant="outline" onClick={saveToFile} className="bg-gray-800 border-gray-700 text-gray-200">
              Export
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-200" onClick={() => document.getElementById('file-input')?.click()}>
                Import
              </Button>
              <input 
                id="file-input" 
                type="file" 
                className="hidden" 
                onChange={loadFromFile} 
                accept=".json" 
              />
            </label>
            <Button variant="outline" onClick={resetFlow} className="bg-gray-800 border-gray-700 text-gray-200">
              Clear
            </Button>
          </Panel>
        </ReactFlow>
      </div>
      {isCreateModalOpen && (
        <CreateBlockDialog 
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateBlock={handleCreateCustomBlock}
        />
      )}
    </div>
  );
};

// Wrap the component with ReactFlowProvider
const StoryFlow = () => {
  return (
    <ReactFlowProvider>
      <StoryFlowContent />
    </ReactFlowProvider>
  );
};

export default StoryFlow;
