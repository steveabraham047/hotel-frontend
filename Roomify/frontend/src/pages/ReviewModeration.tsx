import React, { useEffect, useMemo, useState } from 'react';
import { Check, Star, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { readApiResponse } from '../utils/apiResponse';

interface Review {
  review_id: number;
  guest_name: string;
  room_number: string;
  room_type: string;
  overall_rating: number;
  cleanliness_rating: number;
  dining_rating: number;
  staff_rating: number;
  title?: string | null;
  comment?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

const statusStyle = {
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800'
};

export const ReviewModeration: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<'All' | Review['status']>('All');
  const [message, setMessage] = useState('');
  const [workingId, setWorkingId] = useState<number | null>(null);
  const token = localStorage.getItem('token');

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readApiResponse<Review[] | { error?: string }>(response);
      if (!response.ok || !Array.isArray(data)) throw new Error(('error' in data && data.error) || 'Could not load reviews.');
      setReviews(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load reviews.');
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, []);

  const visibleReviews = useMemo(
    () => reviews.filter((review) => filter === 'All' || review.status === filter),
    [filter, reviews]
  );

  const updateStatus = async (review: Review, status: Review['status']) => {
    setWorkingId(review.review_id);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${review.review_id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      const data = await readApiResponse<{ message?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || 'Could not moderate review.');
      setMessage(data.message || 'Review updated.');
      await fetchReviews();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not moderate review.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="h-[85vh] flex-1 overflow-y-auto rounded-3xl border border-white/60 bg-white/40 p-6 shadow-2xl backdrop-blur-3xl lg:p-10">
      <div className="mb-8">
        <h2 className="font-headline text-3xl font-black text-primary">Guest Review Moderation</h2>
        <p className="mt-1 max-w-2xl font-medium text-on-surface-variant">
          Approve polished guest feedback for the public homepage and keep low-quality submissions private.
        </p>
      </div>

      {message && <div className="mb-5 rounded-2xl border border-primary/10 bg-white/70 px-5 py-4 text-sm font-bold text-primary">{message}</div>}

      <div className="mb-5 flex flex-wrap gap-2">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-sm font-black ${
              filter === item ? 'bg-primary text-white' : 'bg-white/70 text-primary/60 hover:text-primary'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {visibleReviews.map((review) => (
          <article key={review.review_id} className="rounded-3xl border border-white/60 bg-white/75 p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-headline text-2xl font-black text-primary">{review.title || 'Guest stay review'}</p>
                <p className="mt-1 text-sm font-bold text-primary/50">
                  {review.guest_name} · Room {review.room_number} · {review.room_type}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyle[review.status]}`}>{review.status}</span>
            </div>
            <div className="mb-4 flex gap-1 text-[#d6b16a]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className={`h-4 w-4 ${index < review.overall_rating ? 'fill-current' : 'opacity-25'}`} />
              ))}
            </div>
            <p className="mb-5 leading-7 text-primary/70">{review.comment || 'No written comment.'}</p>
            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
              <Score label="Clean" value={review.cleanliness_rating} />
              <Score label="Dining" value={review.dining_rating} />
              <Score label="Staff" value={review.staff_rating} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateStatus(review, 'Approved')}
                disabled={workingId === review.review_id}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => updateStatus(review, 'Rejected')}
                disabled={workingId === review.review_id}
                className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2 text-sm font-black text-red-800 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </div>
          </article>
        ))}
        {visibleReviews.length === 0 && (
          <div className="rounded-3xl border border-white/60 bg-white/70 p-10 text-center font-bold text-primary/50">
            No reviews in this queue.
          </div>
        )}
      </div>
    </div>
  );
};

const Score: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-2xl bg-white p-3">
    <p className="font-black text-primary">{value}/5</p>
    <p className="text-xs font-black uppercase tracking-widest text-primary/40">{label}</p>
  </div>
);
