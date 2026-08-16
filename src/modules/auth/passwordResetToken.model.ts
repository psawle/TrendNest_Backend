import { Schema, model, Types } from "mongoose";

export interface IPasswordResetToken {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Store only a SHA-256 digest. A database leak must not expose usable reset tokens.
    tokenHash: { type: String, required: true, unique: true },
    // MongoDB removes expired tokens automatically through this TTL index.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const PasswordResetToken = model<IPasswordResetToken>("PasswordResetToken", passwordResetTokenSchema);
