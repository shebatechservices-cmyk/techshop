import React from 'react';
import AddStaffModal from '../modals/AddStaffModal';
import EditStaffModal from '../modals/EditStaffModal';
import DeleteStaffModal from '../modals/DeleteStaffModal';
import AddDeviceModal from '../modals/AddDeviceModal';
import AddIpRuleModal from '../modals/AddIpRuleModal';
import InspectEventModal from '../modals/InspectEventModal';

export default function SecurityModals({
  isAddStaffOpen,
  setIsAddStaffOpen,
  newStaff,
  setNewStaff,
  roles,
  handleCreateStaff,
  generate3TypeStaffPassword,
  editingStaff,
  setEditingStaff,
  handleUpdateStaffSubmit,
  staffToDelete,
  setStaffToDelete,
  handleConfirmDeleteStaff,
  isAddDeviceOpen,
  setIsAddDeviceOpen,
  newDevice,
  setNewDevice,
  handleCreateDevice,
  isAddIpOpen,
  setIsAddIpOpen,
  newIpRule,
  setNewIpRule,
  handleCreateIpRule,
  inspectEvent,
  setInspectEvent,
}) {
  return (
    <>
      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        newStaff={newStaff}
        setNewStaff={setNewStaff}
        roles={roles}
        handleCreateStaff={handleCreateStaff}
        generate3TypeStaffPassword={generate3TypeStaffPassword}
      />

      <EditStaffModal
        editingStaff={editingStaff}
        onClose={() => setEditingStaff(null)}
        setEditingStaff={setEditingStaff}
        roles={roles}
        handleUpdateStaffSubmit={handleUpdateStaffSubmit}
        generate3TypeStaffPassword={generate3TypeStaffPassword}
      />

      <DeleteStaffModal
        staffToDelete={staffToDelete}
        onClose={() => setStaffToDelete(null)}
        handleConfirmDeleteStaff={handleConfirmDeleteStaff}
      />

      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        newDevice={newDevice}
        setNewDevice={setNewDevice}
        handleCreateDevice={handleCreateDevice}
      />

      <AddIpRuleModal
        isOpen={isAddIpOpen}
        onClose={() => setIsAddIpOpen(false)}
        newIpRule={newIpRule}
        setNewIpRule={setNewIpRule}
        handleCreateIpRule={handleCreateIpRule}
      />

      <InspectEventModal
        inspectEvent={inspectEvent}
        onClose={() => setInspectEvent(null)}
      />
    </>
  );
}
