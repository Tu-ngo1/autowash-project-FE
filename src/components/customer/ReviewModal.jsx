import { useState } from "react";

export default function ReviewModal({ booking, loading, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (!booking) return null;

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      bookingId: booking.id,
      rating,
      comment: comment.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-[30px] border border-white/75 bg-white p-6 shadow-[0_28px_90px_rgba(2,40,70,0.24)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
              Đánh giá dịch vụ
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Bạn hài lòng với lượt rửa xe này chứ?
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {booking.plate || "Xe của bạn"} -{" "}
              {booking.service || booking.serviceName || "Dịch vụ rửa xe"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>

        <div className="mt-6">
          <label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
            Số sao
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition ${
                  star <= rating
                    ? "bg-amber-300 text-slate-950"
                    : "bg-slate-100 text-slate-400 hover:bg-amber-100"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
            Nhận xét
          </label>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="Nhập nhận xét của bạn..."
            className="w-full resize-none rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white transition hover:bg-slate-800 disabled:bg-slate-400"
        >
          {loading ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </form>
    </div>
  );
}
