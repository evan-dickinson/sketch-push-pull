const sketch = require('sketch-driver');
const fse = require('node-fs-extra');
const path = require('path');
const osascript = require('node-osascript');
const copy = require('copy');

function copySketchFile(filename, done) {
  const TMP_DIR = path.join(__dirname, 'temp');

  fse.removeSync(TMP_DIR);
  fse.mkdirs(TMP_DIR);

  const copiedFile = path.join(TMP_DIR, filename);
  copy(filename, TMP_DIR, done);
  return copiedFile;
}

function openSketchFile(filename, done) {
  var args = {
    filename: filename,
  };

  const script =  `
    -- the considering block causes Applescript to wait for Sketch
    -- to do its thing before continuing.
    -- http://www.macscripter.net/viewtopic.php?pid=60364
    considering application responses
      tell application "Sketch"
        close "test-cases" without saving
      end tell
    end considering

    -- Not sure if this really needs to be a separate considering block,
    -- but let's be safe.
    considering application responses
      tell application "Sketch"
        open filename
      end tell
    end considering
  `

  osascript.execute(script, args, function(err, result, raw) {
    done(err, result);
  });
}

describe("Basic tests", function() {
  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 2 * 1000;
  });

  var tempFilename;
  beforeEach(function(done) {
    tempFilename = copySketchFile('tests/test-cases.sketch', done);
  });
  beforeEach(function(done) {
    openSketchFile(tempFilename, done);
  });

  it("Dummy", function() {});


  it("Push one level", function(done) {
    const PAGE_NAME = "Push one level";

    var args = {
      PAGE_NAME: PAGE_NAME,
    };
    argsCmd = "var args = " + JSON.stringify(args) + ";\n";
    var script = argsCmd + `
      @import '../Push-Pop.sketchplugin/Contents/Sketch/test-utils.cocoascript';
      @import '../Push-Pop.sketchplugin/Contents/Sketch/script.cocoascript';

      var response = {};

      var doc = context.document;
      setCurrentPageByName(doc, args.PAGE_NAME);
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
        expect(data.beforePush.groupParentName).toBe(PAGE_NAME);
        expect(data.beforePush.ovalParentName).toBe(PAGE_NAME);
        expect(data.beforePush.groupParentIsOvalParent).toBeTruthy();


        expect(data.afterPush.groupParentName).toBe(PAGE_NAME);
        expect(data.afterPush.ovalParentName).toBe("Group");
        expect(data.afterPush.groupParentIsOvalParent).toBeFalsy();

        done();
      })
      .catch(function(err) {
        console.log(err);
        expect(false).toBe(true);
        done();
      })
  });


 it("Push two levels", function(done) {
    const PAGE_NAME = "Push two levels";

    var args = {
      PAGE_NAME: PAGE_NAME,
    };
    argsCmd = "var args = " + JSON.stringify(args) + ";\n";
    var script = argsCmd + `
      @import '../Push-Pop.sketchplugin/Contents/Sketch/test-utils.cocoascript';
      @import '../Push-Pop.sketchplugin/Contents/Sketch/script.cocoascript';

      var response = {};

      var doc = context.document;
      setCurrentPageByName(doc, args.PAGE_NAME);
      var page = [doc currentPage];
      var group = findLayerNamed([page children], 'Inner Group');
      var oval  = findLayerNamed([page children], 'Oval');

      response.beforePush = {
        // To do JSON stuff, convert from NSString to plain JS String
        groupParentName: new String(getParent(group).name()),
        ovalParentName:  new String(getParent(oval).name()),

      };

      // TODO: We'll test Sketch better if we can actually modify the selection programatically.
      // Catch cases where the selection stops being ordered.
      var layers = [NSArray arrayWithObjects: group, oval];
      doPushIn(layers);


      response.afterPush = {
        groupParentName: new String(getParent(group).name()),
        ovalParentName:  new String(getParent(oval).name()),

      }

      $SD.respond(response)
    `

    sketch.run(script)
      .then(function(response) {
        var data = response.data;
        expect(data.beforePush.groupParentName).toBe('Outer Group');
        expect(data.beforePush.ovalParentName).toBe(PAGE_NAME);


        expect(data.afterPush.groupParentName).toBe('Outer Group');
        expect(data.afterPush.ovalParentName).toBe("Inner Group");

        done();
      })
      .catch(function(err) {
        console.log(err);
        expect(false).toBe(true);
        done();
      })
  });


});