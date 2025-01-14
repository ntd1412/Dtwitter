﻿
namespace Domain.Entities
{
    public class Comment
    {
        public int CommentId { get; set; }
        public int AppUserId { get; set; }
        public int PostId { get; set; }

        public Post? Post { get; set; }
        public AppUser? AppUser { get; set; }

        public string? Content { get; set; }
        public DateTime TimeCommented { get; set; } = DateTime.Now;

        public ICollection<Like>? Likes { get; set; }
        public int LikesCount { get; set; } = 0;
        public bool IsLikedByCurrentUser { get; set; }
    }
}
