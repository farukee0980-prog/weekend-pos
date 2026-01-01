 import { supabase } from '@/lib/supabase';
import type { Member, MemberPointHistory, ApiResponse, PointTransactionType } from '@/lib/types';

const MEMBERS_TABLE = 'members';
const POINTS_HISTORY_TABLE = 'member_points_history';

// ===================================
// Members CRUD
// ===================================

export async function getAllMembers(): Promise<ApiResponse<Member[]>> {
  try {
    const { data, error } = await supabase
      .from(MEMBERS_TABLE)
      .select('*')
      .order('name');

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching members:', err);
    return { data: null, error: err.message };
  }
}

export async function getMemberById(id: string): Promise<ApiResponse<Member>> {
  try {
    const { data, error } = await supabase
      .from(MEMBERS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching member:', err);
    return { data: null, error: err.message };
  }
}

export async function getMemberByPhone(phone: string): Promise<ApiResponse<Member>> {
  try {
    // ลบเครื่องหมายพิเศษและช่องว่างออก
    const cleanPhone = phone.replace(/\D/g, '');
    
    const { data, error } = await supabase
      .from(MEMBERS_TABLE)
      .select('*')
      .eq('phone', cleanPhone)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    return { data: data || null, error: null };
  } catch (err: any) {
    console.error('Error fetching member by phone:', err);
    return { data: null, error: err.message };
  }
}

export async function searchMembers(query: string): Promise<ApiResponse<Member[]>> {
  try {
    const cleanQuery = query.trim();
    
    const { data, error } = await supabase
      .from(MEMBERS_TABLE)
      .select('*')
      .or(`name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`)
      .order('name')
      .limit(20);

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error searching members:', err);
    return { data: null, error: err.message };
  }
}

export async function createMember(
  member: Pick<Member, 'name' | 'phone'>
): Promise<ApiResponse<Member>> {
  try {
    // ลบเครื่องหมายพิเศษออกจากเบอร์โทร
    const cleanPhone = member.phone.replace(/\D/g, '');
    
    // ตรวจสอบว่ามีเบอร์นี้แล้วหรือไม่
    const existing = await getMemberByPhone(cleanPhone);
    if (existing.data) {
      return { data: null, error: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' };
    }

    const { data, error } = await supabase
      .from(MEMBERS_TABLE)
      .insert([{
        name: member.name.trim(),
        phone: cleanPhone,
        total_points: 0,
        total_spent: 0,
        visit_count: 0,
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error creating member:', err);
    return { data: null, error: err.message };
  }
}

export async function updateMember(
  id: string,
  updates: Partial<Pick<Member, 'name' | 'phone'>>
): Promise<ApiResponse<Member>> {
  try {
    const updateData: any = { ...updates };
    
    // ถ้ามีการอัพเดทเบอร์โทร ให้ clean ก่อน
    if (updateData.phone) {
      updateData.phone = updateData.phone.replace(/\D/g, '');
    }

    const { data, error } = await supabase
      .from(MEMBERS_TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error updating member:', err);
    return { data: null, error: err.message };
  }
}

export async function deleteMember(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from(MEMBERS_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { data: null, error: null };
  } catch (err: any) {
    console.error('Error deleting member:', err);
    return { data: null, error: err.message };
  }
}

// ===================================
// Points Management
// ===================================

export async function addPoints(
  memberId: string,
  points: number,
  orderId?: string,
  description?: string
): Promise<ApiResponse<Member>> {
  try {
    // 1. อัพเดทแต้มของสมาชิก
    const { data: member, error: fetchError } = await supabase
      .from(MEMBERS_TABLE)
      .select('total_points')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    const newTotalPoints = (member.total_points || 0) + points;

    const { data: updatedMember, error: updateError } = await supabase
      .from(MEMBERS_TABLE)
      .update({ total_points: newTotalPoints })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. บันทึกประวัติแต้ม
    await supabase
      .from(POINTS_HISTORY_TABLE)
      .insert([{
        member_id: memberId,
        order_id: orderId,
        type: 'earn' as PointTransactionType,
        points: points,
        description: description || 'ได้รับแต้มจากการซื้อสินค้า',
      }]);

    return { data: updatedMember, error: null };
  } catch (err: any) {
    console.error('Error adding points:', err);
    return { data: null, error: err.message };
  }
}

export async function redeemPoints(
  memberId: string,
  points: number,
  orderId?: string,
  description?: string
): Promise<ApiResponse<Member>> {
  try {
    // 1. ตรวจสอบว่ามีแต้มเพียงพอ
    const { data: member, error: fetchError } = await supabase
      .from(MEMBERS_TABLE)
      .select('total_points')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    if ((member.total_points || 0) < points) {
      return { data: null, error: 'แต้มไม่เพียงพอ' };
    }

    // 2. หักแต้ม
    const newTotalPoints = member.total_points - points;

    const { data: updatedMember, error: updateError } = await supabase
      .from(MEMBERS_TABLE)
      .update({ total_points: newTotalPoints })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. บันทึกประวัติ
    await supabase
      .from(POINTS_HISTORY_TABLE)
      .insert([{
        member_id: memberId,
        order_id: orderId,
        type: 'redeem' as PointTransactionType,
        points: -points, // ลบ เพราะเป็นการใช้แต้ม
        description: description || 'แลกแต้มเป็นส่วนลด',
      }]);

    return { data: updatedMember, error: null };
  } catch (err: any) {
    console.error('Error redeeming points:', err);
    return { data: null, error: err.message };
  }
}

export async function adjustPoints(
  memberId: string,
  points: number,
  description: string
): Promise<ApiResponse<Member>> {
  try {
    const { data: member, error: fetchError } = await supabase
      .from(MEMBERS_TABLE)
      .select('total_points')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    const newTotalPoints = Math.max(0, (member.total_points || 0) + points);

    const { data: updatedMember, error: updateError } = await supabase
      .from(MEMBERS_TABLE)
      .update({ total_points: newTotalPoints })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) throw updateError;

    // บันทึกประวัติ
    await supabase
      .from(POINTS_HISTORY_TABLE)
      .insert([{
        member_id: memberId,
        type: 'adjust' as PointTransactionType,
        points: points,
        description: description,
      }]);

    return { data: updatedMember, error: null };
  } catch (err: any) {
    console.error('Error adjusting points:', err);
    return { data: null, error: err.message };
  }
}

// อัพเดทข้อมูลสมาชิกหลังสั่งซื้อ
export async function updateMemberAfterOrder(
  memberId: string,
  orderTotal: number,
  pointsEarned: number,
  pointsRedeemed: number,
  orderId: string
): Promise<ApiResponse<Member>> {
  try {
    // ดึงข้อมูลสมาชิกปัจจุบัน
    const { data: member, error: fetchError } = await supabase
      .from(MEMBERS_TABLE)
      .select('*')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    // คำนวณค่าใหม่
    const newTotalPoints = (member.total_points || 0) + pointsEarned - pointsRedeemed;
    const newTotalSpent = (member.total_spent || 0) + orderTotal;
    const newVisitCount = (member.visit_count || 0) + 1;

    // อัพเดทสมาชิก
    const { data: updatedMember, error: updateError } = await supabase
      .from(MEMBERS_TABLE)
      .update({
        total_points: newTotalPoints,
        total_spent: newTotalSpent,
        visit_count: newVisitCount,
      })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) throw updateError;

    // บันทึกประวัติแต้มที่ได้รับ
    if (pointsEarned > 0) {
      await supabase
        .from(POINTS_HISTORY_TABLE)
        .insert([{
          member_id: memberId,
          order_id: orderId,
          type: 'earn' as PointTransactionType,
          points: pointsEarned,
          description: `ได้รับแต้มจากออเดอร์`,
        }]);
    }

    // บันทึกประวัติแต้มที่ใช้
    if (pointsRedeemed > 0) {
      await supabase
        .from(POINTS_HISTORY_TABLE)
        .insert([{
          member_id: memberId,
          order_id: orderId,
          type: 'redeem' as PointTransactionType,
          points: -pointsRedeemed,
          description: `แลกแต้มเป็นส่วนลด`,
        }]);
    }

    return { data: updatedMember, error: null };
  } catch (err: any) {
    console.error('Error updating member after order:', err);
    return { data: null, error: err.message };
  }
}

// ===================================
// Points History
// ===================================

export async function getMemberPointsHistory(
  memberId: string,
  limit = 50
): Promise<ApiResponse<MemberPointHistory[]>> {
  try {
    const { data, error } = await supabase
      .from(POINTS_HISTORY_TABLE)
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching points history:', err);
    return { data: null, error: err.message };
  }
}

// ===================================
// Helper Functions
// ===================================

// คำนวณแต้มที่จะได้รับจากรายการสินค้า
export function calculatePointsFromItems(
  items: Array<{ points_per_item?: number; quantity: number }>
): number {
  return items.reduce((total, item) => {
    return total + (item.points_per_item || 0) * item.quantity;
  }, 0);
}

// ตรวจสอบว่าสามารถแลกแต้มได้หรือไม่
export function canRedeemPoints(
  memberPoints: number,
  pointsToRedeem: number
): boolean {
  return memberPoints >= pointsToRedeem;
}

// คำนวณจำนวนครั้งที่สามารถแลกได้
export function calculateRedeemableCount(
  memberPoints: number,
  pointsPerRedeem: number
): number {
  if (pointsPerRedeem <= 0) return 0;
  return Math.floor(memberPoints / pointsPerRedeem);
}
