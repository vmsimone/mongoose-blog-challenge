'use strict';

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { BlogPost, Author } = require('./models');

const app = express();

app.use(morgan('common'));
app.use(express.json());

app.get('/blog-posts', (req, res) => {
  BlogPost
    .find()
    .then(blogPosts => {
      res.json(blogPosts.map(post => post.serialize()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

app.get('/authors', (req, res) => {
  Author
    .find()
    .then(author => {
      res.json(author.map(authorInfo => {
        return {
          id: authorInfo._id,
          name: `${authorInfo.firstName} ${authorInfo.lastName}`,
          userName: authorInfo.userName
        };
      }));
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

app.get('/blog-posts/:id', (req, res) => {
  BlogPost
    .findById(req.params.id)
    .then(blogPosts => res.json(blogPosts.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

app.post('/blog-posts', (req, res) => {
  const postKeys = ['title', 'content', 'author_id'];
  for (let i = 0; i < postKeys.length; i++) {
    const key = postKeys[i];
    if (!(key in req.body)) {
      const message = `Missing \`${key}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
    if (Author.findById(req.body.author_id) == "") {
      const message = `Error: Author ID \`${req.body.author_id}\` does not exist`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  BlogPost
    .create({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author._id
    })
    .then(blogPosts => res.status(201).json(blogPosts.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

app.post('/authors', (req, res) => {
  const expectedKeys = ['firstName', 'lastName', 'userName'];
  for (let i = 0; i < expectedKeys.length; i++) {
    const key = expectedKeys[i];
    if (!(key in req.body)) {
      const message = `Missing \`${key}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
    if (Author.findOne(req.body.userName)) {
      const message = `Error: Username \`${req.body.userName}\` already taken`;
      console.error(message);
      return res.status(400).send(message);
    } 
  }

  Author
    .create({
      firstName: req.body.firstName, 
      lastName: req.body.lastName, 
      userName: req.body.userName
    })
    .then(author => res.status(201).json({
      _id: author.id,
      name: `${author.firstName} ${author.lastName}`,
      userName: author.userName
    }))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    });
});

app.put('/blog-posts/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    return res.status(400).json({ message: message });
  }
  const updateThis = {};
  const updateableKeys = ['title', 'content'];

  updateableKeys.forEach(key => {
    if (key in req.body) {
      updateThis[key] = req.body[key];
    }
  });

  BlogPost
    .findByIdAndUpdate(req.params.id, { $set: updateThis })
    .then(blogPosts => res.status(204).end())
    .catch(err => res.status(500).json({ message: err }));
});

app.put('/authors/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = (
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`);
    console.error(message);
    return res.status(400).json({ message: message });
  }
  const updateThis = {};
  const updateableKeys = ['title', 'content'];

  updateableKeys.forEach(key => {
    if (key in req.body) {
      updateThis[key] = req.body[key];
    }
  });

  Author
    .findByIdAndUpdate(req.params.id, { $set: updateThis })
    .then(newAuthor => res.status(200).json({
      id: newAuthor.id,
      name: `${newAuthor.firstName} ${newAuthor.lastName}`,
      userName: newAuthor.userName
    }))
    .catch(err => res.status(500).json({ message: err }));
});

app.delete('/blog-posts/:id', (req, res) => {
  BlogPost
    .findByIdAndRemove(req.params.id)
    .then(blogPosts => res.status(204).end())
    .catch(err => res.status(500).json({ message: err }));
});

app.delete('/authors/:id', (req, res) => {
  BlogPost
    .findByIdAndRemove(req.params.id)
    .then(() => res.status(204).json({message: 'deleted'}))
    .catch(err => res.status(500).json({ message: err }));
});

app.use('*', function (req, res) {
  res.status(404).json({ message: 'Not Found' });
});

let server;

function runServer(databaseUrl, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };