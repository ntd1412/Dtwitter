using Application.Exceptions;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Likes.UnlikePost
{
    public class UnlikePostCommandHandler : IRequestHandler<UnlikePostCommand, UnlikePostResponse>
    {
        private readonly IApplicationDbContext _context;

        public UnlikePostCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UnlikePostResponse> Handle(UnlikePostCommand request, CancellationToken cancellationToken)
        {
            // Kiểm tra và tìm bài viết
            var post = await _context.Posts.FindAsync(new object[] { request.PostId }, cancellationToken)
                ?? throw new NotFoundException("Post not found");

            var like = await _context.Likes.FirstOrDefaultAsync(l => l.PostId == request.PostId && l.AppUserId == request.AuthUserId, cancellationToken) ?? throw new NotFoundException("Posts like not found");

            // Giảm số lượng lượt thích của bài viết
            if (post.LikesCount > 0)
            {
                post.LikesCount--;
            }
            else
            {
                post.LikesCount = 0; // Đảm bảo không có giá trị âm
            }

            // Xóa lượt thích khỏi cơ sở dữ liệu
            _context.Likes.Remove(like);

            // Lưu các thay đổi vào cơ sở dữ liệu
            await _context.SaveChangesAsync(cancellationToken);

            return new UnlikePostResponse { Unliked = true };
        }
    }
}
