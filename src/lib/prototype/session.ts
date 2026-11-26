import Cookies from 'js-cookie';

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/lib/constants/auth.constants';

const PROTOTYPE_EMAIL_KEY = 'pp_prototype_email';
const PROTOTYPE_TOKEN = 'prototype';

/** Local preview only. Production stays on the real sign-in flow. */
export const PROTOTYPE_MODE = process.env.NEXT_PUBLIC_PROTOTYPE === 'true';

const cookieOptions = {
  expires: 7,
  sameSite: 'lax' as const,
  secure: false,
  path: '/',
};

export function signInPrototype(email: string): void {
  const value = email.trim();
  Cookies.set(ACCESS_TOKEN_KEY, PROTOTYPE_TOKEN, cookieOptions);
  Cookies.set(REFRESH_TOKEN_KEY, PROTOTYPE_TOKEN, cookieOptions);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PROTOTYPE_EMAIL_KEY, value);
  }
}

export function clearPrototypeSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(PROTOTYPE_EMAIL_KEY);
}

export function getPrototypeEmail(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(PROTOTYPE_EMAIL_KEY) ?? '';
}

const PROTOTYPE_DISPLAY_NAMES: Record<string, string> = {
  salil: 'Salil',
  mesimarpreet: 'Simarpreet',
  nikhil: 'Nikhil',
  priya: 'Priya',
};

export type PrototypePersona = 'super' | 'owner' | 'ops' | 'kam';

export const PROTOTYPE_PERSONAS: Array<{
  id: PrototypePersona;
  email: string;
  name: string;
  title: string;
}> = [
  { id: 'super', email: 'salil@gmail.com', name: 'Salil', title: 'Super profile' },
  { id: 'owner', email: 'nikhil@gmail.com', name: 'Nikhil', title: 'Dealership owner' },
  { id: 'ops', email: 'mesimarpreet@gmail.com', name: 'Simarpreet', title: 'Dealership ops' },
  { id: 'kam', email: 'priya@gmail.com', name: 'Priya', title: 'KAM' },
];

function prototypeLocalPart(email: string): string {
  return email.split('@')[0]?.trim().toLowerCase() ?? '';
}

export function getPrototypePersona(email: string): PrototypePersona {
  const localPart = prototypeLocalPart(email);
  if (localPart === 'salil') {
    return 'super';
  }
  if (localPart === 'nikhil') {
    return 'owner';
  }
  if (localPart === 'priya') {
    return 'kam';
  }
  return 'ops';
}

export function isPrototypeOwner(email: string): boolean {
  return getPrototypePersona(email) === 'owner';
}

export function getPrototypeFirstName(email: string): string {
  const localPart = prototypeLocalPart(email);
  if (!localPart) {
    return 'User';
  }

  const knownName = PROTOTYPE_DISPLAY_NAMES[localPart];
  if (knownName) {
    return knownName;
  }

  const readableName = localPart.replace(/[._+-]+/g, ' ');
  return readableName.charAt(0).toUpperCase() + readableName.slice(1);
}
