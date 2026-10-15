import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Bed, 
  Search, 
  Filter, 
  Plus, 
  RotateCcw, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  User, 
  ChevronRight,
  Clock,
  MapPin,
  AlertCircle,
  Edit3,
  Trash2,
  Crown,
  DollarSign,
  Layers,
  Tag,
  MessageSquare,
  ExternalLink,
  Check,
  Phone,
  Mail,
  Send
} from 'lucide-react';
import { RoomService, FLOOR_CATEGORIES } from '../../services/roomService';
import { BookingRequestService } from '../../services/bookingRequestService';
import { POLARIS_CONFIG } from '../../polarisConfig';
import StatusChangeModal from './StatusChangeModal';
import NewBookingModal from './NewBookingModal';
import RoomDetailsModal from './RoomDetailsModal';
import RoomFormModal from './RoomFormModal';
import QuickPriceModal from './QuickPriceModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import AddBookingRequestModal from './AddBookingRequestModal';

/**
 * =========================================================================
 * AdminPortal Component
 * =========================================================================
 * 
 * Secret Admin CMS for Polaris Kalam Hotel (polarishotels.pk/admintopsecretmanage)
 * Features:
 * 1. Room Inventory across 4 Floors + Top Penthouse Suite
 * 2. 3 Room Status Options: 'available', 'booked', and 'in cleaning'
 * 3. Add and Remove Rooms dynamically
 * 4. Change Nightly Prices with instant seasonal adjustments
 * 5. Review, Approve & WhatsApp Contact for Direct Guest Booking Requests
 */
