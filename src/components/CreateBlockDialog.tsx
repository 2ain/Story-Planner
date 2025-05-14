
import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CreateBlockDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateBlock: (name: string, color: string) => void;
}

// Extended color options
const colorOptions = [
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#FACC15' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  // Additional color options
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Cyan', value: '#06B6D4' },
];

const CreateBlockDialog = ({ open, onClose, onCreateBlock }: CreateBlockDialogProps) => {
  const [blockName, setBlockName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);
  const [customColor, setCustomColor] = useState('');
  const [useCustomColor, setUseCustomColor] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockName.trim()) {
      // Use either the custom color input or the selected color from presets
      const finalColor = useCustomColor && customColor ? customColor : selectedColor;
      onCreateBlock(blockName, finalColor);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-800 text-white border-gray-700">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Create Custom Block</DialogTitle>
            <DialogDescription className="text-gray-400">
              Design a new block type for your story planning.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-white">
                Name
              </Label>
              <Input
                id="name"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="e.g., Plot Twist"
                className="col-span-3 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-white">
                Color
              </Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <div 
                    key={color.value} 
                    className={`w-8 h-8 rounded-full cursor-pointer ${!useCustomColor && selectedColor === color.value ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => {
                      setSelectedColor(color.value);
                      setUseCustomColor(false);
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="custom-color" className="text-right text-white">
                Custom Color
              </Label>
              <div className="col-span-3 flex gap-2">
                <div className="flex-1">
                  <Input
                    id="custom-color"
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setUseCustomColor(true);
                    }}
                    placeholder="#RRGGBB"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                {customColor && (
                  <div 
                    className={`w-10 h-10 rounded border border-gray-600 ${useCustomColor ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: customColor || '#FFFFFF' }}
                    onClick={() => setUseCustomColor(true)}
                  />
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!blockName.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Create Block
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBlockDialog;
