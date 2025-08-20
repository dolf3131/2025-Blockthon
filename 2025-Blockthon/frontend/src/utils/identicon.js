/*
 * Identicon.js 2.3.3
 * http://github.com/stewartlord/identicon.js
 *
 * Copyright 2018, Stewart Lord <stewart@stewartlord.com>
 * Released under the MIT license.
 */

(function() {
  var PNGlib;

  if (typeof module !== 'undefined' && module.exports) {
    PNGlib = require('./pnglib');
  } else {
    PNGlib = window.PNGlib;
  }

  var Identicon = function(hash, options) {
    this.hash = hash;
    this.options = options || {};

    // defaults
    this.options.background = this.options.background || [240, 240, 240, 255];
    this.options.margin = this.options.margin === undefined ? 0.08 : this.options.margin;
    this.options.size = this.options.size || 64;
    this.options.saturation = this.options.saturation || 0.7;
    this.options.brightness = this.options.brightness || 0.5;
    this.options.format = this.options.format || 'png';
  };

  Identicon.prototype = {
    render: function() {
      var hash = this.hash;
      var options = this.options;

      var rgba = this.buildColor();
      var foreColor = rgba;
      var backColor = options.background;

      var data = this.buildData();

      var canvas = [];

      // padding
      var artist = function(x, y, w, h, color) {
        canvas.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')" />');
      };

      var block = Math.floor(options.size / 11);
      var margin = Math.floor(block * options.margin);

      var stroke = Math.floor(block * 0.08);
      stroke = stroke % 2 === 0 ? stroke : stroke + 1;

      var image = block * 9 + stroke * 2;
      var draw = block * 11;

      canvas.push('<svg width="' + draw + '" height="' + draw + '" viewBox="0 0 ' + draw + ' ' + draw + '" xmlns="http://www.w3.org/2000/svg">');
      artist(0, 0, draw, draw, backColor);

      // the grid
      for (var i = 0; i < 9; i++) {
        for (var j = 0; j < 9; j++) {
          if (data[i][j]) {
            artist(margin + i * block, margin + j * block, block, block, foreColor);
          }
        }
      }

      canvas.push('</svg>');

      if (options.format === 'svg') {
        return btoa(canvas.join(''));
      } else if (options.format === 'png') {
        var png = new PNGlib(draw, draw, 256);
        for (var i = 0; i < 9; i++) {
          for (var j = 0; j < 9; j++) {
            if (data[i][j]) {
              png.fillRect(margin + i * block, margin + j * block, block, block, rgba);
            }
          }
        }
        return png.getBase64();
      }
    },

    buildColor: function() {
      var hash = this.hash;
      var options = this.options;

      var H = parseInt(hash.substr(-7), 16) / 0xfffffff; // 0 to 1
      var S = options.saturation; // 0 to 1
      var B = options.brightness; // 0 to 1

      var C = B * S;
      var X = C * (1 - Math.abs((H * 6) % 2 - 1));
      var m = B - C;

      var r, g, b;

      if (H >= 0 && H < 1 / 6) {
        r = C;
        g = X;
        b = 0;
      } else if (H >= 1 / 6 && H < 2 / 6) {
        r = X;
        g = C;
        b = 0;
      } else if (H >= 2 / 6 && H < 3 / 6) {
        r = 0;
        g = C;
        b = X;
      } else if (H >= 3 / 6 && H < 4 / 6) {
        r = 0;
        g = X;
        b = C;
      } else if (H >= 4 / 6 && H < 5 / 6) {
        r = X;
        g = 0;
        b = C;
      } else if (H >= 5 / 6 && H < 1) {
        r = C;
        g = 0;
        b = X;
      }

      return [Math.floor((r + m) * 255), Math.floor((g + m) * 255), Math.floor((b + m) * 255), 255];
    },

    buildData: function() {
      var hash = this.hash;
      var data = [];

      // 5x5 grid, symmetric
      for (var i = 0; i < 5; i++) {
        data[i] = [];
        for (var j = 0; j < 5; j++) {
          data[i][j] = 0;
        }
      }

      // center column
      for (var i = 0; i < 5; i++) {
        var value = parseInt(hash.charAt(i), 16);
        if (value % 2 === 0) {
          data[2][i] = 1;
        }
      }

      // side columns
      for (var i = 0; i < 5; i++) {
        var value = parseInt(hash.charAt(i + 5), 16);
        if (value % 2 === 0) {
          data[1][i] = 1;
          data[3][i] = 1;
        }
      }

      // outer columns
      for (var i = 0; i < 5; i++) {
        var value = parseInt(hash.charAt(i + 10), 16);
        if (value % 2 === 0) {
          data[0][i] = 1;
          data[4][i] = 1;
        }
      }

      return data;
    },

    toString: function() {
      return this.render();
    },

    toBase64: function() {
      return this.render();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Identicon;
  } else {
    window.Identicon = Identicon;
  }
})();
