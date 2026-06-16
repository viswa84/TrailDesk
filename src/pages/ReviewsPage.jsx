import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_REVIEWS, GET_TREKS } from '../graphql/queries';
import { SET_REVIEW_STATUS } from '../graphql/mutations';
import { format } from 'date-fns';
import { Star, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';

function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </span>
  );
}

function ReviewRow({ review, trekName }) {
  const toast = useToast();
  const [setStatus, { loading }] = useMutation(SET_REVIEW_STATUS, {
    refetchQueries: [{ query: GET_REVIEWS }],
  });

  const hidden = review.status === 'hidden';

  const toggle = async () => {
    try {
      await setStatus({
        variables: { id: review._id, status: hidden ? 'published' : 'hidden' },
      });
      toast.success(hidden ? 'Review published' : 'Review hidden');
    } catch (err) {
      toast.error(err.message || 'Failed to update review');
    }
  };

  return (
    <div className={`border rounded-xl px-4 py-3 ${hidden ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Stars value={review.rating} />
            <span className="font-semibold text-slate-800">{review.customerName || 'Trekker'}</span>
            {hidden && (
              <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Hidden</span>
            )}
          </div>
          {trekName && <p className="text-xs text-slate-400 mt-0.5">{trekName}</p>}
          {review.comment && <p className="text-sm text-slate-600 mt-2">{review.comment}</p>}
          <p className="text-xs text-slate-400 mt-2">
            {review.createdAt ? format(new Date(review.createdAt), 'dd MMM yyyy') : ''}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg shrink-0 transition-colors disabled:opacity-50 ${
            hidden
              ? 'bg-violet-600 text-white hover:bg-violet-700'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title={hidden ? 'Publish review' : 'Hide review'}
        >
          {hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {hidden ? 'Publish' : 'Hide'}
        </button>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [trekFilter, setTrekFilter] = useState('');

  const { data: treksData } = useQuery(GET_TREKS, { fetchPolicy: 'cache-and-network' });
  const treks = treksData?.getTreks || [];
  const trekNameById = {};
  treks.forEach((t) => { trekNameById[t._id] = t.name; });

  const { data, loading, error } = useQuery(GET_REVIEWS, {
    variables: {
      status: statusFilter || undefined,
      trekId: trekFilter || undefined,
    },
    fetchPolicy: 'cache-and-network',
  });
  const reviews = data?.getReviews || [];

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';
  const published = reviews.filter((r) => r.status === 'published').length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
        <p className="text-sm text-slate-500 mt-0.5">Customer trek reviews — publish or hide for social proof</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
          <p className="text-sm font-medium text-slate-600">Total Reviews</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-slate-900 flex items-center gap-1">
            {avg} <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </p>
          <p className="text-sm font-medium text-slate-600">Average Rating</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-slate-900">{published}</p>
          <p className="text-sm font-medium text-slate-600">Published</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
        <select
          value={trekFilter}
          onChange={(e) => setTrekFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-400 outline-none"
        >
          <option value="">All treks</option>
          {treks.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading && reviews.length === 0 && (
        <div className="flex items-center justify-center h-40 text-slate-400">Loading reviews…</div>
      )}
      {error && (
        <div className="card p-6 text-center text-red-500">Failed to load reviews. {error.message}</div>
      )}

      {!loading && reviews.length === 0 && !error ? (
        <div className="card p-10 text-center text-slate-400">
          <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No reviews yet. They arrive automatically after trekkers complete their trek.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <ReviewRow key={r._id} review={r} trekName={trekNameById[r.trekId]} />
          ))}
        </div>
      )}
    </div>
  );
}
