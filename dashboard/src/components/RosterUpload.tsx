import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText } from 'lucide-react';
import { Button } from './ui';
import { clsx } from 'clsx';
import './RosterUpload.css';

interface RosterUploadProps {
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export const RosterUpload: React.FC<RosterUploadProps> = ({ onUpload, isLoading }) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      await onUpload(acceptedFiles[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx('roster-dropzone', {
        'dropzone-active': isDragActive,
        'dropzone-disabled': isLoading,
      })}
    >
      <input {...getInputProps()} />
      <div className="dropzone-content">
        <div className="dropzone-icon-wrapper">
          {isDragActive ? <FileText size={32} /> : <UploadCloud size={32} />}
        </div>
        <div className="dropzone-text">
          <p className="dropzone-title">
            {isDragActive ? 'Drop the file here' : 'Drag & drop attendance Excel / CSV here'}
          </p>
          <p className="dropzone-subtitle">
            Auto-detects <code>Roll No</code>, <code>Name</code>, and optional <code>Member ID</code>{' '}
            columns
          </p>
        </div>
        <Button variant="secondary" size="sm" disabled={isLoading} className="mt-4">
          {isLoading ? 'Working...' : 'Select File'}
        </Button>
      </div>
    </div>
  );
};
