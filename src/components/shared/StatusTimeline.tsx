interface TimelineProps {
  status: string;
  updates: {
    status: string;
    date: string;
    message: string;
  }[];
}

export default function StatusTimeline({ status, updates }: TimelineProps) {
  return (
    <div className="space-y-4">
      <div className={`status-badge status-${status.toLowerCase()}`}>
        {status}
      </div>
      
      <div className="border-l-2 border-gray-200 ml-3 space-y-6">
        {updates.map((update, index) => (
          <div key={index} className="relative pl-6 pb-6">
            <div className="absolute -left-2 mt-2 w-4 h-4 rounded-full bg-white border-2 border-blue-600" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">{update.status}</p>
              <p className="text-gray-500">{update.message}</p>
              <p className="text-xs text-gray-400 mt-1">{update.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
