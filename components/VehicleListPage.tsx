"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Vehicle, TeamMember } from "@/lib/types";
import AddVehicleModal from "./AddVehicleModal";
import LogMileageModal from "./LogMileageModal";
import { Plus, Download, Edit } from "react-feather";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import ConfirmModal from "./ConfirmModal";
import { useRouter } from "next/navigation";

type VehicleListPageProps = {
  initialVehicles: Vehicle[];
  teamMembers: TeamMember[];
  teamId: string | null;
  isCurrentUserAdmin: boolean;
  canCurrentUserEdit: boolean;
  currentUserId: string;
};

export default function VehicleListPage({
  initialVehicles,
  teamMembers,
  teamId,
  isCurrentUserAdmin,
  currentUserId,
}: VehicleListPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false);

  useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  const handleSuccess = () => {
    router.refresh();
  };

  const openCreateModal = () => {
    setEditingVehicle(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsAddModalOpen(true);
  };

  const handleDeleteVehicle = async () => {
    if (!deletingVehicle) return;
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", deletingVehicle.id);
    if (error) {
      toast.error(`Failed to delete vehicle: ${error.message}`);
    } else {
      toast.success(`Vehicle ${deletingVehicle.registration_number} deleted.`);
      setVehicles(vehicles.filter((v) => v.id !== deletingVehicle.id));
    }
    setDeletingVehicle(null);
  };

  return (
    <>
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleSuccess}
        teamId={teamId}
        teamMembers={teamMembers}
        vehicleToEdit={editingVehicle}
      />
      <LogMileageModal
        isOpen={isMileageModalOpen}
        onClose={() => setIsMileageModalOpen(false)}
        onSuccess={handleSuccess}
        vehicles={vehicles}
        teamId={teamId}
        userId={currentUserId}
      />
      <ConfirmModal
        isOpen={deletingVehicle !== null}
        onClose={() => setDeletingVehicle(null)}
        onConfirm={handleDeleteVehicle}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle ${deletingVehicle?.registration_number}? This action cannot be undone.`}
        isDestructive={true}
        confirmText="Delete"
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Vehicle Management</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsMileageModalOpen(true)}
                className="bg-green-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-700 flex items-center transition-colors"
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log Journey</span>
              </button>
              {isCurrentUserAdmin && (
                <>
                  <a
                    href="/api/vehicles/export"
                    download
                    className="bg-gray-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-gray-700 flex items-center transition-colors"
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </a>
                  <button
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
                  >
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Vehicle</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MOT Due
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => {
                  const serviceDueDate =
                    vehicle.last_serviced_date && vehicle.service_cycle_months
                      ? new Date(
                          new Date(vehicle.last_serviced_date).setMonth(
                            new Date(vehicle.last_serviced_date).getMonth() +
                              vehicle.service_cycle_months
                          )
                        )
                      : null;
                  const assigneeName =
                    `${(vehicle as any).assignee_first_name || ""} ${(vehicle as any).assignee_last_name || ""}`.trim();
                  const ownerName =
                    `${(vehicle as any).owner_first_name || ""} ${(vehicle as any).owner_last_name || ""}`.trim();

                  return (
                    <tr key={vehicle.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-semibold">
                        <Link
                          href={`/dashboard/vehicles/${vehicle.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {vehicle.registration_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.manufacturer}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {assigneeName || "--"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {serviceDueDate
                          ? serviceDueDate.toLocaleDateString("en-GB")
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {vehicle.mot_due_date
                          ? new Date(vehicle.mot_due_date).toLocaleDateString(
                              "en-GB"
                            )
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        {isCurrentUserAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(vehicle)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingVehicle(vehicle)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-8">
                      No vehicles added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
