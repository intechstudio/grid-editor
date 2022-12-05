import activeWindow from 'active-win';

export async function getActiveWindow() {
  return await activeWindow();
}