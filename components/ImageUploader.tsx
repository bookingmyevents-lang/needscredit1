import React from 'react';
import * as Icons from './Icons';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  currentImageUrl?: string;
  size?: 'small' | 'large';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, currentImageUrl, size = 'large' }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB size limit
          alert("File is too large. Please select an image under 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const sizeClasses = {
      large: 'w-32 h-32',
      small: 'w-24 h-24'
  };
  const iconSizeClasses = {
      large: 'w-24 h-24',
      small: 'w-16 w-16'
  }
  const pencilSizeClasses = {
      large: 'w-8 h-8',
      small: 'w-6 h-6'
  }

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
      />
      <div
        className={`${sizeClasses[size]} relative rounded-full border-4 border-white shadow-lg overflow-hidden cursor-pointer bg-neutral-200 flex items-center justify-center group`}
        onClick={handleClick}
      >
        {currentImageUrl ? (
          <img src={currentImageUrl} alt="Profile Preview" className="w-full h-full object-cover" />
        ) : (
          <Icons.UserCircleIcon className={`${iconSizeClasses[size]} text-neutral-400`} />
        )}
         <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
            <Icons.PencilIcon className={`${pencilSizeClasses[size]} text-white`} />
        </div>
      </div>
       <button type="button" onClick={handleClick} className="mt-4 text-sm font-semibold text-primary hover:underline">
          {currentImageUrl ? 'Change Photo' : 'Upload Photo'}
       </button>
    </div>
  );
};

export default ImageUploader;
