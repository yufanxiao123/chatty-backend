import { IUserDocument } from '@user/interfaces/user.interface';
import mongoose, { model, Model, Schema } from 'mongoose';
//the Model is responsible for reading, writing, and deleting data from the collection, while the Schema defines the structure of the data in the collection.
const userSchema: Schema = new Schema({
  //The 'ref' property is used to specify the model with which the ObjectId field is associated, so in this case, the 'AuthId' field is associated with the 'Auth' model.
  authId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', index: true },
  profilePicture: { type: String, default: '' },
  postsCount: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  passwordResetToken: { type: String, default: '' },
  passwordResetExpires: { type: Number },
  blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notifications: {
    messages: { type: Boolean, default: true },
    reactions: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true }
  },
  social: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  work: { type: String, default: '' },
  school: { type: String, default: '' },
  location: { type: String, default: '' },
  quote: { type: String, default: '' },
  bgImageVersion: { type: String, default: '' },
  bgImageId: { type: String, default: '' }
});
//the userSchema defines the structure of the User model. The mongoose.model() method creates the User model based on the schema,
/**
 * @param The name of the model, "User"
 * @param The schema that defines the structure of the documents in the collection, "userSchema"
 * @param The name of the collection in the MongoDB database where documents of this model will be stored, "User".
 * IUserDocument is an interface that defines the shape of the documents that will be stored in the collection.
 * one document in MongoDB can be thought of as equivalent to one row in a traditional relational database table. Both represent a single instance of a specific data structure.
 */
const UserModel: Model<IUserDocument> = model<IUserDocument>('User', userSchema, 'User');
export { UserModel };
