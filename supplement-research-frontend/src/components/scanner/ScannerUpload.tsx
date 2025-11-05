import React, { useCallback } from 'react';
import { 
  CloudArrowUpIcon, 
  CameraIcon, 
  PhotoIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface ScannerUploadProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onCameraClick: () => void;
  onProcessScan: () => void;
  onReset: () => void;
  isProcessing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  allowedTypes: string[];
  maxFileSize: number;
}

export function ScannerUpload({
  selectedFile,
  previewUrl,
  onFileSelect,
  onCameraClick,
  onProcessScan,
  onReset,
  isProcessing,
  fileInputRef,
  allowedTypes,
  maxFileSize
}: ScannerUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => allowedTypes.includes(file.type));
    
    if (imageFile) {
      onFileSelect(imageFile);
    }
  }, [allowedTypes, onFileSelect]);

  if (selectedFile && previewUrl) {
    return (
      <div className="p-6">
        {/* Preview Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Image Preview
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex items-center space-x-2"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>Remove</span>
          </Button>
        </div>

        {/* Image Preview */}
        <div className="relative mb-6">
          <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <img
              src={previewUrl}
              alt="Supplement label preview"
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Overlay for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl pointer-events-none" />
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm">Processing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onProcessScan}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            {isProcessing ? 'Processing...' : 'Analyze Supplement'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center justify-center space-x-2 py-3 rounded-xl"
          >
            <PhotoIcon className="w-5 h-5" />
            <span>Choose Different Image</span>
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            💡 Tips for best results:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Ensure the supplement facts panel is clearly visible</li>
            <li>• Good lighting helps with text recognition</li>
            <li>• Hold the camera steady and close enough to read the text</li>
            <li>• Avoid glare and shadows on the label</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer group",
          isDragOver 
            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" 
            : "border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-12 text-center">
          {/* Upload Icon */}
          <div className="mx-auto mb-6">
            <div className={cn(
              "inline-flex p-4 rounded-full transition-all duration-300",
              isDragOver 
                ? "bg-primary-100 dark:bg-primary-900/30" 
                : "bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30"
            )}>
              <CloudArrowUpIcon className={cn(
                "w-8 h-8 transition-colors duration-300",
                isDragOver 
                  ? "text-primary-600 dark:text-primary-400" 
                  : "text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
              )} />
            </div>
          </div>

          {/* Upload Text */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isDragOver ? 'Drop your image here' : 'Upload supplement label'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop an image, or click to browse
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Supports: {allowedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()}
              <br />
              Max size: {Math.round(maxFileSize / 1024 / 1024)}MB
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <PhotoIcon className="w-5 h-5" />
              <span>Choose File</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onCameraClick();
              }}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
            >
              <CameraIcon className="w-5 h-5" />
              <span>Use Camera</span>
            </Button>
          </div>
        </div>

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-primary-500/10 rounded-2xl flex items-center justify-center">
            <div className="text-primary-600 dark:text-primary-400 text-lg font-semibold">
              Drop to upload
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <CloudArrowUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            Smart OCR
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Advanced text recognition
          </p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <CameraIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            AI Analysis
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Intelligent ingredient parsing
          </p>
        </div>
        
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <PhotoIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            Safety Check
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Interaction warnings
          </p>
        </div>
      </div>
    </div>
  );
}
