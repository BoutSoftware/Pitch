import React from "react";

type FileInputType = 'image' | 'pdf' | 'document' | 'audio' | 'video' | 'any';

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  isMultiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  className?: string;
  classNames?: {
    base?: string;
  };
  type?: FileInputType;
}

// File type catalog
const fileTypeCatalog: Record<FileInputType, { acceptString: string; name: string; id: string }> = {
  image: {
    acceptString: 'image/*',
    name: 'Image',
    id: 'image'
  },
  pdf: {
    acceptString: '.pdf',
    name: 'PDF',
    id: 'pdf'
  },
  document: {
    acceptString: '.pdf,.doc,.docx,.txt,.rtf',
    name: 'Document',
    id: 'document'
  },
  audio: {
    acceptString: 'audio/*',
    name: 'Audio',
    id: 'audio'
  },
  video: {
    acceptString: 'video/*',
    name: 'Video',
    id: 'video'
  },
  any: {
    acceptString: '*/*',
    name: 'File',
    id: 'any'
  }
};

export default function FileInput({ className, classNames, label, type = 'any', ...inputProps }: FileInputProps) {
  const [files, setFiles] = React.useState<File[]>([]);

  return (
    <div>
      {/* Label */}
      {label && (
        <span className="block text-sm text-content2-foreground mb-2">
          {label}
        </span>
      )}

      {/* File Input */}
      <label className={`flex w-full items-stretch cursor-pointer ${classNames?.base || ""}`}>
        <input
          type="file"
          className="hidden"
          multiple={inputProps.isMultiple}
          accept={fileTypeCatalog[type].acceptString}
          onChange={(e) => {
            const selectedFiles = e.target.files;
            if (selectedFiles) {
              const fileArray = Array.from(selectedFiles);
              setFiles(fileArray);
              inputProps.onFilesChange?.(fileArray);
              inputProps.onChange?.(e); // Call the original onChange if provided
            }
          }}
        />

        {/* Button */}
        <span className={`flex border-2 bg-default-100 text-content2-foreground border-content2 rounded-s-lg p-2 text-center text-nowrap shrink-0 ${className}`}>
          {inputProps.isMultiple ? `Select ${fileTypeCatalog[type].name}s` : `Select ${fileTypeCatalog[type].name}`}
        </span>

        {/* Display selected file name */}
        <span className="flex items-center grow px-2 border-2 border-content2 border-s-0 rounded-e-lg">
          {files.length > 0
            ? files.map((file, index) => (
              <span key={index} className="text-sm text-content2-foreground">
                {file.name.length > 20 ? file.name.slice(0, 20) + "…" : file.name}
                {index < files.length - 1 && ", "}
              </span>
            ))
            : <span className="text-content2-foreground">No file selected</span>
          }
        </span>
      </label>

      {/* Description */}
      {inputProps.description && (
        <p className="text-xs text-content2-foreground mt-1">
          {inputProps.description}
        </p>
      )}
    </div>
  );
}