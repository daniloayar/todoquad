var layer = new Kinetic.Layer();

Template.canvas.events = {
  'click input' : function () {
    var text=prompt("Give the box text","");
    addBox(300, 300, 'yellow', text);
    layer.draw();
  }
};

window.onload = function() {
  var stage = new Kinetic.Stage({
    container: 'container',
    width: 800,
    height: 600
  });

  stage.add(layer);
};

function addBox(x, y, color, text) {

  var box = new Kinetic.Text({
    x: x,
    y: y,
    fill: 'yellow',
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
  /*
   * dblclick to remove box for desktop app
   * and dbltap to remove box for mobile app
   */
  box.on('dblclick dbltap', function() {
    var text=prompt("Give the box text",box.textArr);
    box.setText(text);
    layer.draw();
  });

  box.on('mouseover', function() {
    document.body.style.cursor = 'pointer';
  });
  box.on('mouseout', function() {
    document.body.style.cursor = 'default';
  });

  layer.add(box);
}
