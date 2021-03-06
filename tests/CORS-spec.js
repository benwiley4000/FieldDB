/* globals document, jasmine */
"use strict";

var CORS;
try {
  /* globals FieldDB */
  CORS = document.CORS || FieldDB.CORS;
} catch (e) {
  try {
    CORS = require("../api/CORS").CORS;
  } catch (e) {}
}

var specIsRunningTooLong = 20000;
jasmine.getEnv().defaultTimeoutInterval = specIsRunningTooLong;

var expectedErrors = function(error) {
  if (error.status === 620) {
    expect(error.userFriendlyErrors[0]).toContain("CORS not supported, your device will be unable to contact");
    return true;
  } else if (error.status === 610) {
    expect(error.userFriendlyErrors[0]).toContain(["please report this"]);
    return true;
  } else if (error.status === 600) {
    expect(error.userFriendlyErrors[0]).toContain("you appear to be offline");
    return true;
  } else if (error.status === 500) {
    expect(error.userFriendlyErrors[0]).toContain("lease report this");
    return true;
  } else {
    return false;
  }
};

describe("CORS", function() {

  describe("construction", function() {
    it("should be load", function() {
      expect(CORS).toBeDefined();
    });
  });

  describe("errors", function() {
    it("should not run if url is missing", function(done) {
      CORS.makeCORSRequest().then(function(results) {
        expect(results).toEqual("should not have succeeded if url is missing");
      }, function(error) {
        expect(error.userFriendlyErrors[0]).toEqual("Url must be defined");
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

    it("should know if the user is offline", function(done) {
      var options = {
        url: "https://corpusdev.lingsync.org",
        withCredentials: false
      };
      CORS.makeCORSRequest(options).then(function(results) {
        expect(results.couchdb).toEqual("Welcome");
        expect(results.version).toEqual("1.6.1");
        expect(results.vendor.name).toEqual("Ubuntu");
      }, function(error) {
        expect(error.details.url).toEqual(options.url);
        if (expectedErrors(error)) {
          // errors were expected
        } else {
          expect(error).toEqual("should not get here");
        }
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

    it("should know if the server is offline", function(done) {
      var options = {
        url: "http://localhost:3111",
        method: "POST",
        data: {
          something: "here"
        }
      };
      CORS.makeCORSRequest(options).then(function(results) {
        expect("should not be able to contact http://localhost:3111").toBeUndefined();
        expect(results).toBeUndefined();
      }, function(error) {
        expect(error.details.data).toEqual(options.data);
        expect(error.details.method).toEqual(options.method);
        expect(error.details.url).toEqual(options.url);
        if (expectedErrors(error)) {
          // errors were expected
        } else {
          expect(error).toEqual("should not get here");
        }
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

    it("should know if the server connection times out", function(done) {
      expect(CORS.timeout).toEqual(30 * 1000);
      var options = {
        url: "https://corpusdev.lingsync.org/public-curldemo",
        method: "GET",
        timeout: 10
      };
      CORS.makeCORSRequest(options).then(function(results) {
        expect("should not have reached an unreachable server").toBeUndefined();
        expect(results).toBeUndefined();
      }, function(error) {
        expect(error.details.url).toEqual(options.url);
        expect(error.details.data).toEqual(options.data);
        expect(error.details.method).toEqual(options.method);
        if (error.status === 500) {
          expect(error.status).toEqual(500);
          if (error.userFriendlyErrors[0].indexOf("timed out") > -1) {
            expect(error.userFriendlyErrors[0]).toContain("timed out, please try again");
          }
        } else if (expectedErrors(error)) {
          // errors were expected
        } else {
          expect(error).toEqual("should not get here");
        }
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

    it("should return unauthorized", function(done) {
      CORS.makeCORSRequest({
        url: "https://corpusdev.lingsync.org/_session",
        method: "DELETE"
      }).then(function() {
        var options = {
          url: "https://corpusdev.lingsync.org/public-curldemo",
          method: "POST",
          data: {
            id: "test_unauth_post" + Date.now()
          }
        };

        CORS.makeCORSRequest(options).then(function(results) {
          expect("should not have created a doc when not logged in").toBeUndefined();
          expect(results).toBeUndefined();
        }, function(error) {
          expect(error.details.data.id).toEqual(options.data.id);
          if (expectedErrors(error)) {
            // errors were expected
          } else if (error.status === 401) {
            expect(error.status).toEqual(401);
            expect(error.userFriendlyErrors).toEqual(["You are not authorized to access this db."]);
          } else {
            expect(error).toEqual("should not get here");
          }
        }).fail(function(exception) {
          console.log(exception.stack);
          expect(exception).toEqual("unexpected exception while testing");
        }).done(done);

      }, function(error) {
        if (expectedErrors(error)) {
          // errors were expected
        } else {
          expect(error).toEqual("should not get here");
        }
        done();
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
        done();
      });
    }, specIsRunningTooLong);

  });

  describe("servers", function() {

    it("should DELETE", function(done) {
      // CORS.debugMode = true;
      CORS.makeCORSRequest({
        url: "https://corpusdev.lingsync.org/_session",
        method: "DELETE"
      }).then(function(results) {
        expect(results.ok).toEqual(true);
      }, function(error) {
        if (expectedErrors(error)) {
          // errors were expected
        } else {
          expect(error).toEqual("should not get here");
        }
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

    it("should GET", function(done) {
      CORS.makeCORSRequest({
        url: "https://corpusdev.lingsync.org/_session",
      }).then(function(results) {
        expect(results.ok).toEqual(true);
        expect(results.userCtx.name).toEqual(null);
        expect(results.userCtx.roles).toEqual([]);
      }, function(error) {
        if (expectedErrors(error)) {
          // errors were expected
        } else {
          expect(error).toEqual("should not get here");
        }
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

    it("should POST", function(done) {
      CORS.makeCORSRequest({
        url: "https://corpusdev.lingsync.org/_session",
        method: "POST",
        data: {
          name: "jenkins",
          password: "phoneme"
        }
      }).then(function(results) {
        expect(results.ok).toEqual(true);
        expect(results.name).toEqual("jenkins");
        expect(results.roles.length).toEqual(29);
      }, function(error) {
        if (expectedErrors(error)) {
          // errors were expected
        } else {
          expect(error).toEqual("should not get here");
        }
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

    it("should GET html from node", function(done) {
      var options = {
        url: "https://authdev.lingsync.org"
      };
      CORS.makeCORSRequest(options).then(function(results) {
        expect(results).toContain("<!DOCTYPE html>");
      }, function(error) {
        if (expectedErrors(error)) {
          // errors were expected
        } else {
          expect(error).toEqual("should not get here");
        }
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

    it("should GET binary from node", function(done) {
      var listenedToProgress = false;
      var options = {
        url: "https://speech.lingsync.org/utterances/community-georgian/orive_gi%C9%A3deba/orive_gi%C9%A3deba.png",
        onprogress: function() {
          listenedToProgress = true;
        }
      };
      CORS.makeCORSRequest(options).then(function(results) {
        expect(listenedToProgress).toEqual(true);

        expect(results.length).toEqual(142838);
        expect(options.complete).toEqual(true);
        expect(options.percentComplete).toEqual(100);
      }, function(error) {
        if (expectedErrors(error)) {
          // errors were expected
        } else {
          expect(error).toEqual("should not get here");
        }
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

    it("should POST json to node", function(done) {
      var options = {
        url: "https://authdev.lingsync.org/register",
        method: "POST",
        data: {
          username: "jenkins",
          password: "phoneme"
        }
      };
      CORS.makeCORSRequest(options).then(function(results) {
        expect(results).toEqual("Register should have replie that jenkins already exists");
      }, function(error) {
        expect(error.details.data).toEqual(options.data);
        expect(error.details.method).toEqual(options.method);
        expect(error.details.url).toEqual(options.url);
        if (expectedErrors(error)) {
          // errors were expected
        } else if (error.status === 409) {
          expect(error.status).toEqual(409);
          expect(error.userFriendlyErrors).toEqual(["Username jenkins already exists, try a different username."]);
        } else {
          expect(error).toEqual("should not get here");
        }
      }).fail(function(exception) {
        console.log(exception.stack);
        expect(exception).toEqual("unexpected exception while testing");
      }).done(done);
    }, specIsRunningTooLong);

  });

});
