'use client';

import { useState, type DragEvent } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadTimetableProps {
  onUpload: (fileDataUri: string) => void;
}

export function UploadTimetable({ onUpload }: UploadTimetableProps) {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const uploadIllustration = PlaceHolderImages.find(img => img.id === 'upload-illustration');

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onUpload(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (e.g., PNG, JPG).',
        variant: 'destructive',
      });
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden animate-in fade-in-50 duration-500">
      <div className="grid md:grid-cols-2">
        <div className="p-8 flex flex-col justify-center">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-3xl font-headline">Sync Your Schedule</CardTitle>
            <CardDescription>Upload a photo of your timetable to get started.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  'relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors',
                  dragActive ? 'border-primary bg-muted' : 'border-border'
                )}
              >
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, or GIF</p>
                  </div>
                </label>
                <Input id="dropzone-file" type="file" className="absolute h-full w-full opacity-0 cursor-pointer" onChange={handleChange} accept="image/*" />
              </div>
              <p className="text-center text-sm text-muted-foreground">or select a file from your device</p>
              <Button type="button" className="w-full" onClick={() => document.getElementById('dropzone-file')?.click()}>
                Choose File
              </Button>
            </form>
          </CardContent>
        </div>
        <div className="hidden md:block bg-secondary/50 p-8">
            {uploadIllustration && (
              <Image
                src={uploadIllustration.imageUrl}
                alt={uploadIllustration.description}
                data-ai-hint={uploadIllustration.imageHint}
                width={600}
                height={400}
                className="rounded-lg object-cover w-full h-full"
              />
            )}
        </div>
      </div>
    </Card>
  );
}
