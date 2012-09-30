Todos = new Meteor.Collection('todos');

var layer = new Kinetic.Layer();

Meteor.autosubscribe(function() {
  layer.removeChildren();
  Todos.find({}).forEach(function (todo) {
    addBoxToCanvas(todo.x, todo.y, todo.color, todo.text, todo._id);
  });
});

window.onload = function() {
  var stage = new Kinetic.Stage({
    container: 'container',
    width: 800,
    height: 600
  });

  stage.add(layer);
};

Template.canvas.events = {
  'click #new-todo-btn': function (event) {
    $('#new-todo-modal').modal('show');
    $('#new-todo-desc').focus();
  },
  'click #create-todo': function (event) {
    createTodo();
  },
  'click #update-todo': function (event) {
    updateTodo();
  },
  'keypress #new-todo-desc': function (event) {
    if (event.which === 13) {
      createTodo();
      $('#create-todo').click();
    }
  },
  'keypress #new-todo-color': function (event) {
    if (event.which === 13) {
      createTodo();
      $('#create-todo').click();
    }
  },
  'keypress #update-todo-desc': function (event) {
    if (event.which === 13) {
      updateTodo();
      $('#update-todo').click();
    }
  },
  'keypress #update-todo-color': function (event) {
    if (event.which === 13) {
      updateTodo();
      $('#update-todo').click();
    }
  }
};

function createTodo() {
  var text = $('#new-todo-desc').val();
  var color = $('#new-todo-color').val();
  if (text && text.length > 0) {
    Todos.insert({x: 300, y: 300, color: color, text: text});
  }
  // reset
  $('#new-todo-desc').val('');
}

function updateTodo() {
  var id = $('#update-todo-id').val();
  var text = $('#update-todo-desc').val();
  var color = $('#update-todo-color').val();
  if (text && text.length > 0) {
    Todos.update({_id: id}, {$set: {color: color, text: text}});
  }
}

function addBoxToCanvas(x, y, color, text, id) {
  //console.log('adding box: x: ' + x + ', y: ' + y + ' color: ' + color + ' text: ' + text);

  var box = new Kinetic.Text({
    id: id,
    x: x,
    y: y,
    fill: color,
    strokeWidth: 1,
    fontSize: 14,
    fontFamily: 'Helvetica Neue',
    text: text,
    textFill: 'black',
    padding: 8,
    draggable: true
  });

  box.on('dragstart', function() {
    box.moveToTop();
    layer.draw();
  });

  box.on('dragmove', function() {
    document.body.style.cursor = 'pointer';
  });

  box.on("dragend", function() {
    Todos.update({_id: box.getId()}, {$set: {x: box.attrs.x, y: box.attrs.y}});
  });

  box.on('dblclick dbltap', function() {
    $('#update-todo-modal').modal('show');
    $('#update-todo-id').val(box.getId());
    $('#update-todo-desc').val(box.attrs.text);
    $('#update-todo-color').val(box.attrs.fill);
    $('#update-todo-desc').focus();
  });

  box.on('mouseover', function() {
    document.body.style.cursor = 'pointer';
  });

  box.on('mouseout', function() {
    document.body.style.cursor = 'default';
  });

  layer.add(box);
  layer.draw();
}
