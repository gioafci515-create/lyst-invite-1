'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { endSession, isAdmin } from '../../lib/auth';
import { addItem, deleteItem, getItem, removeUpload, saveSettings, updateItem } from '../../lib/store';

// Every admin mutation re-checks the session: server actions are public POST endpoints.
async function guard() {
  if (!(await isAdmin())) redirect('/admin/login');
}

const text = (fd, key, max) => String(fd.get(key) ?? '').trim().slice(0, max);

export async function logout() {
  await endSession();
  redirect('/admin/login');
}

export async function removeResponse(fd) {
  await guard();
  await deleteItem('responses', text(fd, 'id', 64));
  revalidatePath('/admin');
}

export async function removeMoment(fd) {
  await guard();
  const id = text(fd, 'id', 64);
  const moment = await getItem('moments', id);
  if (moment) await removeUpload(moment.file);
  await deleteItem('moments', id);
  revalidatePath('/admin/content');
}

export async function toggleMomentHidden(fd) {
  await guard();
  const id = text(fd, 'id', 64);
  const moment = await getItem('moments', id);
  if (moment) await updateItem('moments', id, { hidden: !moment.hidden });
  revalidatePath('/admin/content');
}

export async function removeLetter(fd) {
  await guard();
  await deleteItem('letters', text(fd, 'id', 64));
  revalidatePath('/admin/content');
}

export async function answerQuestion(fd) {
  await guard();
  await updateItem('questions', text(fd, 'id', 64), { answer: text(fd, 'answer', 2000) });
  revalidatePath('/admin/content');
}

export async function removeQuestion(fd) {
  await guard();
  await deleteItem('questions', text(fd, 'id', 64));
  revalidatePath('/admin/content');
}

export async function postNotification(fd) {
  await guard();
  const title = text(fd, 'title', 120);
  const body = text(fd, 'body', 500);
  if (!title) return;
  const type = ['announcement', 'location', 'schedule', 'rsvp', 'activity'].includes(fd.get('type')) ? fd.get('type') : 'announcement';
  await addItem('notifications', { type, title, body, priority: fd.get('priority') === 'on' });
  revalidatePath('/admin/updates');
}

export async function removeNotification(fd) {
  await guard();
  await deleteItem('notifications', text(fd, 'id', 64));
  revalidatePath('/admin/updates');
}

export async function updateSettings(fd) {
  await guard();
  const options = text(fd, 'pollOptions', 600).split('\n').map((o) => o.trim()).filter(Boolean).slice(0, 6);
  const unlock = text(fd, 'capsuleUnlockAt', 32);
  await saveSettings({
    announcement: text(fd, 'announcement', 300),
    pollQuestion: text(fd, 'pollQuestion', 200),
    ...(options.length >= 2 ? { pollOptions: options } : {}),
    rsvpClosesAt: text(fd, 'rsvpClosesAt', 80),
    capsuleName: text(fd, 'capsuleName', 120),
    ...(unlock && !Number.isNaN(new Date(unlock).getTime()) ? { capsuleUnlockAt: unlock } : {}),
    submissionsOpen: fd.get('submissionsOpen') === 'on',
    pollResultsVisible: fd.get('pollResultsVisible') === 'on',
    capsuleForceUnlocked: fd.get('capsuleForceUnlocked') === 'on',
  });
  revalidatePath('/admin/updates');
}
