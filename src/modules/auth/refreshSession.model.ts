import { Schema, model, Types } from "mongoose";

export interface IRefreshSession {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema = new Schema<IRefreshSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Store only a SHA-256 digest. A database leak must not expose usable bearer tokens.
    tokenHash: { type: String, required: true, unique: true },
    // MongoDB removes expired sessions automatically through this TTL index.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const RefreshSession = model<IRefreshSession>("RefreshSession", refreshSessionSchema);
