"use client";

import Modal from "./Modal";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  isDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmButtonClasses = isDestructive
    ? "bg-red-600 hover:bg-red-700"
    : "bg-blue-600 hover:bg-blue-700";

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700">{message}</p>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${confirmButtonClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
