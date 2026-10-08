/**
 * Screenshots and other images a trial saved: thumbnails that open full size in a dialog. An image
 * retention pruned, or one the harness named but did not save, shows its caption and why it is gone.
 */
import { useRef } from 'preact/hooks';
import type { StoredAttachment } from '../../format/store.ts';

/** An attachment as the dashboard reads it: `missing` marks a file the harness did not save. */
type Shown = StoredAttachment & { readonly missing?: true };

/**
 * The attachments, as a row of thumbnails.
 *
 * @param props - The attachments, and what they belong to, for their names.
 * @returns The row, or nothing when there are none.
 */
export function Shots(props: { readonly attachments: readonly Shown[]; readonly owner: string }) {
  if (props.attachments.length === 0) return null;
  // An attachment's place never changes, so its name, made from it, serves as its key.
  const named = props.attachments.map((attachment, position) => ({
    attachment,
    name: `${props.owner}, image ${position + 1}`,
  }));
  return (
    <ul class="shots" aria-label={`Images from ${props.owner}`}>
      {named.map((entry) => (
        <li key={entry.name} class="shot">
          <Shot attachment={entry.attachment} name={entry.name} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Why an attachment has no file.
 *
 * @param attachment - The attachment.
 * @returns The reason, in a few words.
 */
function goneText(attachment: Shown): string {
  return attachment.missing === true ? 'screenshot missing' : 'screenshot not kept';
}

/**
 * One thumbnail, and the dialog that shows it full size.
 *
 * @param props - The attachment and its name.
 * @returns The thumbnail.
 */
function Shot(props: { readonly attachment: Shown; readonly name: string }) {
  const { attachment } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const caption = attachment.caption ?? props.name;
  if (attachment.file === undefined || attachment.missing === true) {
    return (
      <>
        <span class="shot-missing">{goneText(attachment)}</span>
        {attachment.caption === undefined ? null : <span class="shot-caption">{caption}</span>}
      </>
    );
  }
  return (
    <>
      <button
        ref={trigger}
        type="button"
        class="shot-button"
        aria-label={`Open ${caption} full size`}
        onClick={() => dialog.current?.showModal()}
      >
        <img src={attachment.file} alt="" loading="lazy" />
      </button>
      {attachment.caption === undefined ? null : <span class="shot-caption">{caption}</span>}
      <dialog
        ref={dialog}
        class="shot-dialog"
        aria-label={caption}
        onClose={() => trigger.current?.focus()}
      >
        <div class="shot-dialog-head">
          <span>{caption}</span>
          <button type="button" class="button" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
        <img src={attachment.file} alt={caption} />
      </dialog>
    </>
  );
}
