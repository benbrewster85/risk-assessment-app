"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText } from "react-feather";

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
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!filePath) return;

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600); // URL is valid for 1 hour

      if (error) {
        console.error("Error creating signed URL:", error);
        setSignedUrl(null);
      } else {
        setSignedUrl(data.signedUrl);
      }
    };

    getSignedUrl();
  }, [filePath, bucket, supabase.storage]);

  const isPdf = filePath.toLowerCase().endsWith(".pdf");

  // Show a placeholder while the secure URL is being generated
  if (!signedUrl) {
    return <div className={`bg-gray-200 animate-pulse ${className}`}></div>;
  }

  // This function will be called when the user clicks the image/icon
  const openInNewTab = () => {
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={openInNewTab}
      className={`block border rounded-md p-2 hover:bg-gray-50 ${className}`}
    >
      {isPdf ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-700">
          <FileText />
          <span className="text-xs mt-1">PDF</span>
        </div>
      ) : (
        <img
          src={signedUrl}
          alt={alt}
          className="w-full h-full object-cover rounded-sm"
        />
      )}
    </button>
  );
}
