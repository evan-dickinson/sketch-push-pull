var sketch = require('sketch-driver');

describe("Basic tests", function() {
  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 2 * 1000;
  });

  it("Should work", function(done) {
    var script = `
      @import '../Push-Pop.sketchplugin/Contents/Sketch/test-utils.cocoascript';
      @import '../Push-Pop.sketchplugin/Contents/Sketch/script.cocoascript';

      var response = {};

      var doc = context.document;
      var page = [doc currentPage];
      var group = findLayerNamed([page children], 'Group');
      var oval  = findLayerNamed([page children], 'Oval');

      response.beforePush = {
        // To do JSON stuff, convert from NSString to plain JS String
        groupParentName: new String(getParent(group).name()),
        ovalParentName:  new String(getParent(oval).name()),

        groupParentIsOvalParent: getParent(group) == getParent(oval),
      };

      // TODO: We'll test Sketch better if we can actually modify the selection programatically.
      // Catch cases where the selection stops being ordered.
      var layers = [NSArray arrayWithObjects: group, oval];
      doPushIn(layers);


      response.afterPush = {
        groupParentName: new String(getParent(group).name()),
        ovalParentName:  new String(getParent(oval).name()),

        groupParentIsOvalParent: getParent(group) == getParent(oval),
      }

      $SD.respond(response)
    `

    sketch.run(script)
      .then(function(response) {
        var data = response.data;
        console.log(data);
        expect(data.beforePush.groupParentName).toBe("Simple push");
        expect(data.beforePush.ovalParentName).toBe("Simple push");
        expect(data.beforePush.groupParentIsOvalParent).toBeTruthy();


        expect(data.afterPush.groupParentName).toBe("Simple push");
        expect(data.afterPush.ovalParentName).toBe("Group");
        expect(data.afterPush.groupParentIsOvalParent).toBeFalsy();


        //expect(response.data.layerCount).toBe(2);
        done();
      })
      .catch(function(err) {
        console.log(err);
        expect(false).toBe(true);
        done();
      })
  });
});