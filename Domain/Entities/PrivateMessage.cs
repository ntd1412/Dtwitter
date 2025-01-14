﻿namespace Domain.Entities
{
    public class PrivateMessage
    {
        public int PrivateMessageId { get; set; }
        public int SenderId { get; set; }
        public int RecipientId { get; set; }

        public AppUser Sender { get; set; }
        public AppUser Recipient { get; set; }

        public string SenderUsername { get; set; }
        public string RecipientUsername { get; set; }
        public string Content { get; set; }
        public DateTime? DateRead { get; set; }
        public DateTime PrivateMessageSent { get; set; } = DateTime.Now;
        public bool SenderDeleted { get; set; }
        public bool RecipientDeleted { get; set; }
    }
}
