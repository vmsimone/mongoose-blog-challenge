const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  author: {
      firstName: String,
      lastName: String
  }
});

postSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`;
});

//serialize could be changed to something else
postSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    created: this.created
  };
}


const BlogPost = mongoose.model('blogPosts', postSchema, 'blogPosts');

module.exports = {BlogPost};
