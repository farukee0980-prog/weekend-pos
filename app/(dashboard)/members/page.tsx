'use client';

import React, { useEffect, useState } from 'react';
import { Header, MobileHeader, BottomNav } from '@/components/layout';
import { 
  Users, Plus, Search, Star, Phone, ShoppingBag, 
  Wallet, Edit2, Trash2, History, X 
} from 'lucide-react';
import { Member, MemberPointHistory, PointsConfig } from '@/lib/types';
import { 
  getAllMembers, 
  deleteMember, 
  getMemberPointsHistory,
  updateMember,
  adjustPoints
} from '@/lib/db/members';
import { getPointsConfig } from '@/lib/db/settings';
import { MemberFormModal } from '@/components/members';
import { Button } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<MemberPointHistory[]>([]);
  const [pointsConfig, setPointsConfig] = useState<PointsConfig>({
    points_to_redeem: 100,
    redeem_value: 40,
    default_points_per_item: 1,
  });

  // Load members
  useEffect(() => {
    loadMembers();
    loadPointsConfig();
  }, []);

  // Filter members
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        members.filter(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.phone.includes(query)
        )
      );
    }
  }, [searchQuery, members]);

  const loadMembers = async () => {
    setIsLoading(true);
    const res = await getAllMembers();
    if (res.data) {
      setMembers(res.data);
    }
    setIsLoading(false);
  };

  const loadPointsConfig = async () => {
    const res = await getPointsConfig();
    if (res.data) {
      setPointsConfig(res.data);
    }
  };

  const handleAddSuccess = (member: Member) => {
    setMembers((prev) => [...prev, member].sort((a, b) => a.name.localeCompare(b.name)));
    setIsAddModalOpen(false);
  };

  const handleViewMember = async (member: Member) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
    setIsEditMode(false);
    
    // Load points history
    const res = await getMemberPointsHistory(member.id);
    if (res.data) {
      setPointsHistory(res.data);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('ต้องการลบสมาชิกนี้หรือไม่?')) return;
    
    const res = await deleteMember(id);
    if (!res.error) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setIsDetailModalOpen(false);
      setSelectedMember(null);
    }
  };

  const handleUpdateMember = async (updates: Partial<Pick<Member, 'name' | 'phone'>>) => {
    if (!selectedMember) return;
    
    const res = await updateMember(selectedMember.id, updates);
    if (res.data) {
      setMembers((prev) =>
        prev.map((m) => (m.id === selectedMember.id ? res.data! : m))
      );
      setSelectedMember(res.data);
      setIsEditMode(false);
    }
  };

  const handleAdjustPoints = async (adjustment: number, description: string) => {
    if (!selectedMember) return;
    
    const res = await adjustPoints(selectedMember.id, adjustment, description);
    if (res.data) {
      setMembers((prev) =>
        prev.map((m) => (m.id === selectedMember.id ? res.data! : m))
      );
      setSelectedMember(res.data);
      // Reload history
      const histRes = await getMemberPointsHistory(selectedMember.id);
      if (histRes.data) {
        setPointsHistory(histRes.data);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header title="สมาชิก" subtitle="จัดการสมาชิกสะสมแต้ม" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader title="สมาชิก" />
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-6 md:ml-64">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการสมาชิก</h1>
              <p className="text-gray-500 text-sm mt-1">
                สมาชิกทั้งหมด {members.length} คน
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>เพิ่มสมาชิก</span>
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อหรือเบอร์โทร..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Points Config Summary */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <Star className="w-4 h-4 fill-amber-500" />
              <span>
                สะสมครบ <strong>{pointsConfig.points_to_redeem}</strong> แต้ม = ส่วนลด{' '}
                <strong>{formatCurrency(pointsConfig.redeem_value)}</strong>
              </span>
            </div>
          </div>

          {/* Members List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'ไม่พบสมาชิกที่ค้นหา' : 'ยังไม่มีสมาชิก'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleViewMember(member)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:border-amber-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {member.phone}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 bg-amber-100 px-2.5 py-1 rounded-lg">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="font-bold text-amber-700">{member.total_points}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {member.visit_count} ครั้ง | {formatCurrency(member.total_spent)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <BottomNav />

      {/* Add Member Modal */}
      <MemberFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Member Detail Modal */}
      {isDetailModalOpen && selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          pointsHistory={pointsHistory}
          pointsConfig={pointsConfig}
          isEditMode={isEditMode}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedMember(null);
            setIsEditMode(false);
          }}
          onEdit={() => setIsEditMode(true)}
          onDelete={() => handleDeleteMember(selectedMember.id)}
          onUpdate={handleUpdateMember}
          onAdjustPoints={handleAdjustPoints}
        />
      )}
    </div>
  );
}

// Member Detail Modal Component
interface MemberDetailModalProps {
  member: Member;
  pointsHistory: MemberPointHistory[];
  pointsConfig: PointsConfig;
  isEditMode: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Pick<Member, 'name' | 'phone'>>) => void;
  onAdjustPoints: (adjustment: number, description: string) => void;
}

function MemberDetailModal({
  member,
  pointsHistory,
  pointsConfig,
  isEditMode,
  onClose,
  onEdit,
  onDelete,
  onUpdate,
  onAdjustPoints,
}: MemberDetailModalProps) {
  const [editName, setEditName] = useState(member.name);
  const [editPhone, setEditPhone] = useState(member.phone);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);

  const handleSave = () => {
    onUpdate({ name: editName, phone: editPhone });
  };

  const handleAdjust = () => {
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) return;
    if (!adjustReason.trim()) return;
    
    onAdjustPoints(amount, adjustReason.trim());
    setAdjustAmount('');
    setAdjustReason('');
    setShowAdjust(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">ข้อมูลสมาชิก</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Member Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-amber-600" />
            </div>
            {isEditMode ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="ชื่อ"
                />
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="เบอร์โทร"
                />
              </div>
            ) : (
              <div>
                <p className="text-xl font-bold text-gray-900">{member.name}</p>
                <p className="text-gray-500 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {member.phone}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-700">{member.total_points}</p>
              <p className="text-xs text-amber-600">แต้มสะสม</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <Wallet className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{formatCurrency(member.total_spent)}</p>
              <p className="text-xs text-green-600">ยอดซื้อสะสม</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <ShoppingBag className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">{member.visit_count}</p>
              <p className="text-xs text-blue-600">จำนวนครั้ง</p>
            </div>
          </div>

          {/* Adjust Points */}
          {showAdjust ? (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">ปรับแต้ม</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">จำนวนแต้ม (บวก/ลบ)</label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-1"
                    placeholder="เช่น 10 หรือ -10"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">เหตุผล</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-1"
                    placeholder="เช่น แก้ไขแต้มผิดพลาด"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setShowAdjust(false)} className="flex-1">
                    ยกเลิก
                  </Button>
                  <Button variant="primary" onClick={handleAdjust} className="flex-1">
                    ยืนยัน
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdjust(true)}
              className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
            >
              <Star className="w-4 h-4" />
              ปรับแต้มสมาชิก
            </button>
          )}

          {/* Points History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              ประวัติแต้ม
            </h3>
            {pointsHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">ยังไม่มีประวัติ</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pointsHistory.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm text-gray-700">{h.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(h.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'font-semibold',
                        h.points > 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {h.points > 0 ? '+' : ''}{h.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100">
          {isEditMode ? (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditName(member.name);
                  setEditPhone(member.phone);
                  onEdit();
                }}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button variant="primary" onClick={handleSave} className="flex-1">
                บันทึก
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onDelete}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                ลบ
              </Button>
              <Button
                variant="secondary"
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                แก้ไข
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
