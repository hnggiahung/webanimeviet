import { useState } from "react";
import { MessageCircle, Send, Heart, Reply, Flag, ThumbsUp } from "lucide-react";

const MOCK_COMMENTS = [
  {
    id: 1,
    user: "Thành Bế Văn",
    avatar: "T",
    time: "1 phút trước",
    text: "phim này có ra ss2 kh mn ơi",
    likes: 12,
    replies: [
      { id: 101, user: "Hoàng Nhẫn [HAE]", avatar: "H", time: "5 phút trước", text: "Có bạn ơi, đang chiếu mùa 4 rồi!", likes: 5 }
    ]
  },
  {
    id: 2,
    user: "Hoàng Nhẫn [HAE]",
    avatar: "H",
    time: "14 phút trước",
    text: "cái bà là nó húp sạch năng lượng không lỗ như thế mà ko bị quá tải ms bá",
    likes: 24,
    replies: []
  },
  {
    id: 3,
    user: "Hyun_?!?!",
    avatar: "H",
    time: "1 giờ trước",
    text: "mn cho mình xin vài bộ romcom buồn vs ạ :]]",
    likes: 8,
    replies: [
      { id: 102, user: "Kubo Nagisa", avatar: "K", time: "2 giờ trước", text: "Your Lie in April, Anohana, Clannad...", likes: 15 }
    ]
  },
  {
    id: 4,
    user: "Kubo Nagisa",
    avatar: "K",
    time: "2 giờ trước",
    text: "mong admin khôi phục tính năng chụp ảnh trực tiếp",
    likes: 32,
    replies: []
  },
  {
    id: 5,
    user: "thanhpham2079",
    avatar: "T",
    time: "5 giờ trước",
    text: "SPOILER — click để xem",
    likes: 3,
    replies: []
  },
];

export default function CommentsSection({ comments: propComments }) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(propComments || MOCK_COMMENTS);
  const [sortBy, setSortBy] = useState("newest"); // "newest" or "oldest"

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "newest") return b.id - a.id;
    return a.id - b.id;
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const newCommentObj = {
      id: Date.now(),
      user: "Bạn",
      avatar: "B",
      time: "Vừa xong",
      text: newComment.trim(),
      likes: 0,
      replies: [],
    };
    setComments([newCommentObj, ...comments]);
    setNewComment("");
  }

  function handleLike(commentId) {
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    ));
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-violet-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Bình Luận</h3>
          <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gray-800/60 rounded-lg p-0.5">
          <button
            onClick={() => setSortBy("newest")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${
              sortBy === "newest"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Mới nhất
          </button>
          <button
            onClick={() => setSortBy("oldest")}
            className={`px-2 py-1 text-[10px] rounded-md transition-all font-medium ${
              sortBy === "oldest"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Cũ nhất
          </button>
        </div>
      </div>

      {/* Comment input */}
      <div className="p-4 border-b border-gray-800/40">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            B
          </div>
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              rows={2}
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-3 py-2 text-gray-300 text-xs placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-gray-800 transition-all resize-none"
            />
            <button
              type="submit"
              className="absolute bottom-2 right-2 p-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newComment.trim()}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </form>
      </div>

      {/* Comments list */}
      <div className="divide-y divide-gray-800/40">
        {sortedComments.map((comment) => (
          <div key={comment.id} className="p-4 hover:bg-gray-800/20 transition-colors">
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-lg shadow-violet-500/20">
                {comment.avatar}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-200 text-xs font-semibold">{comment.user}</span>
                  <span className="text-gray-600 text-[10px]">{comment.time}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed mb-2">{comment.text}</p>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(comment.id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-violet-400 text-[10px] transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{comment.likes > 0 ? comment.likes : "Thích"}</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-violet-400 text-[10px] transition-colors">
                    <Reply className="w-3 h-3" />
                    Trả lời
                  </button>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-red-400 text-[10px] transition-colors ml-auto">
                    <Flag className="w-3 h-3" />
                  </button>
                </div>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="mt-3 ml-2 pl-3 border-l-2 border-gray-800/60 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold">
                          {reply.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-gray-200 text-[11px] font-semibold">{reply.user}</span>
                            <span className="text-gray-600 text-[9px]">{reply.time}</span>
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">{reply.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button className="flex items-center gap-1 text-gray-600 hover:text-violet-400 text-[9px] transition-colors">
                              <ThumbsUp className="w-2.5 h-2.5" />
                              <span>{reply.likes}</span>
                            </button>
                            <button className="text-gray-600 hover:text-violet-400 text-[9px] transition-colors">
                              Trả lời
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}