Todos = new Meteor.Collection('todos');

Meteor.publish('todos', function () {
  return Todos.find({ privateTo: this.userId() });
});