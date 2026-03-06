import { useState, useCallback } from 'react';
import { Upload, Image, X, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isProcessing?: boolean;
}

export function ImageUpload({ onImageSelect, isProcessing = false }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  }, [handleFileChange]);

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {!preview ? (
        <label
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
            isDragging 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className={cn(
              "p-4 rounded-full mb-4 transition-all duration-300",
              isDragging ? "bg-primary/20" : "bg-muted"
            )}>
              <Upload className={cn(
                "w-8 h-8 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <p className="mb-2 text-sm text-foreground font-medium">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              Upload the back side of your product label
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG or JPEG (MAX. 10MB)
            </p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
        </label>
      ) : (
        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-border bg-card">
          <img 
            src={preview} 
            alt="Product preview" 
            className="w-full h-full object-contain"
          />
          
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">Analyzing image...</p>
              <p className="text-xs text-muted-foreground">Extracting product details</p>
              
              {/* Scanning effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan" />
              </div>
            </div>
          )}
          
          {!isProcessing && (
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-2 bg-background/90 hover:bg-background rounded-full shadow-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Image className="w-4 h-4" />
          <span>Product Label</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-muted-foreground" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Camera className="w-4 h-4" />
          <span>Clear Photo</span>
        </div>
      </div>
    </div>
  );
}
