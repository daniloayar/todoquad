Todos = new Meteor.Collection('todos');

var layer = new Kinetic.Layer();

Template.canvas.events = {
  'click input' : function () {
    var text=prompt("Give the box text","");
    Todos.insert({x: 300, y: 300, color: 'yellow', text: text});
  }
};

Meteor.autosubscribe(function() {
  layer.removeChildren();
  Todos.find({}).forEach(function (todo) {
    addBoxToCanvas(todo.x, todo.y, todo.color, todo.text, todo._id);
  });
});

Todos.find({}).observe({
    changed: function(new_doc, idx, old_doc) {
      if(layer) {
        console.log(new_doc);
      }
    }
  });

window.onload = function() {
  var stage = new Kinetic.Stage({
    container: 'container',
    width: 800,
    height: 600
  });

  stage.add(layer);
};

function addBoxToCanvas(x, y, color, text, id) {
  console.log('adding box: x: ' + x + ', y: ' + y + ' color: ' + color + ' text: ' + text);

  var box = new Kinetic.Text({
    id: id,
    x: x,
    y: y,
    fill: color,
    strokeWidth: 4,
    fontSize: 18,
    fontFamily: 'Calibri',
    text: text,
    textFill: 'black',
    padding: 15,
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
    updateBox(this);
  });
  
  box.on('dblclick dbltap', function() {
    var text=prompt("Give the box text",box.textArr);
    this.setText(text);
    updateBox(this);
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

function updateBox(box) {
  Todos.update({_id: box.getId()}, {x: box.attrs.x, y: box.attrs.y, color: box.attrs.fill, text: box.attrs.text});
}
