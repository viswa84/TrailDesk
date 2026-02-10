export default function StatusBadge({ status, variant }) {
  const styles = {
    // Payment statuses
    Paid: 'badge-green',
    Partial: 'badge-yellow',
    Unpaid: 'badge-red',
    // Booking statuses
    Confirmed: 'badge-green',
    Pending: 'badge-yellow',
    Canceled: 'badge-red',
    // Departure statuses
    Open: 'badge-green',
    'Almost Full': 'badge-yellow',
    Full: 'badge-red',
    // Invoice statuses
    Sent: 'badge-blue',
    // Refund statuses
    Processed: 'badge-green',
    // Campaign statuses
    Active: 'badge-green',
    Paused: 'badge-yellow',
    Completed: 'badge-blue',
    // Customer tags
    VIP: 'badge-purple',
    Returning: 'badge-blue',
    'High Altitude': 'badge-yellow',
    New: 'badge-slate',
  };

  return (
    <span className={styles[status] || 'badge-slate'}>
      {status}
    </span>
  );
}
