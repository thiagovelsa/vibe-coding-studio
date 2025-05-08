import React, { useState } from 'react';
import { AnimatedButton } from './AnimatedButton';
import { FiThumbsUp, FiThumbsDown, FiX } from 'react-icons/fi';

interface FeedbackPopoverProps {
  messageId: string;
  onSubmitFeedback: (messageId: string, rating: number, correction?: string) => Promise<void>;
  onClose: () => void;
}

export const FeedbackPopover: React.FC<FeedbackPopoverProps> = ({
  messageId,
  onSubmitFeedback,
  onClose
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [correction, setCorrection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === null) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitFeedback(messageId, rating, correction || undefined);
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 w-64">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Message Feedback</h3>
        <AnimatedButton
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <FiX size={16} />
        </AnimatedButton>
      </div>
      
      <div className="flex justify-center space-x-4 mb-4">
        <AnimatedButton
          onClick={() => setRating(1)}
          className={`p-2 rounded-full ${
            rating === 1 
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Helpful"
        >
          <FiThumbsUp size={20} />
        </AnimatedButton>
        
        <AnimatedButton
          onClick={() => setRating(-1)}
          className={`p-2 rounded-full ${
            rating === -1 
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Not Helpful"
        >
          <FiThumbsDown size={20} />
        </AnimatedButton>
      </div>
      
      {rating === -1 && (
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1">
            What would be better? (optional)
          </label>
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            rows={3}
            placeholder="Please provide specific feedback..."
          />
        </div>
      )}
      
      <div className="flex justify-end">
        <AnimatedButton
          onClick={handleSubmit}
          disabled={rating === null || isSubmitting}
          className={`px-3 py-1 text-sm rounded ${
            rating === null
              ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </AnimatedButton>
      </div>
    </div>
  );
}; 