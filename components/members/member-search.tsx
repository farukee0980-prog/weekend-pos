'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Phone, Star, Plus, X, UserCheck } from 'lucide-react';
import { Member } from '@/lib/types';
import { searchMembers, getMemberByPhone } from '@/lib/db/members';
import { formatCurrency, cn } from '@/lib/utils';

interface MemberSearchProps {
  selectedMember: Member | null;
  onSelectMember: (member: Member | null) => void;
  onAddNew: (phone?: string) => void;
}

export function MemberSearch({
  selectedMember,
  onSelectMember,
  onAddNew,
}: MemberSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search members
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        const res = await searchMembers(query);
        setResults(res.data || []);
        setIsLoading(false);
        setShowDropdown(true);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (member: Member) => {
    onSelectMember(member);
    setQuery('');
    setShowDropdown(false);
  };

  const handleClear = () => {
    onSelectMember(null);
    setQuery('');
  };

  const handleAddNew = () => {
    const cleanPhone = query.replace(/\D/g, '');
    onAddNew(cleanPhone.length >= 9 ? cleanPhone : undefined);
    setShowDropdown(false);
  };

  // Show selected member
  if (selectedMember) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{selectedMember.name}</p>
              <p className="text-sm text-gray-500">{selectedMember.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-amber-100 px-3 py-1.5 rounded-lg">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="font-bold text-amber-700">{selectedMember.total_points}</span>
              <span className="text-xs text-amber-600">แต้ม</span>
            </div>
            <button
              onClick={handleClear}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
              title="ยกเลิกเลือกสมาชิก"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="ค้นหาสมาชิก (ชื่อหรือเบอร์โทร)"
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-72 overflow-y-auto"
        >
          {results.length > 0 ? (
            <>
              {results.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.phone}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">{member.total_points}</span>
                  </div>
                </button>
              ))}
            </>
          ) : query.length >= 2 && !isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              ไม่พบสมาชิก
            </div>
          ) : null}

          {/* Add new member button */}
          <button
            onClick={handleAddNew}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors border-t border-gray-200 text-amber-600"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-medium">เพิ่มสมาชิกใหม่</span>
          </button>
        </div>
      )}
    </div>
  );
}
