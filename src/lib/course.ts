export function shortCourseName(fullname: string): string {
  return fullname.split('.').pop()?.trim() || fullname;
}
