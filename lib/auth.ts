export function getStaffWhitelist(): string[] {
  const raw = process.env.NEXT_PUBLIC_STAFF_LINE_USER_IDS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isStaff(lineUserId: string): boolean {
  const list = getStaffWhitelist();
  return list.includes(lineUserId);
}
