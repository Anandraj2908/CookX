import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Define the secret key for JWT token generation
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-123456789";

// Define User interface 
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

// Define User schema
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true,
  }
);

// Add pre-save hook to hash password before saving
userSchema.pre("save", async function (next) {
  const user = this;

  // Only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) return next();

  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare entered password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT auth token
userSchema.methods.generateAuthToken = function (): string {
  const user = this;
  const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
  return token;
};

// Create and export User model
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;