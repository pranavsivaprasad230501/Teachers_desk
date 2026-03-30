import type { Json } from "@/lib/database.types";
import { serverEnv } from "@/lib/env";
import type { NotificationMessageRecord } from "@/lib/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type QueueMessageInput = {
  centreId: string;
  branchId?: string | null;
  studentId?: string | null;
  batchId?: string | null;
  category: string;
  recipientPhone: string;
  messageBody: string;
  scheduledFor?: string;
  payload?: Json;
};

export async function queueNotification(input: QueueMessageInput) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("notification_messages").insert({
    centre_id: input.centreId,
    branch_id: input.branchId ?? null,
    student_id: input.studentId ?? null,
    batch_id: input.batchId ?? null,
    category: input.category,
    recipient_phone: input.recipientPhone,
    message_body: input.messageBody,
    scheduled_for: input.scheduledFor ?? new Date().toISOString(),
    payload: input.payload ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function dispatchQueuedNotifications(limit = 25) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("notification_messages")
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  for (const message of (data ?? []) as NotificationMessageRecord[]) {
    try {
      if (serverEnv.WHATSAPP_WEBHOOK_URL && serverEnv.WHATSAPP_WEBHOOK_TOKEN) {
        const response = await fetch(serverEnv.WHATSAPP_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serverEnv.WHATSAPP_WEBHOOK_TOKEN}`,
          },
          body: JSON.stringify({
            to: message.recipient_phone,
            body: message.message_body,
            category: message.category,
            metadata: message.payload,
          }),
        });

        if (!response.ok) {
          throw new Error(`Provider responded with ${response.status}`);
        }
      }

      await supabase
        .from("notification_messages")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", message.id);
    } catch (sendError) {
      const payload =
        message.payload && typeof message.payload === "object" && !Array.isArray(message.payload)
          ? message.payload
          : {};

      await supabase
        .from("notification_messages")
        .update({
          status: "failed",
          payload: {
            ...payload,
            error: sendError instanceof Error ? sendError.message : "Failed to dispatch",
          },
        })
        .eq("id", message.id);
    }
  }
}

export function buildAbsenceMessage(studentName: string, centreName: string, date: string) {
  return `${centreName}: ${studentName} was marked absent on ${date}. Please contact the centre if this is unexpected.`;
}

export function buildFeeReminderMessage(studentName: string, amount: number, dueDate: number, centreName: string) {
  return `${centreName}: ${studentName}'s fee of Rs ${amount} is due on day ${dueDate} of this month.`;
}

export function buildBroadcastMessage(title: string, message: string, centreName: string) {
  return `${centreName} - ${title}: ${message}`;
}
