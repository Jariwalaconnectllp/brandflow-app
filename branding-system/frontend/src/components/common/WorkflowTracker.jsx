import { WORKFLOW_STEPS, getStepIndex } from '../../utils/statusHelpers';
import styles from './WorkflowTracker.module.css';

export default function WorkflowTracker({ status }) {
  const currentIdx = getStepIndex(status);
  const isRejected = status === 'rejected';

  return (
    <div className={styles.wrapper}>
      {isRejected && (
        <div className={styles.rejected}>❌ This request has been rejected</div>
      )}
      <div className={styles.track}>
        {WORKFLOW_STEPS.map((step, idx) => {
          const done = currentIdx > idx;
          const active = currentIdx === idx;
          return (
            <div key={step.key} className={styles.stepWrap}>
              <div className={`${styles.step} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
                <div className={styles.circle}>
                  {done ? '✓' : idx + 1}
                </div>
                <div className={styles.label}>
                  {step.label.split('\n').map((line, i) => <span key={i}>{line}</span>)}
                </div>
                <div className={styles.role}>{step.role}</div>
              </div>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={`${styles.connector} ${done ? styles.connectorDone : ''}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
