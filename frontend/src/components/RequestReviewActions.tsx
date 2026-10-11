import { Textarea } from './ui/textarea';
import { useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ErrorMessage, FormField } from './ui';

export type ReviewAction = 'approve' | 'reject';

export function RequestReviewActions({
  onConfirm,
}: {
  onConfirm: (action: ReviewAction, comment?: string) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const formId = useId();
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  function choose(next: ReviewAction | null) {
    setAction(next);
    setComment('');
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!action || submitting.current) return;
    const trimmed = comment.trim();
    if (action === 'reject' && !trimmed) {
      setError(t('A rejection reason is required.'));
      return;
    }
    if (trimmed.length > 1000) {
      setError(t('Comments must be at most 1,000 characters.'));
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await onConfirm(action, trimmed || undefined);
      choose(null);
    } catch (failure) {
      setError(failure);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section
      className="mt-4 border-t border-line pt-4"
      aria-label={t('Request review')}
    >
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => choose('approve')}
          disabled={pending}
          aria-expanded={action === 'approve'}
          aria-controls={action === 'approve' ? formId : undefined}
        >
          {t('Approve')}
        </Button>
        <Button
          variant="danger"
          onClick={() => choose('reject')}
          disabled={pending}
          aria-expanded={action === 'reject'}
          aria-controls={action === 'reject' ? formId : undefined}
        >
          {t('Reject')}
        </Button>
      </div>
      {action && (
        <form
          id={formId}
          className="mt-3 space-y-3 rounded-lg border border-line bg-surface p-4"
          onSubmit={(event) => void submit(event)}
          aria-label={t(
            action === 'approve' ? 'Confirm approval' : 'Confirm rejection',
          )}
          aria-busy={pending}
        >
          <FormField
            label={
              action === 'approve'
                ? 'Approval comment (optional)'
                : 'Rejection reason'
            }
          >
            <Textarea
              key={action}
              autoFocus
              rows={3}
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                setError(null);
              }}
              maxLength={1000}
              required={action === 'reject'}
              disabled={pending}
              aria-invalid={Boolean(error)}
              aria-describedby={`${formId}-help`}
              placeholder={t(
                action === 'approve'
                  ? 'Add context for the requester…'
                  : 'Explain why this request cannot be approved…',
              )}
            />
          </FormField>
          <p id={`${formId}-help`} className="text-sm text-muted">
            {t('Your decision and comment will appear in the request history.')}
          </p>
          {error != null && <ErrorMessage error={error} />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => choose(null)}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              variant={action === 'reject' ? 'danger' : 'primary'}
              loading={pending}
            >
              {t(
                action === 'approve' ? 'Confirm approval' : 'Confirm rejection',
              )}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
