import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CameraIcon, 
  ArrowLeftIcon, 
  StopIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface ScannerCameraProps {
  onCapture: (file: File) => void;
  onBack: () => void;
}

export function ScannerCamera({ onCapture, onBack }: ScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 4/3 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Unable to access camera. Please check permissions and try again.');
      setIsStreaming(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) throw new Error('Canvas context not available');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const file = new File([blob], `supplement-scan-${timestamp}.jpg`, {
            type: 'image/jpeg'
          });
          
          onCapture(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.9);

    } catch (err) {
      console.error('Photo capture failed:', err);
      setError('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Update camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode, isStreaming, startCamera]);

  return (
    <div className="relative bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="bg-black/50 border-white/30 text-white hover:bg-black/70"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="text-white text-center">
            <h3 className="font-semibold">Camera Scanner</h3>
            <p className="text-xs text-white/80">Position supplement label in frame</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={switchCamera}
            className="bg-black/50 border-white/30 text-white hover:bg-black/70"
            disabled={!isStreaming}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover",
            !isStreaming && "hidden"
          )}
        />

        {/* Loading State */}
        {!isStreaming && !error && (
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
            <p>Starting camera...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-white text-center p-6">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="font-semibold mb-2">Camera Error</h3>
            <p className="text-sm text-white/80 mb-4">{error}</p>
            <Button
              onClick={startCamera}
              className="bg-white text-black hover:bg-gray-100"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Viewfinder Overlay */}
        {isStreaming && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner guides */}
            <div className="absolute top-8 left-8 w-8 h-8 border-l-2 border-t-2 border-white/70" />
            <div className="absolute top-8 right-8 w-8 h-8 border-r-2 border-t-2 border-white/70" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-l-2 border-b-2 border-white/70" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-r-2 border-b-2 border-white/70" />
            
            {/* Center guide */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border border-white/50 bg-white/10 rounded-full" />
            </div>
          </div>
        )}

        {/* Capture processing overlay */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
              <p>Capturing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-center space-x-8">
          {/* Stop Camera */}
          <Button
            variant="outline"
            onClick={stopCamera}
            disabled={!isStreaming}
            className="bg-black/50 border-white/30 text-white hover:bg-black/70"
          >
            <StopIcon className="w-5 h-5" />
          </Button>

          {/* Capture Button */}
          <Button
            onClick={capturePhoto}
            disabled={!isStreaming || isCapturing}
            className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black border-4 border-white/30 shadow-lg transform hover:scale-110 transition-all duration-200"
          >
            <CameraIcon className="w-8 h-8" />
          </Button>

          {/* Camera Switch */}
          <Button
            variant="outline"
            onClick={switchCamera}
            disabled={!isStreaming}
            className="bg-black/50 border-white/30 text-white hover:bg-black/70"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-center mt-4">
          <p className="text-white/80 text-sm">
            Align the supplement facts panel within the guides and tap the capture button
          </p>
        </div>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
