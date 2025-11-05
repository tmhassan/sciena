import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  CameraIcon, 
  PhotoIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BeakerIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { ScannerService } from '../../services/scanner/scannerService';
import { ScanResult, ScanRequest } from '../../types/scanner';
import { cn } from '../../utils/cn';
import { ScannerResults } from './/ScannerResults';
import { ScannerCamera } from './ScannerCamera';
import { ScannerUpload } from './ScannerUpload';
import { ScannerProcessing } from './ScannerProcessing';

interface SupplementScannerProps {
  onScanComplete?: (result: ScanResult) => void;
  onClose?: () => void;
  className?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
}

type ScannerMode = 'upload' | 'camera' | 'processing' | 'results';

export function SupplementScanner({
  onScanComplete,
  onClose,
  className,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}: SupplementScannerProps) {
  const [mode, setMode] = useState<ScannerMode>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const scannerService = useRef(new ScannerService());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      scannerService.current.cleanup();
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file
    if (!allowedTypes.includes(file.type)) {
      setError(`File type not supported. Please use: ${allowedTypes.join(', ')}`);
      return;
    }

    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    // Create preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setError(null);
  }, [allowedTypes, maxFileSize, previewUrl]);

  const handleCameraCapture = useCallback((file: File) => {
    handleFileSelect(file);
    setMode('upload'); // Return to upload view to show preview
  }, [handleFileSelect]);

  const processScan = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setMode('processing');
    setError(null);
    setProgress(0);

    try {
      // Create scan request
      const scanRequest: ScanRequest = {
        image: selectedFile,
        scan_type: 'supplement',
        options: {
          enhance_image: true,
          use_ai_parsing: true,
          include_safety_analysis: true,
          match_threshold: 0.5
        }
      };

      // Step 1: Initialize OCR
      setProcessingStatus('Initializing OCR engine...');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Extract text
      setProcessingStatus('Extracting text from image...');
      setProgress(30);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Parse ingredients
      setProcessingStatus('Parsing ingredients with AI...');
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Match compounds
      setProcessingStatus('Matching against compound database...');
      setProgress(70);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 5: Safety analysis
      setProcessingStatus('Analyzing safety and interactions...');
      setProgress(90);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Process the scan
      const result = await scannerService.current.processScan(scanRequest);
      
      setProgress(100);
      setProcessingStatus('Scan complete!');
      
      setScanResult(result);
      setMode('results');

      // Callback for parent component
      if (onScanComplete) {
        onScanComplete(result);
      }

    } catch (error) {
      console.error('Scan processing failed:', error);
      setError(`Scan failed: ${(error as Error).message}`);
      setMode('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setScanResult(null);
    setError(null);
    setProgress(0);
    setProcessingStatus('');
    setMode('upload');
  };

  const startNewScan = () => {
    resetScanner();
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/50 dark:to-secondary-900/50 rounded-xl">
            <BeakerIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Supplement Scanner
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Scan supplement labels for instant analysis
            </p>
          </div>
        </div>
        
        {onClose && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center space-x-2"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>Close</span>
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-300">
                  Scan Error
                </h4>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                  {error}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardContent className="p-0">
          {mode === 'upload' && (
            <ScannerUpload
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              onFileSelect={handleFileSelect}
              onCameraClick={() => setMode('camera')}
              onProcessScan={processScan}
              onReset={resetScanner}
              isProcessing={isProcessing}
              fileInputRef={fileInputRef}
              allowedTypes={allowedTypes}
              maxFileSize={maxFileSize}
            />
          )}

          {mode === 'camera' && (
            <ScannerCamera
              onCapture={handleCameraCapture}
              onBack={() => setMode('upload')}
            />
          )}

          {mode === 'processing' && (
            <ScannerProcessing
              status={processingStatus}
              progress={progress}
              previewUrl={previewUrl}
            />
          )}

          {mode === 'results' && scanResult && (
            <ScannerResults
              result={scanResult}
              onStartNewScan={startNewScan}
              previewUrl={previewUrl}
            />
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-1">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span>High accuracy OCR</span>
          </div>
          <div className="flex items-center space-x-1">
            <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
            <span>Safety analysis</span>
          </div>
          <div className="flex items-center space-x-1">
            <BeakerIcon className="w-4 h-4 text-purple-500" />
            <span>Database matching</span>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />
    </div>
  );
}
