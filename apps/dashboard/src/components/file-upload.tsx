"use client";

import { useCallback, useState } from "react";
import { Button } from "@eq-ex/ui/components/button";
import { Input } from "@eq-ex/ui/components/input";
import { Label } from "@eq-ex/ui/components/label";
import { X, Upload, Image, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@eq-ex/ui/utils/cn";
import { createClient } from "@eq-ex/shared/client";

interface FileUploadProps {
  /** Label for the upload field */
  label?: string;
  /** Current image URL to display */
  currentImage?: string;
  /** Bucket name for upload */
  bucket: string;
  /** Optional folder path within bucket */
  folder?: string;
  /** Callback when upload completes successfully */
  onUploadComplete?: (result: { url: string; path: string }) => void;
  /** Callback when upload fails */
  onUploadError?: (error: string) => void;
  /** Callback when file is removed */
  onRemove?: () => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Accepted file types */
  accept?: string;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Whether to show preview */
  showPreview?: boolean;
  /** Custom upload button text */
  uploadButtonText?: string;
  /** Whether to allow drag and drop */
  allowDragDrop?: boolean;
}

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
  preview?: string;
}

export function FileUpload({
  label = "Upload Image",
  currentImage,
  bucket,
  folder,
  onUploadComplete,
  onUploadError,
  onRemove,
  disabled = false,
  className,
  accept = "image/*",
  maxSizeMB = 5,
  showPreview = true,
  uploadButtonText = "Choose File",
  allowDragDrop = true,
}: FileUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
  });
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File size must be less than ${maxSizeMB}MB`;
      }

      const allowedTypes = accept.split(",").map((type) => type.trim());
      const isValidType = allowedTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.endsWith("/*")) {
          const baseType = type.slice(0, -1);
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isValidType) {
        return `File type not allowed. Accepted types: ${accept}`;
      }

      return null;
    },
    [accept, maxSizeMB]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setUploadState({
          status: "error",
          error: validationError,
        });
        onUploadError?.(validationError);
        return;
      }

      setUploadState({
        status: "uploading",
        preview: URL.createObjectURL(file),
      });

      try {
        const supabase = createClient();

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExt}`;

        // Create path with optional folder
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // Upload file directly to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          throw new Error(`Failed to upload file: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        const result = {
          url: urlData.publicUrl,
          path: data.path,
        };

        setUploadState({
          status: "success",
        });

        onUploadComplete?.(result);

        // Clear success state after a delay
        setTimeout(() => {
          setUploadState({ status: "idle" });
        }, 2000);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setUploadState({
          status: "error",
          error: errorMessage,
        });
        onUploadError?.(errorMessage);
      }
    },
    [bucket, folder, validateFile, onUploadComplete, onUploadError]
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      uploadFile(file);
    },
    [uploadFile]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [disabled, handleFileSelect]
  );

  const handleRemove = useCallback(() => {
    setUploadState({ status: "idle" });
    onRemove?.();
  }, [onRemove]);

  const displayImage = currentImage || uploadState.preview;

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      {/* Current Image Preview */}
      {showPreview && displayImage && (
        <div className="relative">
          <img
            src={displayImage}
            alt="Preview"
            className="w-32 h-20 object-cover rounded border"
          />
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-md p-4 text-center transition-colors",
          dragActive && allowDragDrop
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && allowDragDrop && "cursor-pointer hover:border-primary/50"
        )}
        onDragEnter={allowDragDrop ? handleDrag : undefined}
        onDragLeave={allowDragDrop ? handleDrag : undefined}
        onDragOver={allowDragDrop ? handleDrag : undefined}
        onDrop={allowDragDrop ? handleDrop : undefined}
      >
        <Input
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="space-y-2">
          {uploadState.status === "uploading" ? (
            <>
              <Upload className="mx-auto h-8 w-8 text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : uploadState.status === "success" ? (
            <>
              <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
              <p className="text-sm text-green-600">Upload successful!</p>
            </>
          ) : uploadState.status === "error" ? (
            <>
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <p className="text-sm text-red-600">{uploadState.error}</p>
            </>
          ) : (
            <>
              <Image className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {allowDragDrop
                    ? "Drop image here or click to browse"
                    : "Click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {accept} • Max {maxSizeMB}MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
              >
                {uploadButtonText}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
