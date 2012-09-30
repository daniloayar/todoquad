Todos = new Meteor.Collection('todos');

Meteor.publish('todos', function () {
  return Todos.find({
    privateTo: {
      $in: [null, this.userId()]
    }
  });
});