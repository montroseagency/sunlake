'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ImageItem {
  id: string;
  file?: File;
  url?: string;
  preview: string;
  uploaded?: boolean;
}

interface ImageUploadDnDProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  onRemove: (id: string) => void;
  maxImages?: number;
  allowUrls?: boolean;
}

function SortableImage({ image, onRemove }: { image: ImageItem; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group aspect-square bg-neutral-100 rounded-lg overflow-hidden border-2 border-neutral-200 hover:border-primary-500 cursor-move"
    >
      <img
        src={image.preview}
        alt={`Upload ${image.id}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(image.id);
          }}
          className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {image.uploaded && (
        <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
          Uploaded
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
        {image.file ? 'File' : 'URL'}
      </div>
    </div>
  );
}

export default function ImageUploadDnD({
  images,
  onImagesChange,
  onRemove,
  maxImages = 20,
  allowUrls = true,
}: ImageUploadDnDProps) {
  const [urlInput, setUrlInput] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages: ImageItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
    }));

    onImagesChange([...images, ...newImages]);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    if (images.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImage: ImageItem = {
      id: `${Date.now()}-${Math.random()}`,
      url: urlInput,
      preview: urlInput,
      uploaded: false,
    };

    onImagesChange([...images, newImage]);
    setUrlInput('');
  };

  return (
    <div className="space-y-4">
      {/* Upload Mode Toggle */}
      {allowUrls && (
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setUploadMode('file')}
            className={`px-4 py-2 rounded ${
              uploadMode === 'file'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-200 text-neutral-700'
            }`}
          >
            Upload Files
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`px-4 py-2 rounded ${
              uploadMode === 'url'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-200 text-neutral-700'
            }`}
          >
            Add from URL
          </button>
        </div>
      )}

      {/* File Upload */}
      {uploadMode === 'file' && (
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg
              className="w-12 h-12 text-neutral-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-neutral-600">Click to upload images or drag and drop</span>
            <span className="text-sm text-neutral-400 mt-1">
              PNG, JPG, GIF up to 10MB (max {maxImages} images)
            </span>
          </label>
        </div>
      )}

      {/* URL Input */}
      {allowUrls && uploadMode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Add URL
          </button>
        </div>
      )}

      {/* Drag and Drop Grid */}
      {images.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-neutral-900">
              Images ({images.length}/{maxImages})
            </h4>
            <p className="text-sm text-neutral-500">Drag to reorder</p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((image) => (
                  <SortableImage key={image.id} image={image} onRemove={onRemove} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
