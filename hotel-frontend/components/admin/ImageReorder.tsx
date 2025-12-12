'use client';

import { useState, useEffect } from 'react';
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

export interface UploadedImage {
  id: number;
  image?: string;
  image_url?: string;
  image_display?: string;
  alt_text?: string;
  is_primary?: boolean;
  order: number;
}

interface ImageReorderProps {
  images: UploadedImage[];
  onReorder: (images: UploadedImage[]) => void;
  onDelete?: (id: number) => void;
  onSetPrimary?: (id: number) => void;
  showPrimaryOption?: boolean;
}

function SortableUploadedImage({
  image,
  onDelete,
  onSetPrimary,
  showPrimaryOption,
}: {
  image: UploadedImage;
  onDelete?: (id: number) => void;
  onSetPrimary?: (id: number) => void;
  showPrimaryOption?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const imageUrl = image.image_display || image.image_url || image.image;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group aspect-square bg-neutral-100 rounded-lg overflow-hidden border-2 cursor-move ${
        image.is_primary ? 'border-primary-500' : 'border-neutral-200 hover:border-primary-500'
      }`}
    >
      <img
        src={imageUrl}
        alt={image.alt_text || `Image ${image.id}`}
        className="w-full h-full object-cover"
      />

      {/* Action Buttons Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {showPrimaryOption && onSetPrimary && !image.is_primary && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetPrimary(image.id);
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Set Primary
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this image?')) {
                onDelete(image.id);
              }
            }}
            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Primary Badge */}
      {image.is_primary && (
        <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium">
          Primary
        </div>
      )}

      {/* Order Number */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
        #{image.order}
      </div>
    </div>
  );
}

export default function ImageReorder({
  images: initialImages,
  onReorder,
  onDelete,
  onSetPrimary,
  showPrimaryOption = false,
}: ImageReorderProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id.toString() === active.id);
      const newIndex = images.findIndex((img) => img.id.toString() === over.id);

      const reorderedImages = arrayMove(images, oldIndex, newIndex);

      // Update order values
      const updatedImages = reorderedImages.map((img, index) => ({
        ...img,
        order: index,
      }));

      setImages(updatedImages);
      onReorder(updatedImages);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No images uploaded yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-neutral-900">
          Manage Images ({images.length})
        </h4>
        <p className="text-sm text-neutral-500">Drag to reorder</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((img) => img.id.toString())}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <SortableUploadedImage
                key={image.id}
                image={image}
                onDelete={onDelete}
                onSetPrimary={onSetPrimary}
                showPrimaryOption={showPrimaryOption}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
