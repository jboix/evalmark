/**
 * Attachments as stored: each one points to its file by content, `data/attachments/<sha256>.<ext>`,
 * while it is kept, and keeps its media type, caption and size after. The attachments policy
 * decides which trials keep their files.
 */
import type { Attachment, Message, ToolCall, Trial } from '../format/result.ts';
import {
  attachmentPath,
  type StoredAttachment,
  type StoredMessage,
  type StoredToolCall,
} from '../format/store.ts';
import type { AttachmentFiles } from './attachment-files.ts';
import type { AttachmentPolicy } from './inputs.ts';

/** The files a run stores: each stored path, with the file on disk it is copied from. */
export type AttachmentCopies = Map<string, string>;

/** How one trial's attachments are stored. */
export interface AttachmentContext {
  /** The files found next to the result. */
  readonly files: AttachmentFiles;
  /** Whether this trial keeps its files. */
  readonly keep: boolean;
  /** Where the files to copy are collected. */
  readonly copies: AttachmentCopies;
}

/**
 * Whether a trial keeps its attachment files.
 *
 * @param trial - The trial.
 * @param policy - The attachments policy.
 * @returns `true` when the policy keeps its files.
 */
export function keepsAttachments(trial: Pick<Trial, 'status'>, policy: AttachmentPolicy): boolean {
  if (policy === 'all') return true;
  return policy === 'failed' && trial.status !== 'pass';
}

/**
 * One attachment as stored, its file collected when it is kept.
 *
 * @param attachment - The attachment, as the result has it.
 * @param context - The files, whether to keep them, and where to collect them.
 * @returns The stored attachment.
 */
function storedAttachment(attachment: Attachment, context: AttachmentContext): StoredAttachment {
  const found = context.files.get(attachment.path);
  const caption = attachment.caption === undefined ? {} : { caption: attachment.caption };
  const base = { mediaType: attachment.mediaType, ...caption, bytes: found?.bytes ?? 0 };
  if (found === undefined) return { ...base, missing: true };
  if (!context.keep) return base;
  const file = attachmentPath(found.sha256, attachment.mediaType);
  if (!context.copies.has(file)) context.copies.set(file, found.source);
  return { ...base, file };
}

/**
 * A list of attachments as stored.
 *
 * @param attachments - The attachments.
 * @param context - The files, whether to keep them, and where to collect them.
 * @returns The stored attachments.
 */
export function storedAttachments(
  attachments: readonly Attachment[],
  context: AttachmentContext,
): StoredAttachment[] {
  return attachments.map((attachment) => storedAttachment(attachment, context));
}

/**
 * A tool call as stored.
 *
 * @param call - The tool call.
 * @param context - The files, whether to keep them, and where to collect them.
 * @returns The stored tool call.
 */
function storedToolCall(call: ToolCall, context: AttachmentContext): StoredToolCall {
  const { attachments, ...rest } = call;
  if (attachments === undefined) return rest;
  return { ...rest, attachments: storedAttachments(attachments, context) };
}

/**
 * A transcript as stored: the attachments of its messages and tool calls are stored ones.
 *
 * @param messages - The trial's messages.
 * @param context - The files, whether to keep them, and where to collect them.
 * @returns The stored messages.
 */
export function storedTranscript(
  messages: readonly Message[],
  context: AttachmentContext,
): StoredMessage[] {
  return messages.map(({ attachments, toolCalls, ...message }) => ({
    ...message,
    ...(toolCalls === undefined
      ? {}
      : { toolCalls: toolCalls.map((call) => storedToolCall(call, context)) }),
    ...(attachments === undefined ? {} : { attachments: storedAttachments(attachments, context) }),
  }));
}

/**
 * Attachments without their files, as retention leaves them.
 *
 * @param attachments - The stored attachments.
 * @returns The same attachments without `file`.
 */
export function withoutFiles(attachments: readonly StoredAttachment[]): StoredAttachment[] {
  return attachments.map(({ file: _dropped, ...attachment }) => attachment);
}

/**
 * Something that may hold attachments, without their files.
 *
 * @param holder - A stored trial, message or tool call.
 * @returns The same, its attachments without `file`.
 */
export function unattached<Holder extends { readonly attachments?: readonly StoredAttachment[] }>(
  holder: Holder,
): Holder {
  if (holder.attachments === undefined) return holder;
  return { ...holder, attachments: withoutFiles(holder.attachments) };
}

/**
 * A stored transcript whose attachments no longer point to files.
 *
 * @param messages - The stored messages.
 * @returns The messages, every attachment without `file`.
 */
export function transcriptWithoutFiles(messages: readonly StoredMessage[]): StoredMessage[] {
  return messages.map((message) => {
    const own = unattached(message);
    if (own.toolCalls === undefined) return own;
    return { ...own, toolCalls: own.toolCalls.map(unattached) };
  });
}