export default function AdminPortal({ onReturnToWebsite, onOpenBooking, onLogout }) {
  // Navigation Section: 'inventory' | 'requests'
  const [activeSection, setActiveSection] = useState('inventory');

  const [rooms, setRooms] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState('all');
  const [groupByFloor, setGroupByFloor] = useState(true);

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [activeRoomForStatus, setActiveRoomForStatus] = useState(null);
  const [targetStatus, setTargetStatus] = useState(null);

  // Add / Edit Room Modal State
  const [roomFormModalOpen, setRoomFormModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState(null);

  // Quick Price Modal State
  const [quickPriceModalOpen, setQuickPriceModalOpen] = useState(false);
  const [activeRoomForPrice, setActiveRoomForPrice] = useState(null);

  // Delete Room Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Add Booking Request Modal State
  const [addRequestModalOpen, setAddRequestModalOpen] = useState(false);

  // Other Modals
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [activeRoomForDetails, setActiveRoomForDetails] = useState(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');

  // Load rooms and booking requests with multi-source reactive sync
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [roomsData, requestsData] = await Promise.all([
        RoomService.getRooms(),
        BookingRequestService.getRequests()
      ]);
      setRooms(roomsData);
      setBookingRequests(requestsData);
      setIsLoading(false);
    }
    loadData();

    // 1. Direct memory subscriber callbacks
    const unsubRooms = RoomService.subscribe((updatedRooms) => {
      setRooms(updatedRooms);
    });

    const unsubRequests = BookingRequestService.subscribe((updatedRequests) => {
      setBookingRequests(updatedRequests);
    });

    // 2. Custom window event listener for instantaneous cross-component updates
    const handleCustomBookingUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBookingRequests([...e.detail]);
      }
    };
    window.addEventListener('polaris:booking-update', handleCustomBookingUpdate);

    // 3. Storage event listener for multi-tab sync
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('polaris_booking_requests')) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(parsed)) {
            setBookingRequests(parsed);
          }
        } catch (err) {
          console.error('Storage sync error:', err);
        }
      }
      if (e.key && (e.key.startsWith('polaris_hotel_rooms') || e.key.startsWith('polaris_rooms_inventory'))) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(parsed)) {
            setRooms(parsed);
          }
        } catch (err) {
          console.error('Storage sync error:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Tab focus and visibility sync (refreshes whenever staff switches tabs)
    const handleWindowFocus = async () => {
      try {
        const [freshRooms, freshRequests] = await Promise.all([
          RoomService.getRooms(),
          BookingRequestService.getRequests()
        ]);
        setRooms(freshRooms);
        setBookingRequests(freshRequests);
      } catch (err) {
        // silent
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleWindowFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubRooms();
      unsubRequests();
      window.removeEventListener('polaris:booking-update', handleCustomBookingUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // --- STATUS CHANGE HANDLERS ---
  const handleInitiateStatusChange = (room, status) => {
    if (room.status === status) return;
    setActiveRoomForStatus(room);
    setTargetStatus(status);
    setStatusModalOpen(true);
  };

  const handleConfirmStatus = async (roomId, newStatus, meta) => {
    try {
      const updatedRoom = await RoomService.updateStatus(roomId, newStatus, meta);
      const labels = {
        available: 'AVAILABLE (Open for guest booking)',
        booked: 'BOOKED (Blocked on website)',
        'in cleaning': 'IN CLEANING (Housekeeping notified)'
      };

      // If a booking is recorded with guest details (e.g. from NewBookingModal),
      // synchronize it into the Booking Requests queue and update the red notification badge!
      if (newStatus === 'booked' && meta && meta.guestName) {
        const targetRoom = rooms.find((r) => r.id === roomId) || updatedRoom;
        const qStatus = meta.queueStatus || 'pending';

        await BookingRequestService.createRequest({
          guestName: meta.guestName,
          phone: meta.phone || '+92 300 0000000',
          email: meta.email || 'concierge@polarishotel.pk',
          roomId: targetRoom.id,
          roomNumber: targetRoom.roomNumber,
          roomName: targetRoom.name,
          tier: targetRoom.tier,
          floor: targetRoom.floor,
          pricePKR: targetRoom.pricePKR,
          checkIn: meta.checkIn,
          checkOut: meta.checkOut,
          guests: meta.guests || '2 Guests',
          notes: meta.notes ? `${meta.notes} [Source: ${meta.source || 'CMS'}]` : `Source: ${meta.source || 'CMS'}`,
          status: qStatus
        });

        // Immediately update state
        const freshRequests = await BookingRequestService.getRequests();
        setBookingRequests(freshRequests);

        const newPending = freshRequests.filter((r) => r.status === 'pending').length;
        triggerToast(
          qStatus === 'pending'
            ? `Room #${updatedRoom.roomNumber} set to BOOKED. Request logged to inquiries queue (Badge updated: ${newPending} Pending).`
            : `Room #${updatedRoom.roomNumber} status set to BOOKED.`
        );
      } else {
        triggerToast(`Room #${updatedRoom.roomNumber} status set to ${labels[newStatus] || newStatus}.`);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error updating status: ' + err.message);
    }
  };

  // --- ADD / EDIT ROOM HANDLERS ---
  const handleOpenAddRoom = () => {
    setRoomToEdit(null);
    setRoomFormModalOpen(true);
  };

  const handleOpenEditRoom = (room) => {
    setRoomToEdit(room);
    setRoomFormModalOpen(true);
  };

  const handleSaveRoom = async (formData, editId) => {
    if (editId) {
      await RoomService.updateRoom(editId, formData);
      triggerToast(`Room #${formData.roomNumber} specifications updated.`);
    } else {
      const created = await RoomService.addRoom(formData);
      triggerToast(`Room #${created.roomNumber} (${created.name}) added to ${created.floor}.`);
    }
  };

  // --- PRICE CHANGE HANDLERS ---
  const handleOpenQuickPrice = (room) => {
    setActiveRoomForPrice(room);
    setQuickPriceModalOpen(true);
  };

  const handleSavePrice = async (roomId, newPrice) => {
    const updated = await RoomService.updatePrice(roomId, newPrice);
    triggerToast(`Room #${updated.roomNumber} nightly rate updated to PKR ${newPrice.toLocaleString()}.`);
  };

  // --- DELETE ROOM HANDLERS ---
  const handleOpenDelete = (room) => {
    setRoomToDelete(room);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (roomId) => {
    const deleted = await RoomService.deleteRoom(roomId);
    triggerToast(`Room #${deleted.roomNumber} removed from hotel inventory.`);
  };

  // --- BOOKING REQUEST HANDLERS ---
  const handleCreateBookingRequest = async (reqData) => {
    try {
      const created = await BookingRequestService.createRequest(reqData);

      if (reqData.status === 'approved') {
        await RoomService.updateStatus(reqData.roomId, 'booked', {
          guestName: reqData.guestName,
          checkIn: reqData.checkIn,
          checkOut: reqData.checkOut,
          source: 'Staff CMS Entry (Direct Approved)',
          notes: `Phone: ${reqData.phone} • Email: ${reqData.email}. Notes: ${reqData.notes}`
        });
      }

      const [freshRooms, freshRequests] = await Promise.all([
        RoomService.getRooms(),
        BookingRequestService.getRequests()
      ]);
      setRooms(freshRooms);
      setBookingRequests(freshRequests);

      const pendingCount = freshRequests.filter((r) => r.status === 'pending').length;
      triggerToast(
        reqData.status === 'pending'
          ? `New reservation inquiry for ${reqData.guestName} added to Pending queue. (Badge updated: ${pendingCount} Pending)`
          : `Reservation for ${reqData.guestName} confirmed & Room #${reqData.roomNumber} locked as BOOKED.`
      );
    } catch (err) {
      console.error('Error creating booking request:', err);
      triggerToast('Error saving request: ' + err.message);
    }
  };

  const handleApproveBookingRequest = async (request) => {
    try {
      // 1. Lock the room as 'booked'
      await RoomService.updateStatus(request.roomId, 'booked', {
        guestName: request.guestName,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        source: 'polarishotels.pk/booking (WhatsApp Confirmed)',
        notes: `Guest WhatsApp: ${request.phone} • Email: ${request.email}. Special notes: ${request.notes}`
      });

      // 2. Update request status to 'approved'
      await BookingRequestService.updateStatus(request.id, 'approved', 'Approved by Front Desk & Room Locked on Website');

      // Refresh to guarantee state is fresh
      const [freshRooms, freshRequests] = await Promise.all([
        RoomService.getRooms(),
        BookingRequestService.getRequests()
      ]);
      setRooms(freshRooms);
      setBookingRequests(freshRequests);

      triggerToast(`Reservation Approved! Room #${request.roomNumber} is now locked as BOOKED on the website.`);
    } catch (err) {
      console.error('Error approving booking request:', err);
      triggerToast('Error approving request: ' + err.message);
    }
  };

  const handleMarkContacted = async (requestId) => {
    await BookingRequestService.updateStatus(requestId, 'contacted');
    const freshRequests = await BookingRequestService.getRequests();
    setBookingRequests(freshRequests);
    triggerToast('Request marked as Contacted via WhatsApp.');
  };

  const handleDeclineRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to decline / archive this request?')) {
      await BookingRequestService.updateStatus(requestId, 'declined');
      const freshRequests = await BookingRequestService.getRequests();
      setBookingRequests(freshRequests);
      triggerToast('Booking request declined.');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Permanently remove this booking inquiry from the CMS database?')) {
      await BookingRequestService.deleteRequest(requestId);
      const freshRequests = await BookingRequestService.getRequests();
      setBookingRequests(freshRequests);
      triggerToast('Booking inquiry permanently removed.');
    }
  };

  // Reset demo requests
  const handleResetInquiries = async () => {
    if (window.confirm('Reset booking inquiries queue back to initial demo requests?')) {
      await BookingRequestService.resetToDefaults();
      const freshRequests = await BookingRequestService.getRequests();
      setBookingRequests(freshRequests);
      triggerToast('Booking inquiries reset to initial 2 demo requests (Badge: 2).');
    }
  };

  // Reset to defaults
  const handleResetDefaults = async () => {
    if (window.confirm('Reset all rooms back to the default 4-floor + Top Suite setup?')) {
      await RoomService.resetToDefaults();
      triggerToast('All rooms reset to default Polaris Kalam 4-floor configuration.');
    }
  };

  // Stats calculation
  const stats = RoomService.calculateStats(rooms);
  const pendingRequestsCount = bookingRequests.filter((r) => r.status === 'pending').length;

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (selectedStatusFilter !== 'all' && room.status !== selectedStatusFilter) {
      return false;
    }
    if (selectedFloorFilter !== 'all' && room.floor !== selectedFloorFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = room.roomNumber.toLowerCase().includes(q);
      const matchName = room.name.toLowerCase().includes(q);
      const matchTier = room.tier.toLowerCase().includes(q);
      const matchFloor = room.floor.toLowerCase().includes(q);
      const matchGuest = room.activeBooking?.guestName?.toLowerCase().includes(q);
      return matchNumber || matchName || matchTier || matchFloor || matchGuest;
    }
    return true;
  });

  // Render individual room card
  const renderRoomCard = (room) => {
    const isAvailable = room.status === 'available';
    const isBooked = room.status === 'booked';
    const isCleaning = room.status === 'in cleaning';
    const isTopSuite = room.floor === 'Top Suite';

    return (
      <div
        key={room.id}
        className={`relative rounded-xl bg-white border transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-2xs ${
          isTopSuite
            ? 'border-[#B48A28]/60 shadow-[0_4px_20px_rgba(180,138,40,0.12)] ring-1 ring-[#B48A28]/30'
            : isBooked
            ? 'border-rose-200 hover:border-rose-300 hover:shadow-md'
            : isCleaning
            ? 'border-amber-200 hover:border-amber-300 hover:shadow-md'
            : 'border-stone-200 hover:border-emerald-300 hover:shadow-md'
        }`}
      >
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`font-mono text-xs px-2.5 py-0.5 rounded font-bold ${
                isTopSuite ? 'bg-[#B48A28] text-white shadow-xs' : 'bg-stone-100 border border-stone-200 text-stone-800'
              }`}>
                #{room.roomNumber}
              </span>

              <span className={`text-[11px] font-mono flex items-center space-x-1 ${
                isTopSuite ? 'text-[#B48A28] font-semibold' : 'text-stone-500'
              }`}>
                {isTopSuite && <Crown className="w-3 h-3 text-[#B48A28]" />}
                <span>{room.floor}</span>
              </span>
            </div>

            {/* Current Status Pill */}
            {isAvailable && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>AVAILABLE</span>
              </span>
            )}

            {isBooked && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>BOOKED</span>
              </span>
            )}

            {isCleaning && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>IN CLEANING</span>
              </span>
            )}
          </div>

          <div className="mt-3">
            <h3 className="font-display text-lg text-stone-900 font-medium group-hover:text-[#B48A28] transition-colors">
              {room.name}
            </h3>
            
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-stone-500 text-[11.5px]">{room.tier}</span>
              
              <button
                type="button"
                onClick={() => handleOpenQuickPrice(room)}
                className="group/price flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all"
                title="Click to edit nightly price"
              >
                <span className="font-mono text-[#B48A28] font-bold text-xs">
                  PKR {room.pricePKR.toLocaleString()} / nt
                </span>
                <Edit3 className="w-3 h-3 text-[#B48A28] opacity-70 group-hover/price:opacity-100" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100">
            {isBooked && room.activeBooking && (
              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 text-[11px]">Guest:</span>
                  <span className="text-stone-900 font-medium truncate max-w-[170px]">
                    {room.activeBooking.guestName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Dates:</span>
                  <span className="text-rose-700 font-mono font-medium">
                    {room.activeBooking.checkIn} → {room.activeBooking.checkOut}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-rose-100">
                  <span className="truncate max-w-[150px]">Src: {room.activeBooking.source}</span>
                  <span className="text-rose-700 uppercase font-mono font-bold">Site Locked</span>
                </div>
              </div>
            )}

            {isCleaning && room.cleaningInfo && (
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 text-[11px]">Housekeeping:</span>
                  <span className="text-stone-900 font-medium truncate max-w-[170px]">
                    {room.cleaningInfo.assignedTo}
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 truncate">
                  {room.cleaningInfo.priority}
                </div>
                <button
                  onClick={() => handleConfirmStatus(room.id, 'available', { inspectedBy: 'Quick Turnover Pass' })}
                  className="w-full mt-1.5 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10.5px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center space-x-1 font-medium"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Mark Cleaned & Available</span>
                </button>
              </div>
            )}

            {isAvailable && (
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-800 text-[11px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Room Sanitized & Inspected</span>
                </div>
                <p className="text-[10.5px] text-stone-600 leading-tight">
                  Available on public website for direct booking requests.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3-OPTION SEGMENTED BUTTONS */}
        <div className="p-4 bg-stone-50/80 border-t border-stone-100 space-y-2.5">
          <div className="text-[9.5px] font-mono uppercase tracking-widest text-stone-500 font-medium">
            Update Room Status:
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleInitiateStatusChange(room, 'available')}
              disabled={isAvailable}
              className={`py-2 px-1 rounded text-[11px] font-mono uppercase tracking-wider transition-all border text-center ${
                isAvailable
                  ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs cursor-default'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              ✓ Available
            </button>

            <button
              onClick={() => handleInitiateStatusChange(room, 'booked')}
              disabled={isBooked}
              className={`py-2 px-1 rounded text-[11px] font-mono uppercase tracking-wider transition-all border text-center ${
                isBooked
                  ? 'bg-rose-600 text-white font-bold border-rose-600 shadow-xs cursor-default'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800'
              }`}
            >
              ✕ Booked
            </button>

            <button
              onClick={() => handleInitiateStatusChange(room, 'in cleaning')}
              disabled={isCleaning}
              className={`py-2 px-1 rounded text-[11px] font-mono uppercase tracking-wider transition-all border text-center ${
                isCleaning
                  ? 'bg-amber-500 text-white font-bold border-amber-500 shadow-xs cursor-default'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800'
              }`}
            >
              🧹 Cleaning
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenEditRoom(room)}
                className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-[#B48A28] flex items-center space-x-1 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>

              <span className="text-stone-300">•</span>

              <button
                onClick={() => {
                  setActiveRoomForDetails(room);
                  setDetailsModalOpen(true);
                }}
                className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 flex items-center space-x-1 transition-colors"
              >
                <span>Specs & Log</span>
              </button>
            </div>

            <button
              onClick={() => handleOpenDelete(room)}
              className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Remove room from inventory"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col font-sans selection:bg-[#F3E3B5] selection:text-stone-900">
      
      {/* =========================================================================
          TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Brand Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full border border-[#B48A28]/30 flex items-center justify-center bg-[#FAF6ED] p-1.5 shadow-[0_0_15px_rgba(180,138,40,0.12)]">
              <img
                src={POLARIS_CONFIG.emblem}
                alt="Polaris Star"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(180,138,40,0.3)]"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display text-lg tracking-[0.2em] font-semibold text-stone-900">
                  POLARIS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                  SECRET STAFF CMS
                </span>
              </div>
              <p className="text-[10px] tracking-wider text-stone-500 uppercase font-mono">
                polarishotels.pk/admintopsecretmanage
              </p>
            </div>
          </div>

          {/* Section Switcher: Inventory vs Booking Requests */}
          <div className="hidden md:flex items-center space-x-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200/80">
            <button
              onClick={() => setActiveSection('inventory')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center space-x-2 ${
                activeSection === 'inventory'
                  ? 'bg-white text-stone-900 font-bold shadow-xs border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Bed className="w-3.5 h-3.5 text-[#B48A28]" />
              <span>Room Inventory ({rooms.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('requests')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center space-x-2 ${
                activeSection === 'requests'
                  ? 'bg-white text-stone-900 font-bold shadow-xs border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#B48A28]" />
              <span>Booking Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5">
            {onOpenBooking && (
              <button
                onClick={onOpenBooking}
                className="px-3.5 py-1.5 rounded-lg border border-[#B48A28]/40 bg-amber-50 hover:bg-amber-100 text-xs font-mono uppercase tracking-wider text-[#8A661C] hover:text-stone-900 transition-all flex items-center space-x-1.5 shadow-2xs font-semibold"
                title="Preview live guest booking portal in Staff Mode (Option A)"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#B48A28]" />
                <span className="hidden sm:inline">Preview Booking Portal</span>
                <span className="sm:hidden">Booking</span>
              </button>
            )}

            <button
              onClick={onReturnToWebsite}
              className="px-3.5 py-1.5 rounded-lg border border-stone-300 hover:border-rose-400 hover:bg-rose-50 text-xs font-mono uppercase tracking-wider text-stone-700 hover:text-rose-700 transition-all flex items-center space-x-1.5"
              title="Exit Admin Console & Auto-Logout (Option C)"
            >
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Exit & Lock CMS</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden border-b border-stone-200 bg-stone-100/90 px-4 py-2 flex items-center space-x-2">
        <button
          onClick={() => setActiveSection('inventory')}
          className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider text-center rounded-lg ${
            activeSection === 'inventory' ? 'bg-white text-stone-900 font-bold shadow-2xs border border-stone-200' : 'text-stone-600'
          }`}
        >
          Inventory ({rooms.length})
        </button>
        <button
          onClick={() => setActiveSection('requests')}
          className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider text-center rounded-lg flex items-center justify-center space-x-1.5 ${
            activeSection === 'requests' ? 'bg-white text-stone-900 font-bold shadow-2xs border border-stone-200' : 'text-stone-600'
          }`}
        >
          <span>Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Live Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div className="bg-white border border-[#B48A28]/40 text-stone-900 px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-mono max-w-md">
            <ShieldCheck className="w-4 h-4 text-[#B48A28] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN BODY
          ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        
        {/* =======================================================================
            SECTION 1: GUEST BOOKING REQUESTS (WhatsApp Integration)
            ======================================================================= */}
        {activeSection === 'requests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl text-stone-900 tracking-wide font-medium flex items-center space-x-3">
                  <span>Guest Reservation Inquiries</span>
                  {pendingRequestsCount > 0 && (
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                      {pendingRequestsCount} Pending
                    </span>
                  )}
                </h1>
                <p className="text-xs text-stone-500 font-light mt-1">
                  Submitted from <strong>polarishotels.pk/booking</strong>. Review inquiries, chat with guests directly on WhatsApp, and approve reservations to automatically lock the room.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 self-start sm:self-auto">
                <button
                  onClick={() => setAddRequestModalOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-[#B48A28] hover:bg-[#9E7719] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center space-x-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Booking Request</span>
                </button>

                <button
                  onClick={handleResetInquiries}
                  className="p-2.5 rounded-lg border border-stone-300 hover:border-stone-400 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                  title="Reset booking requests to initial demo items"
                  aria-label="Reset requests"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveSection('inventory')}
                  className="px-4 py-2.5 rounded-lg border border-stone-300 hover:border-[#B48A28] text-xs font-mono uppercase tracking-wider text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  ← Back to Inventory
                </button>
              </div>
            </div>

            {bookingRequests.length === 0 ? (
              <div className="py-20 text-center rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-4">
                <MessageSquare className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm text-stone-700 font-mono">No booking requests submitted yet.</p>
                <p className="text-xs text-stone-500">Inquiries submitted via polarishotels.pk/booking or staff entries will appear here.</p>
                <button
                  onClick={() => setAddRequestModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#B48A28] hover:bg-[#9E7719] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all inline-flex items-center space-x-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Booking Request</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isContacted = req.status === 'contacted';
                  const isDeclined = req.status === 'declined';

                  return (
                    <div
                      key={req.id}
                      className={`p-6 rounded-2xl bg-white border transition-all shadow-2xs ${
                        isApproved
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isPending
                          ? 'border-[#B48A28]/50 shadow-md shadow-amber-900/5'
                          : 'border-stone-200'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        
                        {/* Guest & Suite Details */}
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-display text-xl text-stone-900 font-medium">
                              {req.guestName}
                            </span>

                            {/* Status badge */}
                            {isPending && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                                Pending Review
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approved & Locked</span>
                              </span>
                            )}
                            {isContacted && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-sky-50 border border-sky-200 text-sky-800 font-bold">
                                Contacted on WhatsApp
                              </span>
                            )}
                            {isDeclined && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-stone-100 border border-stone-200 text-stone-600 font-bold">
                                Declined / Archived
                              </span>
                            )}
                          </div>

                          {/* Requested Room Info */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                            <span className="px-2.5 py-1 rounded bg-stone-100 border border-stone-200 font-mono text-[#B48A28] font-semibold">
                              Room #{req.roomNumber} — {req.roomName} ({req.floor})
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="font-mono text-stone-900 font-medium">
                              {req.checkIn} → {req.checkOut} ({req.nights} Nights)
                            </span>
                            <span className="text-stone-300">•</span>
                            <span>{req.guests}</span>
                            <span className="text-stone-300">•</span>
                            <span className="font-mono text-[#B48A28] font-bold">
                              Est. PKR {(req.pricePKR * req.nights).toLocaleString()}
                            </span>
                          </div>

                          {/* Contact Channels */}
                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-500 pt-1">
                            <span className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{req.phone}</span>
                            </span>
                            <span className="flex items-center space-x-1.5 text-stone-700">
                              <Mail className="w-3.5 h-3.5" />
                              <span>{req.email}</span>
                            </span>
                            <span className="text-stone-400 text-[11px]">
                              Submitted: {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          {/* Notes */}
                          {req.notes && (
                            <p className="text-xs text-stone-700 bg-stone-50 border border-stone-200 p-3 rounded-lg font-light italic">
                              "{req.notes}"
                            </p>
                          )}
                        </div>

                        {/* Actions for Request */}
                        <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2.5 shrink-0">
                          
                          {/* 1. CHAT DIRECTLY ON WHATSAPP */}
                          <a
                            href={BookingRequestService.generateWhatsAppLink(req)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleMarkContacted(req.id)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center space-x-2 shadow-sm"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Chat on WhatsApp</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                          </a>

                          {/* 2. APPROVE & LOCK ROOM */}
                          {!isApproved && (
                            <button
                              onClick={() => handleApproveBookingRequest(req)}
                              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center space-x-2 shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve & Lock Room</span>
                            </button>
                          )}

                          {/* 3. DECLINE & DELETE */}
                          <div className="flex items-center space-x-1.5">
                            {!isDeclined && !isApproved && (
                              <button
                                onClick={() => handleDeclineRequest(req.id)}
                                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-stone-500 hover:text-rose-600 transition-colors"
                              >
                                Decline
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Permanently remove request"
                              aria-label="Delete request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            SECTION 2: ROOM INVENTORY (4 Floors + Top Suite)
            ======================================================================= */}
        {activeSection === 'inventory' && (
          <div className="space-y-8">
            
            {/* HERO TITLE & EXPLANATION BANNER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone-200">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl text-stone-900 tracking-wide font-medium flex items-center space-x-3">
                  <span>Hotel Room & Pricing Management</span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-[#B48A28] font-bold">
                    5 Categories
                  </span>
                </h1>
                <p className="text-xs text-stone-600 font-light mt-1 max-w-2xl">
                  Manage inventory across <strong>Floor 1</strong>, <strong>Floor 2</strong>, <strong>Floor 3</strong>, <strong>Floor 4</strong>, and the <strong>Top Penthouse Suite</strong>. 
                  Add or remove rooms, adjust nightly prices, and update status between <span className="text-emerald-700 font-mono font-semibold">Available</span>, <span className="text-rose-700 font-mono font-semibold">Booked</span>, and <span className="text-amber-700 font-mono font-semibold">In Cleaning</span>.
                </p>
              </div>

              {/* PRIMARY ACTIONS: ADD ROOM & RECORD BOOKING */}
              <div className="flex items-center space-x-2.5 shrink-0">
                <button
                  onClick={handleOpenAddRoom}
                  className="px-4 py-2.5 rounded-lg bg-[#B48A28] hover:bg-[#9E7719] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center space-x-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Room</span>
                </button>

                <button
                  onClick={() => setNewBookingModalOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center space-x-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Booking</span>
                </button>

                <button
                  onClick={handleResetDefaults}
                  className="p-2.5 rounded-lg border border-stone-300 hover:border-stone-400 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                  title="Reset to 4 Floors + Top Suite Default"
                  aria-label="Reset demo data"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KPI SUMMARY STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between text-stone-500 text-xs font-mono">
                  <span className="uppercase tracking-wider">Total Inventory</span>
                  <Bed className="w-4 h-4 text-stone-400" />
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-display font-semibold text-stone-900">
                    {stats.total}
                  </span>
                  <span className="text-xs font-mono text-stone-500">Rooms & Suites</span>
                </div>
                <div className="mt-2 text-[11px] text-stone-500 font-light">
                  Across 4 Floors + Top Suite
                </div>
              </div>

              <div 
                onClick={() => setSelectedStatusFilter('available')}
                className={`p-5 rounded-xl bg-white border transition-all cursor-pointer shadow-2xs ${
                  selectedStatusFilter === 'available' ? 'border-emerald-500 shadow-sm ring-1 ring-emerald-500/20' : 'border-stone-200 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-800 text-xs font-mono">
                  <span className="uppercase tracking-wider">Available</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-display font-semibold text-emerald-800">
                    {stats.available}
                  </span>
                  <span className="text-xs font-mono text-emerald-700">
                    ({stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-stone-600 font-light flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Ready for Guest Booking</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedStatusFilter('booked')}
                className={`p-5 rounded-xl bg-white border transition-all cursor-pointer shadow-2xs ${
                  selectedStatusFilter === 'booked' ? 'border-rose-500 shadow-sm ring-1 ring-rose-500/20' : 'border-stone-200 hover:border-rose-400'
                }`}
              >
                <div className="flex items-center justify-between text-rose-800 text-xs font-mono">
                  <span className="uppercase tracking-wider">Booked / Blocked</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-display font-semibold text-rose-800">
                    {stats.booked}
                  </span>
                  <span className="text-xs font-mono text-rose-700">
                    ({stats.occupancyRate}% Occupancy)
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-stone-600 font-light flex items-center space-x-1">
                  <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Blocked from Website</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedStatusFilter('in cleaning')}
                className={`p-5 rounded-xl bg-white border transition-all cursor-pointer shadow-2xs ${
                  selectedStatusFilter === 'in cleaning' ? 'border-amber-500 shadow-sm ring-1 ring-amber-500/20' : 'border-stone-200 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between text-amber-800 text-xs font-mono">
                  <span className="uppercase tracking-wider">In Cleaning</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-3xl font-display font-semibold text-amber-800">
                    {stats.inCleaning}
                  </span>
                  <span className="text-xs font-mono text-amber-700">Turnovers</span>
                </div>
                <div className="mt-2 text-[11px] text-stone-600 font-light flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Housekeeping Active</span>
                </div>
              </div>
            </div>

            {/* FLOOR CATEGORIES SELECTOR STRIP */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 flex items-center space-x-1.5 font-medium">
                  <Layers className="w-3.5 h-3.5 text-[#B48A28]" />
                  <span>Filter by Architectural Category:</span>
                </span>

                <button
                  onClick={() => setGroupByFloor(!groupByFloor)}
                  className="text-[10.5px] font-mono text-[#B48A28] hover:text-[#9E7719] transition-colors flex items-center space-x-1"
                >
                  <span>View Mode:</span>
                  <span className="underline font-bold">{groupByFloor ? 'Grouped by Floor' : 'Combined Grid'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedFloorFilter('all')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
                    selectedFloorFilter === 'all'
                      ? 'bg-stone-900 text-white font-bold border border-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  All Floors ({rooms.length})
                </button>

                <button
                  onClick={() => setSelectedFloorFilter('Top Suite')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shrink-0 flex items-center space-x-1.5 ${
                    selectedFloorFilter === 'Top Suite'
                      ? 'bg-[#B48A28] text-white font-bold border border-[#B48A28] shadow-xs'
                      : 'text-stone-600 hover:text-[#B48A28] hover:bg-amber-50'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Top Suite ({stats.byCategory?.['Top Suite'] || 0})</span>
                </button>

                {['Floor 4', 'Floor 3', 'Floor 2', 'Floor 1'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFloorFilter(cat)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
                      selectedFloorFilter === cat
                        ? 'bg-stone-900 text-white font-bold border border-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    {cat} ({stats.byCategory?.[cat] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* STATUS TABS & SEARCH */}
            <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedStatusFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
                    selectedStatusFilter === 'all'
                      ? 'bg-stone-900 text-white font-medium border border-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  All Statuses ({rooms.length})
                </button>

                <button
                  onClick={() => setSelectedStatusFilter('available')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center space-x-1.5 shrink-0 ${
                    selectedStatusFilter === 'available'
                      ? 'bg-emerald-50 text-emerald-800 font-medium border border-emerald-300 shadow-xs'
                      : 'text-stone-600 hover:text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Available ({stats.available})</span>
                </button>

                <button
                  onClick={() => setSelectedStatusFilter('booked')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center space-x-1.5 shrink-0 ${
                    selectedStatusFilter === 'booked'
                      ? 'bg-rose-50 text-rose-800 font-medium border border-rose-300 shadow-xs'
                      : 'text-stone-600 hover:text-rose-800 hover:bg-rose-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Booked ({stats.booked})</span>
                </button>

                <button
                  onClick={() => setSelectedStatusFilter('in cleaning')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center space-x-1.5 shrink-0 ${
                    selectedStatusFilter === 'in cleaning'
                      ? 'bg-amber-50 text-amber-800 font-medium border border-amber-300 shadow-xs'
                      : 'text-stone-600 hover:text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>In Cleaning ({stats.inCleaning})</span>
                </button>
              </div>

              <div className="relative min-w-[220px]">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search room #, suite name, guest..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#B48A28] focus:bg-white"
                />
              </div>
            </div>

            {/* ROOMS DISPLAY */}
            {isLoading ? (
              <div className="py-20 text-center text-stone-500 font-mono text-sm">
                Loading Polaris room inventory...
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="py-16 text-center rounded-xl bg-white border border-stone-200 shadow-2xs space-y-3">
                <p className="text-stone-600 text-sm">No rooms match your active search or filter.</p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => {
                      setSelectedStatusFilter('all');
                      setSelectedFloorFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-xs font-mono text-[#B48A28] underline"
                  >
                    Clear all filters
                  </button>
                  <span className="text-stone-300">•</span>
                  <button
                    onClick={handleOpenAddRoom}
                    className="text-xs font-mono text-stone-900 underline"
                  >
                    + Add a new room here
                  </button>
                </div>
              </div>
            ) : groupByFloor && selectedFloorFilter === 'all' && !searchQuery.trim() ? (
              // GROUPED BY FLOOR VIEW
              <div className="space-y-10">
                {FLOOR_CATEGORIES.map((cat) => {
                  const categoryRooms = filteredRooms.filter((r) => r.floor === cat);
                  if (categoryRooms.length === 0) return null;

                  const isTop = cat === 'Top Suite';

                  return (
                    <div key={cat} className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                        <div className="flex items-center space-x-2.5">
                          {isTop ? (
                            <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                              <Crown className="w-3.5 h-3.5 text-[#B48A28]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-mono text-[10px] text-stone-700 font-semibold">
                              {cat.replace('Floor ', 'F')}
                            </div>
                          )}
                          
                          <h2 className={`font-display text-lg tracking-wide ${
                            isTop ? 'text-[#B48A28] font-semibold' : 'text-stone-900 font-medium'
                          }`}>
                            {isTop ? 'Top Suite — Presidential Summit Penthouse' : `${cat} Suites & Rooms`}
                          </h2>

                          <span className="text-xs font-mono text-stone-500">
                            ({categoryRooms.length} {categoryRooms.length === 1 ? 'Room' : 'Rooms'})
                          </span>
                        </div>

                        <button
                          onClick={handleOpenAddRoom}
                          className="text-[11px] font-mono text-stone-500 hover:text-[#B48A28] transition-colors flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Room to {cat}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryRooms.map((room) => renderRoomCard(room))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // STANDARD FLAT GRID
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => renderRoomCard(room))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-stone-200 bg-[#F5F2EB] py-6 px-4 text-center text-xs text-stone-500 font-mono">
        <p>
          Polaris Kalam Valley • Secret Management Console • polarishotels.pk/admintopsecretmanage
        </p>
      </footer>

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      
      {/* 1. Status Transition Modal */}
      <StatusChangeModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setActiveRoomForStatus(null);
          setTargetStatus(null);
        }}
        room={activeRoomForStatus}
        targetStatus={targetStatus}
        onConfirm={handleConfirmStatus}
      />

      {/* 2. Add / Edit Room Modal */}
      <RoomFormModal
        isOpen={roomFormModalOpen}
        onClose={() => {
          setRoomFormModalOpen(false);
          setRoomToEdit(null);
        }}
        roomToEdit={roomToEdit}
        onSave={handleSaveRoom}
      />

      {/* 3. Quick Price Changer Modal */}
      <QuickPriceModal
        isOpen={quickPriceModalOpen}
        onClose={() => {
          setQuickPriceModalOpen(false);
          setActiveRoomForPrice(null);
        }}
        room={activeRoomForPrice}
        onSavePrice={handleSavePrice}
      />

      {/* 4. Delete Room Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRoomToDelete(null);
        }}
        room={roomToDelete}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* 5. New Booking / Block Modal */}
      <NewBookingModal
        isOpen={newBookingModalOpen}
        onClose={() => setNewBookingModalOpen(false)}
        rooms={rooms}
        onSaveBooking={handleConfirmStatus}
      />

      {/* 6. Room Details & Specs Modal */}
      <RoomDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setActiveRoomForDetails(null);
        }}
        room={activeRoomForDetails}
        onTriggerStatusChange={handleInitiateStatusChange}
      />

      {/* 7. Add Booking Request Modal (Manual Inquiries) */}
      <AddBookingRequestModal
        isOpen={addRequestModalOpen}
        onClose={() => setAddRequestModalOpen(false)}
        rooms={rooms}
        onSaveRequest={handleCreateBookingRequest}
      />

    </div>
  );
}
