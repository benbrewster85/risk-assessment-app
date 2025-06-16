"use client";

import { ReactNode } from "react";

type ReportPrintLayoutProps = {
  children: ReactNode;
};

export default function ReportPrintLayout({
  children,
}: ReportPrintLayoutProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-200 p-4 sm:p-8 print:bg-white">
      <div className="max-w-4xl mx-auto">
        {/* This button will be hidden when printing */}
        <div className="mb-8 text-right print:hidden">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Print / Save as PDF
          </button>
        </div>
        {/* This is the main content area styled to look like a document */}
        <div className="bg-white p-8 sm:p-12 shadow-lg print:shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
}
