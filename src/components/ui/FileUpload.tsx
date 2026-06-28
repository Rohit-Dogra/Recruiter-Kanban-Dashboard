import * as React from "react"
import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"

export interface FileUploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrop"> {
  accept?: string
  multiple?: boolean
  maxSizeMB?: number
  onFiles: (files: File[]) => void
  disabled?: boolean
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ accept, multiple = false, maxSizeMB = 10, onFiles, disabled = false, className, children, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = React.useState(false)

    const handleFiles = React.useCallback(
      (fileList: FileList | null) => {
        if (!fileList) return
        const maxBytes = maxSizeMB * 1024 * 1024
        const valid = Array.from(fileList).filter((f) => f.size <= maxBytes)
        if (valid.length) onFiles(valid)
      },
      [maxSizeMB, onFiles]
    )

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); if (!disabled) setIsDragging(true) }
    const onDragLeave = () => setIsDragging(false)
    const onDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (!disabled) handleFiles(e.dataTransfer.files)
    }

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload file"
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); inputRef.current?.click() } }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors",
          isDragging && "border-primary bg-primary/5",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
        />
        {children ?? (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxSizeMB}MB{accept ? ` · ${accept}` : ""}
            </p>
          </>
        )}
      </div>
    )
  }
)
FileUpload.displayName = "FileUpload"

export { FileUpload }
