Todos = new Meteor.Collection('todos');

var layer = new Kinetic.Layer();

Meteor.autosubscribe(function () {
  // clean the canvas
  layer.removeChildren();

  Meteor.subscribe('todos');
  Todos.find({}).forEach(function (todo) {
    addBoxToCanvas(todo.x, todo.y, todo.color, todo.text, todo._id);
  });
});

window.onload = function() {
  var width = $('#the-grid').css('width').replace('px','') - 2;
  var height = $(window).height() - 75;

  var stage = new Kinetic.Stage({
    container: 'the-grid',
    width: width,
    height: height
  });

  // background shape to capture double-click events
  var rect = new Kinetic.Rect({
    width: width,
    height: height
  });
  rect.on('dblclick dbltap', function() {
    $('#new-todo-modal').modal('show');
    $('#new-todo-desc').focus();
  });
  var backLayer = new Kinetic.Layer();
  backLayer.add(rect);
  stage.add(backLayer);

  // stage layer goes over backlayer
  stage.add(layer);
};

Template.canvas.events = {
  'click #create-todo': function (event) {
    createTodo();
  },
  'click #update-todo': function (event) {
    updateTodo();
  },
  'click #complete-todo': function (event) {
    removeTodo();
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

function removeTodo() {
  var id = $('#update-todo-id').val();
  if (id) {
    Todos.remove({_id: id});

    // autosubscribe doesn't seem to work when completing the only todo item on the board
    layer.removeChildren();
    layer.draw();
  }
}

function createTodo() {
  var text = $('#new-todo-desc').val();
  var color = $('#new-todo-color').val();
  if (text && text.length > 0) {
    var userId = null;
    if (Meteor.user()) {
      userId = Meteor.user()._id;
    }
    Todos.insert({x: 300, y: 300, color: color, text: text, privateTo: userId});
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

  box.on('dragend', function() {
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
