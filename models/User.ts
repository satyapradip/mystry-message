import mongoose, { Schema, Document } from "mongoose";

/**
 * Message Interface
 * This defines the structure (shape) of a single message document in MongoDB.
 * 'extends Document' means it inherits all MongoDB document properties (like _id, etc.)
 */
export interface Message extends Document {
  content: string;   // The actual text of the message
  createdAt: Date;   // When the message was created 
}

// MessageSchema defines how Message data is stored in MongoDB
const MessageSchema: Schema<Message> = new Schema({
  content: {
    type: String,
    required: true,  // This field must be provided
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now  // If no date is provided, use the current date/time
  },
});

/**
 * User Interface
 * This defines the structure of a User document in MongoDB.
 * Each user has a username, email, password, verification details, and messages.
 */
export interface User extends Document {
  username: string;
  email: string;
  password: string;
  verifyCode: string;        // The 6-digit code sent to user's email for verification
  verifyCodeExpiry: Date;    // When the verification code expires
  isVerified: boolean;       // Has the user verified their email?
  isAcceptingMessages: boolean;  // Is the user accepting anonymous messages?
  messages: Message[];       // Array of messages belonging to this user
}

// UserSchema defines how User data is stored in MongoDB
const UserSchema: Schema<User> = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],  // Custom error message if field is missing
    trim: true,     // Removes whitespace from both ends
    unique: true    // No two users can have the same username
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    // Regex pattern to validate email format (something@something.something)
    match: [/.+\@.+\..+/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  verifyCode: {
    type: String,
    required: [true, 'Verify Code is required'],
  },
  verifyCodeExpiry: {
    type: Date,
    required: [true, 'Verify Code Expiry is required'],
  },
  isVerified: {
    type: Boolean,
    default: false,  // New users start as not verified
  },
  isAcceptingMessages: {
    type: Boolean,
    default: true,   // New users start with accepting messages enabled
  },
  // Embed the MessageSchema directly inside the User document
  // This means messages are stored inside the user document (not a separate collection)
  messages: [MessageSchema],
});

/**
 * UserModel - The actual Mongoose model we use to interact with the 'users' collection
 * 
 * mongoose.models.User -> Check if model already exists (prevents "OverwriteModel" error)
 * If not exists, create a new model called "user" using UserSchema
 * 
 * The 'as mongoose.Model<User>' tells TypeScript the type of this model
 */
const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("user", UserSchema);

export default UserModel;