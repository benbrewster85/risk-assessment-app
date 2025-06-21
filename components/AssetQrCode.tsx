"use client";

// UPDATED: We are now importing the specific 'QRCodeCanvas' component
import { QRCodeCanvas } from "qrcode.react";

type AssetQrCodeProps = {
  assetId: string;
};

export default function AssetQrCode({ assetId }: AssetQrCodeProps) {
  const url = `${window.location.origin}/dashboard/assets/${assetId}`;

  return (
    <div>
      {/* UPDATED: We are now using the specific <QRCodeCanvas /> component */}
      <QRCodeCanvas value={url} size={256} level={"H"} includeMargin={true} />
      <p className="text-xs text-center mt-2 text-gray-500 break-all">{url}</p>
    </div>
  );
}
