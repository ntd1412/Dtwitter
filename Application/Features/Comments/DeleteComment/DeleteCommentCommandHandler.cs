﻿using Application.Exceptions;
using Application.Interfaces;
using MediatR;

namespace Application.Features.Comments.DeleteComment
{
    public class DeleteCommentCommandHandler : IRequestHandler<DeleteCommentCommand, DeleteCommentResponse>
    {
        private readonly IApplicationDbContext  _context;

        public DeleteCommentCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DeleteCommentResponse> Handle(DeleteCommentCommand request, CancellationToken cancellationToken)
        {
            var selectedComment = await _context.Comments.FindAsync(new object[] { request.CommentId}, cancellationToken)
                ?? throw new NotFoundException("Comment was not found");

            var selectedPost = await _context.Posts.FindAsync(new object[] { selectedComment.PostId }, cancellationToken)
                ?? throw new NotFoundException("Post was not found");

            bool isPostOwner = selectedComment.AppUserId == request.AuthUserId;
            bool isModerator = request.AuthUserRoles.Contains("Moderator");

            if (!isPostOwner && !isModerator)
            {
                throw new UnauthorizedException("User not authorized to delete comment");
            }
            var likes = _context.Likes.Where(l => l.CommentId == selectedComment.CommentId);
            _context.Likes.RemoveRange(likes);

            selectedPost.CommentsCount--;
            _context.Comments.Remove(selectedComment);

            await _context.SaveChangesAsync(cancellationToken);

            return new DeleteCommentResponse { IsDeleted = true };
        }
    }
}
