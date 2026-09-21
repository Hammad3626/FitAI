const mongoose = require('mongoose');

// AIChatMessage Model — stores persistent AI Coach conversation history
// Each document is one message in a conversation session
const aiChatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient conversation retrieval
aiChatMessageSchema.index({ userId: 1, conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('AIChatMessage', aiChatMessageSchema);
