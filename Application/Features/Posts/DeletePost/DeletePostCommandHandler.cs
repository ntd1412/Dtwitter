using Application.Exceptions;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using System.ComponentModel.Design;

namespace Application.Features.Posts.DeletePost
{
    public class DeletePostCommandHandler : IRequestHandler<DeletePostCommand, DeletePostResponse>
    {
        private readonly IApplicationDbContext _context;
        private readonly IPhotoService _photoService;
        private readonly ICacheInvalidationService _cacheInvalidationService;

        public DeletePostCommandHandler(IApplicationDbContext context, IPhotoService photoService, ICacheInvalidationService cacheInvalidationService)
        {
            _context = context;
            _photoService = photoService;
            _cacheInvalidationService = cacheInvalidationService;
        }

        public async Task<DeletePostResponse> Handle(DeletePostCommand request, CancellationToken cancellationToken)
        {
            var authUser = await _context.Users.FindAsync(new object[] { request.AuthUserId }, cancellationToken);
            if (authUser == null)
            {
                throw new NotFoundException("Authorized user not found");
            }

            var selectedPost = await _context.Posts
                                             .Include(p => p.Likes)
                                             .Include(p => p.Comments)
                                             .ThenInclude(c => c.Likes) // Include likes of comments
                                             .FirstOrDefaultAsync(p => p.PostId == request.PostId, cancellationToken);

            // Check if the post exists
            if (selectedPost == null)
            {
                throw new NotFoundException("Post was not found");
            }

            bool isPostOwner = selectedPost.AppUserId == request.AuthUserId;
            bool isModerator = request.AuthUserRoles.Contains("Moderator");

            // Only the post's owner or a moderator/admin can delete the post
            if (!isPostOwner && !isModerator)
            {
                throw new UnauthorizedException("User not authorized to delete this post");
            }

            // Remove the photo from Cloudinary if it is included in the post
            if (!string.IsNullOrEmpty(selectedPost.PhotoPublicId))
            {
                var deletionResult = await _photoService.DeletePhotoAsync(selectedPost.PhotoPublicId);

                if (deletionResult.Error == null)
                {
                    _cacheInvalidationService.InvalidateUserPhotosCache(authUser.UserName);
                }

                if (deletionResult.Error != null)
                {
                    throw new ServerErrorException(deletionResult.Error);
                }
            }

            // Remove all likes of comments
            foreach (var comment in selectedPost.Comments)
            {
                _context.Likes.RemoveRange(comment.Likes);
            }

            // Remove comments, likes of the post, and the post itself
            _context.Comments.RemoveRange(selectedPost.Comments);
            _context.Likes.RemoveRange(selectedPost.Likes);
            _context.Posts.Remove(selectedPost);

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
            }

            return new DeletePostResponse { IsDeleted = true };
        }

    }
}
