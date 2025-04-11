import mongoose from 'mongoose';

const botTransactionSchema = new mongoose.Schema(
    {
        botId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Bot',
            required: true,
            index: true
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        input: {
            type: String,
            required: true
        },
        response: {
            type: String,
            required: true
        },
        metadata: {
            type: Object,
            default: {}
        },
        processingTime: {
            type: Number,  // in milliseconds
            default: 0
        },
        status: {
            type: String,
            enum: ['success', 'error', 'timeout'],
            default: 'success'
        },
        errorDetails: {
            type: String
        },
        ipAddress: {
            type: String
        },
        userAgent: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// Index for efficient querying by date
botTransactionSchema.index({ createdAt: -1 });

const BotTransaction = mongoose.model('BotTransaction', botTransactionSchema);

export default BotTransaction;