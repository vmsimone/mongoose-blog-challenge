const mongoose = require('mongoose');
mongoose.Promise = global.Promise

const commentSchema = mongoose.Schema({ content: 'string' });

const authorSchema = mongoose.Schema({
  firstName: 'string',
  lastName: 'string',
  userName: {
    type: 'string',
    unique: true
  }
});

const postSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
  comments: [commentSchema]
});

postSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

postSchema.pre('find', function(next) {
  this.populate('author');
  next();
});

postSchema.pre('findOne', function(next) {
  this.populate('author');
  next();
})

//serialize could be changed to something else
postSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    comments: this.comments
  };
};

const Author = mongoose.model('Author', authorSchema);
const BlogPost = mongoose.model('BlogPost', postSchema);

module.exports = {Author, BlogPost};