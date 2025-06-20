"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type StorageImageProps = {
  filePath: string;
  bucket: string;
  className?: string;
  alt: string;
};

export default function StorageImage({
  filePath,
  bucket,
  className,
  alt,
}: StorageImageProps) {
  const supabase = createClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!filePath) return;

      // Create a signed URL that is valid for 1 hour (3600 seconds)
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error("Error creating signed URL:", error);
        setImageUrl(null); // Set to null on error
      } else {
        setImageUrl(data.signedUrl);
      }
    };

    getSignedUrl();
    // We only want this to run when the filePath changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

  if (!imageUrl) {
    // Show a simple loading skeleton while the secure URL is being generated
    return <div className={`bg-gray-200 animate-pulse ${className}`}></div>;
  }

  return <img src={imageUrl} className={className} alt={alt} />;
}
