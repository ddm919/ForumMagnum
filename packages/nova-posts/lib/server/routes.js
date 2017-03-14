import { runCallbacksAsync } from 'meteor/nova:core';
import escapeStringRegexp from 'escape-string-regexp';
import { Picker } from 'meteor/meteorhacks:picker';
import Posts from '../collection.js';

Picker.route('/out', ({ query}, req, res, next) => {
  console.log('Route Function Called');
  if(query.url){ // for some reason, query.url doesn't need to be decoded
    /*
    If the URL passed to ?url= is in plain text, any hash fragment
    will get stripped out.
    So we search for any post whose URL contains the current URL to get a match
    even without the hash
    */
    const post = Posts.findOne({url: {$regex: escapeStringRegexp(query.url)}}, {sort: {postedAt: -1, createdAt: -1}});

    if (post) {
      const ip = req.headers && req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      runCallbacksAsync('posts.click.async', post, ip);
      console.log('Query URL: ',query.url);
      res.writeHead(301, {'Location': query.url});
      res.end();
    } else {
      // don't redirect if we can't find a post for that link
      res.end('Invalid URL');
    }
  } else {
    res.end("Please provide a URL");
  }
});
