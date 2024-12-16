import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  category: 'info' | 'alert' | 'message';
  read: boolean;
  timestamp: Date;
  userId: mongoose.Types.ObjectId;
}

const NotificationSchema: Schema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, enum: ['info', 'alert', 'message'], required: true },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);

