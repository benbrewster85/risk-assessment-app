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

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // URL is valid for 1 hour

      if (error) {
        console.error("Error creating signed URL:", error);
        setImageUrl(null);
      } else {
        setImageUrl(data.signedUrl);
      }
    };

    getSignedUrl();
  }, [filePath, bucket, supabase.storage]);

  if (!imageUrl) {
    return <div className={`bg-gray-200 animate-pulse ${className}`}></div>;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageUrl} className={className} alt={alt} />;
}
