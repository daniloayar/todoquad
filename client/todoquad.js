Todos = new Meteor.Collection('todos');

var layer = new Kinetic.Layer();

Meteor.autosubscribe(function () {
  // clean the canvas
  layer.removeChildren();

  Meteor.subscribe('todos');
  Todos.find({}, {sort: {lastUpdate: 1}}).forEach(function (todo) {
    addBoxToCanvas(todo._id, todo.text, todo.color, todo.x, todo.y, todo.degOffset);
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
  rect.on('dblclick dbltap', function(event) {
    Session.set('clientX', stage.getMousePosition().x);
    Session.set('clientY', stage.getMousePosition().y);
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
    Todos.insert({privateTo: userId, text: text, color: color, x: Session.get('clientX'), y: Session.get('clientY'), degOffset: randomInRange(-3.0,3.0), lastUpdate: new Date().getTime()});
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

function addBoxToCanvas(id, text, color, x, y, degOffset) {
  var group = new Kinetic.Group({
    id: id,
    width: 100,
    draggable: true
  });

  var box = new Kinetic.Text({
    id: id,
    x: x,
    y: y,
    width: 100,
    fill: color,
    strokeWidth: 0.1,
    fontSize: 14,
    fontFamily: 'Helvetica Neue',
    text: text,
    textFill: 'black',
    padding: 10,
    rotationDeg: degOffset
  });

  group.on('dragstart', function() {
    box.moveToTop();
    layer.draw();
  });

  group.on('dragmove', function() {
    document.body.style.cursor = 'pointer';
  });

  group.on('dragend', function() {
    console.log(group);
    console.log(box);
    var newX = box.attrs.x + group.attrs.x;
    var newY = box.attrs.y + group.attrs.y;
    Todos.update({_id: group.getId()}, {$set: {x: newX, y: newY, degOffset: randomInRange(-3.0,3.0), lastUpdate: new Date().getTime()}}, true);
  });

  group.on('dblclick dbltap', function() {
    $('#update-todo-modal').modal('show');
    $('#update-todo-id').val(box.getId());
    $('#update-todo-desc').val(box.attrs.text);
    $('#update-todo-color').val(box.attrs.fill);
    $('#update-todo-desc').focus();
  });

  group.on('mouseover', function() {
    document.body.style.cursor = 'pointer';
  });

  group.on('mouseout', function() {
    document.body.style.cursor = 'default';
  });

  var shadow = new Kinetic.Rect({
    x: x,
    y: y + Math.abs(degOffset*3),
    width: 100,
    height: box.getBoxHeight() - Math.abs(degOffset*2),
    fill: 'black',
    strokeWidth: 0,
    rotationDeg: degOffset+1,
    opacity: 0.2
  });

  group.add(shadow);
  group.add(box);

  layer.add(group);
  layer.draw();
}

function randomInRange (min, max) {
    return Math.random() * (max - min) + min;
}
