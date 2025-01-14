﻿using Application.Exceptions;
using Application.Features.Friends.Common;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Friends.RespondToFriendRequest
{
    public class RespondToFriendRequestCommandHandler : IRequestHandler<RespondToFriendRequestCommand, RespondToFriendRequestResponse>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICacheInvalidationService _cacheInvalidationService;

        public RespondToFriendRequestCommandHandler(IApplicationDbContext context, ICacheInvalidationService cacheInvalidationService)
        {
            _context = context;
            _cacheInvalidationService = cacheInvalidationService;
        }

        public async Task<RespondToFriendRequestResponse> Handle(RespondToFriendRequestCommand request, CancellationToken cancellationToken)
        {
            var friendRequest = await _context.FriendRequests
                .FindAsync(new object[] { request.FriendRequestResponse.FriendRequestId }, cancellationToken)
                ?? throw new NotFoundException("Friend request not found");

            if (friendRequest.ReceiverId != request.AuthUserId)
            {
                throw new UnauthorizedException("You are not authorized to respond to this friend request");
            }

            if (friendRequest.Status != FriendRequestStatus.Pending)
            {
                throw new BadRequestException("This friend request already has a response");
            }

            var friendshipExists = await _context.Friendships.AnyAsync(f =>
                    (f.User1Id == friendRequest.SenderId && f.User2Id == friendRequest.ReceiverId)
                    || (f.User1Id == friendRequest.ReceiverId && f.User2Id == friendRequest.SenderId),
                    cancellationToken);

            if (friendshipExists)
            {
                throw new BadRequestException("You are already friends with this user");
            }

            if (request.FriendRequestResponse.Accept)
            {
                var friend = new Friendship
                {
                    User1Id = friendRequest.SenderId,
                    User2Id = friendRequest.ReceiverId,
                };

                friendRequest.Status = FriendRequestStatus.Accepted;

                await _context.Friendships.AddAsync(friend, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                InvalidatFriendshipCaches(friendRequest);
                _cacheInvalidationService.InvalidateUserFriendsCache(friendRequest.SenderId);
                _cacheInvalidationService.InvalidateUserFriendsCache(friendRequest.ReceiverId);

                var newFriend = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == friendRequest.SenderId, cancellationToken)
                    ?? throw new NotFoundException("New friend user not found");     

                return new RespondToFriendRequestResponse
                {
                    RequestAccepted = true,
                    FriendDto = new FriendDto
                    {
                        Username = newFriend.UserName,
                        FullName = newFriend.FullName,
                        ProfilePictureUrl = newFriend.ProfilePictureUrl,
                        Gender = newFriend.Gender,
                        DateEstablished = DateTime.Now
                    }
                };
            }

            friendRequest.Status = FriendRequestStatus.Declined;
            await _context.SaveChangesAsync(cancellationToken);

            InvalidatFriendshipCaches(friendRequest);

            return new RespondToFriendRequestResponse { RequestAccepted = false };         
        }

        private void InvalidatFriendshipCaches(FriendRequest friendRequest)
        {
            _cacheInvalidationService.InvalidateFriendRequestsCache(friendRequest.SenderId);
            _cacheInvalidationService.InvalidateFriendRequestsCache(friendRequest.ReceiverId);
            _cacheInvalidationService.InvalidateFriendshipStatusCache(friendRequest.SenderId, friendRequest.ReceiverId);
        }
    }
}
