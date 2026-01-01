'use client';

import React, { useEffect } from 'react';
import { Star, Gift, AlertCircle } from 'lucide-react';
import { Member, PointsConfig } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface PointsRedeemSectionProps {
  member: Member | null;
  pointsConfig: PointsConfig;
  redeemCount: number; // จำนวนครั้งที่จะแลก
  onRedeemCountChange: (count: number) => void;
  cartTotal: number; // ยอดรวมสินค้า (เพื่อจำกัดส่วนลดไม่ให้เกินราคาสินค้า)
}

export function PointsRedeemSection({
  member,
  pointsConfig,
  redeemCount,
  onRedeemCountChange,
  cartTotal,
}: PointsRedeemSectionProps) {
  if (!member) return null;

  const { points_to_redeem, redeem_value } = pointsConfig;
  
  // คำนวณจำนวนครั้งที่สามารถแลกได้ตามแต้มที่มี
  const maxByPoints = Math.floor(member.total_points / points_to_redeem);
  
  // คำนวณจำนวนครั้งที่แลกได้ตามราคาสินค้า (ส่วนลดต้องไม่เกินราคาสินค้า)
  const maxByCartTotal = Math.floor(cartTotal / redeem_value);
  
  // ใช้ค่าที่น้อยกว่า - จำกัดทั้งตามแต้มและราคาสินค้า
  const maxRedeemCount = Math.min(maxByPoints, maxByCartTotal);
  const canRedeem = maxRedeemCount > 0 && cartTotal > 0;
  
  // ถ้า redeemCount เกิน maxRedeemCount ให้รีเซ็ตอัตโนมัติ
  useEffect(() => {
    if (redeemCount > maxRedeemCount) {
      onRedeemCountChange(maxRedeemCount);
    }
  }, [maxRedeemCount, redeemCount, onRedeemCountChange]);
  
  // แต้มที่จะใช้และส่วนลดที่จะได้
  const pointsToUse = redeemCount * points_to_redeem;
  const discountAmount = redeemCount * redeem_value;
  const remainingPoints = member.total_points - pointsToUse;

  const handleIncrease = () => {
    if (redeemCount < maxRedeemCount) {
      onRedeemCountChange(redeemCount + 1);
    }
  };

  const handleDecrease = () => {
    if (redeemCount > 0) {
      onRedeemCountChange(redeemCount - 1);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-gray-900">แลกแต้มสะสม</span>
        </div>
        <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span className="font-bold text-amber-700">{member.total_points}</span>
          <span className="text-xs text-amber-600">แต้ม</span>
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-600 mb-3">
        ครบ {points_to_redeem} แต้ม = ส่วนลด {formatCurrency(redeem_value)}
      </div>

      {canRedeem ? (
        <>
          {/* Redeem Controls */}
          <div className="flex items-center justify-between bg-white rounded-lg p-3">
            <span className="text-sm text-gray-700">จำนวนที่แลก:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDecrease}
                disabled={redeemCount === 0}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors',
                  redeemCount === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                )}
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-lg">{redeemCount}</span>
              <button
                onClick={handleIncrease}
                disabled={redeemCount >= maxRedeemCount}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors',
                  redeemCount >= maxRedeemCount
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                )}
              >
                +
              </button>
            </div>
          </div>

          {/* Summary */}
          {redeemCount > 0 && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>แต้มที่ใช้:</span>
                <span className="font-medium text-red-600">-{pointsToUse} แต้ม</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>แต้มคงเหลือ:</span>
                <span className="font-medium">{remainingPoints} แต้ม</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-amber-200">
                <span className="font-semibold text-gray-900">ส่วนลดที่ได้:</span>
                <span className="font-bold text-green-600">-{formatCurrency(discountAmount)}</span>
              </div>
            </div>
          )}

          {/* Max redeem info */}
          <p className="mt-2 text-xs text-gray-500">
            {maxByPoints > maxByCartTotal ? (
              <>สามารถแลกได้สูงสุด {maxRedeemCount} ครั้ง (ส่วนลดสูงสุด {formatCurrency(maxRedeemCount * redeem_value)} เพราะราคาสินค้า {formatCurrency(cartTotal)})</>
            ) : (
              <>สามารถแลกได้สูงสุด {maxRedeemCount} ครั้ง (ส่วนลดสูงสุด {formatCurrency(maxRedeemCount * redeem_value)})</>
            )}
          </p>
        </>
      ) : (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-100 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            {cartTotal < redeem_value ? (
              <>ราคาสินค้า ({formatCurrency(cartTotal)}) ต่ำกว่าส่วนลด ({formatCurrency(redeem_value)}) ไม่สามารถแลกแต้มได้</>
            ) : member.total_points < points_to_redeem ? (
              <>ต้องมีแต้มอย่างน้อย {points_to_redeem} แต้มถึงจะแลกได้ (มี {member.total_points} แต้ม)</>
            ) : (
              <>ไม่สามารถแลกแต้มได้</>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
