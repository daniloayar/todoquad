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

Session.set('tag_filter', '<all tags>');

var canvasWidth = $(window).width();
var canvasHeight = $(window).height()-50; // account for login bar
var scaleRatioX = canvasWidth / 3000;
var scaleRatioY = canvasHeight / 3000;

// todos minimongo collection
Todos = new Meteor.Collection('todos');

var layer = new Kinetic.Layer();

Meteor.autosubscribe(function () {
  // clean the canvas
  layer.removeChildren();

  var needForceRedraw = true;
  var selector = {};

  var tag_filter = Session.get('tag_filter');
  if (tag_filter && tag_filter != '<all tags>') {
    selector.tags = tag_filter;
  } else if (!tag_filter) {
    selector.tags = '';
  }

  Meteor.subscribe('todos');
  Todos.find(selector, {sort: {lastUpdate: 1}}).forEach(function (todo) {
    needForceRedraw = false; // will redraw in addBoxToCanvas
    addBoxToCanvas(todo._id, todo.text, todo.tags, todo.color, todo.x * scaleRatioX, todo.y * scaleRatioY, todo.degOffset);
  });

  // cases when Todos query returns empty, still need to redraw
  if (needForceRedraw) {
    layer.draw();
  }
});

// set the canvas up on load
$(window).bind("load", function() {
  var stage = new Kinetic.Stage({
    container: 'the-grid',
    width: canvasWidth,
    height: canvasHeight
  });

  // background shape to capture double-click events
  var canvasRect = new Kinetic.Rect({
    width: canvasWidth,
    height: canvasHeight
  });

  canvasRect.on('dblclick dbltap', function(event) {
    // get intial pos for note
    var x = stage.getMousePosition().x;
    var y = stage.getMousePosition().y;
    if (stage.getTouchPosition()) { // mobile-friendly
      x = stage.getTouchPosition().x;
      y = stage.getTouchPosition().y;
    }
    showNew(x, y);
  });

  var backLayer = new Kinetic.Layer();
  backLayer.add(canvasRect);
  stage.add(backLayer);

  // stage layer goes over backlayer
  stage.add(layer);
});

Template.tag_infos.tags = function () {
  var tag_infos = [];
  var total_count = 0;

  Todos.find({}).forEach(function (todo) {
    _.each(todo.tags, function (tag) {
      var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
      if (!tag_info) {
        tag_infos.push({tag: tag, count: 1});
      } else {
        tag_info.count++;
      }
    });
    total_count++;
  });
  tag_infos.push({tag: '<all tags>', count: total_count});

  tag_infos = _.sortBy(tag_infos, function (x) { return x.count * -1; });

  return tag_infos;
};

Template.tag_infos.tag_text = function () {
  return this.tag || "<no tag>";
};

Template.tag_infos.style = function () {
  var style = '';
  var tag_filter = Session.get('tag_filter');
  console.log('tag_filter: ' + tag_filter + ' this.tag' + this.tag);
  if (tag_filter == this.tag || (!tag_filter && !this.tag)) {
    style = 'label-success';
  }
  return style;
};

Template.tag_infos.events({
  'mousedown .tag': function () {
    if (Session.equals('tag_filter', this.tag))
      Session.set('tag_filter', '<all tags>');
    else
      Session.set('tag_filter', this.tag);
  }
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
  'keypress #new-todo-tags': function (event) {
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
  'keypress #update-todo-tags': function (event) {
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
  var tags = $('#new-todo-tags').val().split(',');
  var color = $('#new-todo-color').val();
  if (text && text.length > 0) {
    var userId = null;
    if (Meteor.user()) {
      userId = Meteor.user()._id;
    }
    Todos.insert({privateTo: userId, text: text, tags: tags, color: color, x: Session.get('newNoteX') / scaleRatioX, y: Session.get('newNoteY') / scaleRatioY, degOffset: randomInRange(-3.0,3.0), lastUpdate: new Date().getTime()});
  }
  // reset
  $('#new-todo-desc').val('');
}

function updateTodo() {
  var id = $('#update-todo-id').val();
  var text = $('#update-todo-desc').val();
  var tags = $('#update-todo-tags').val().split(',');
  var color = $('#update-todo-color').val();
  if (text && text.length > 0) {
    Todos.update({_id: id}, {$set: {text: text, tags: tags, color: color}});
  }
}

function showNew(x ,y) {
  Session.set('newNoteX', x);
  Session.set('newNoteY', y);
  $('#new-todo-modal').modal('show');
  $('#new-todo-desc').focus();
}

function showEdit(box) {
  $('#update-todo-modal').modal('show');
  $('#update-todo-id').val(box.getId());
  $('#update-todo-desc').val(box.attrs.text);
  $('#update-todo-tags').val(box.attrs.name);
  $('#update-todo-color').val(box.attrs.fill);
  $('#update-todo-desc').focus();
}

function addBoxToCanvas(id, text, tags, color, x, y, degOffset) {
  var group = new Kinetic.Group({
    id: id,
    width: 100,
    draggable: true
  });

  var box = new Kinetic.Text({
    id: id,
    name: tags,
    x: x,
    y: y,
    width: 100,
    fill: color,
    strokeWidth: 0.1,
    fontSize: 15,
    fontFamily: 'Nothing You Could Do',
    text: text,
    textFill: 'black',
    padding: 12,
    rotationDeg: degOffset
  });

  group.on('dragend', function() {
    var newX = box.attrs.x + group.attrs.x;
    var newY = box.attrs.y + group.attrs.y;
    Todos.update({_id: group.getId()}, {$set: {x: sanitizeX(newX, box.getBoxWidth()+5) / scaleRatioX, y: sanitizeY(newY, box.getBoxHeight()+5) / scaleRatioY, degOffset: randomInRange(-3.0,3.0), lastUpdate: new Date().getTime()}}, true);
  });

  group.on('mouseup touchend', function() {
    // make sure the group was just clicked, not moved
    if (group.attrs.x === 0 && group.attrs.y === 0) {
      showEdit(box);
    }
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

function sanitizeX(x, width) {
  if (x > 10) {
    if (x < canvasWidth - width) {
      return x;
    }
    return canvasWidth - width;
  }
  return 10;
}

function sanitizeY(y, height) {
  if (y > 10) {
    if (y < canvasHeight - height) {
      return y;
    }
    return canvasHeight - height;
  }
  return 10;
}

function randomInRange (min, max) {
  return Math.random() * (max - min) + min;
}
