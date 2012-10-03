// font stuff
var fonts = $.Deferred();
WebFontConfig = {
  google: { families: [ 'Nothing+You+Could+Do::latin' ] }
};
(function() {
  var wf = document.createElement('script');
  wf.src = ('https:' == document.location.protocol ? 'https' : 'http') + '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
  wf.type = 'text/javascript';
  wf.async = 'true';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wf, s);
})();

// todos minimongo collection
Todos = new Meteor.Collection('todos');

var layer = new Kinetic.Layer();

Meteor.autosubscribe(function () {
  // clean the canvas
  layer.removeChildren();

  var needForceRedraw = true;

  Meteor.subscribe('todos');
  Todos.find({}, {sort: {lastUpdate: 1}}).forEach(function (todo) {
    needForceRedraw = false; // will redraw in addBoxToCanvas
    addBoxToCanvas(todo._id, todo.text, todo.color, todo.x, todo.y, todo.degOffset);
  });

  // cases when Todos query returns empty, still need to redraw
  if (needForceRedraw) {
    layer.draw();
  }
});

$(window).bind("load", function() {
  
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
    height: height,
    opacity: 0.05,
    fill: 'white'
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
});

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
    fontSize: 15,
    fontFamily: 'Nothing You Could Do',
    text: text,
    textFill: 'black',
    padding: 10,
    rotationDeg: degOffset
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

  // add shadow, then the note box
  group.add(shadow);
  group.add(box);
  
  var imageObj = new Image();
  imageObj.onload = function() {
    var pushPinDegOffset = -15 * Math.abs(degOffset);
    var pushPin = new Kinetic.Image({
      x: x + 40,
      y: y - 10 + (pushPinDegOffset < -20 ? 5 : 0),
      image: imageObj,
      width: 20,
      height: 20,
      rotationDeg: pushPinDegOffset
    });

    // remove the pushpin when we are dragging
    group.on('dragstart', function() {
      pushPin.remove();
      layer.draw();
    });

    // add everything in this callback (image loading)
    group.add(pushPin);
    layer.add(group);
    layer.draw();
  };
  imageObj.src = 'red_pin_48.png';
}

function randomInRange (min, max) {
  return Math.random() * (max - min) + min;
}
