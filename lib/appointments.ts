const STORAGE_KEY = "appointments";

export type AppointmentStatus = "pending" | "confirmed";

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  name: string;
  surname: string;
  phone: string;
  email: string;
  notes: string;
  status: AppointmentStatus;
  createdAt: string;
}

function getAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setAppointments(data: Appointment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createAppointment(
  data: Omit<Appointment, "id" | "status" | "createdAt">
): Appointment {
  const appointments = getAppointments();
  const newOne: Appointment = {
    ...data,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  appointments.push(newOne);
  setAppointments(appointments);
  return newOne;
}

export function getPendingAppointments(): Appointment[] {
  return getAppointments().filter((a) => a.status === "pending");
}

export function getConfirmedAppointments(): Appointment[] {
  return getAppointments().filter((a) => a.status === "confirmed");
}

export function isSlotTaken(date: string, time: string): boolean {
  return getAppointments().some(
    (a) => a.status === "confirmed" && a.date === date && a.time === time
  );
}

export function confirmAppointment(id: string): boolean {
  const appointments = getAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  appointments[idx].status = "confirmed";
  setAppointments(appointments);
  return true;
}
