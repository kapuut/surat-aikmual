interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export default function Notification({ type, message, onClose }: NotificationProps) {
  return (
    <div className={`alert alert-${type} animate-fadeIn`}>
      <div className="flex justify-between items-center">
        <p>{message}</p>
        {onClose && (
          <button onClick={onClose} className="text-sm hover:text-gray-700">
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
