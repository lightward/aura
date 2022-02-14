(function () {
	'use strict';

	// A is m x n. B is n x p. product is m x p.
	function multiplyMatrices(A, B) {
	  let m = A.length;

	  if (!Array.isArray(A[0])) {
	    // A is vector, convert to [[a, b, c, ...]]
	    A = [A];
	  }

	  if (!Array.isArray(B[0])) {
	    // B is vector, convert to [[a], [b], [c], ...]]
	    B = B.map(x => [x]);
	  }

	  let p = B[0].length;
	  let B_cols = B[0].map((_, i) => B.map(x => x[i])); // transpose B

	  let product = A.map(row => B_cols.map(col => {
	    if (!Array.isArray(row)) {
	      return col.reduce((a, c) => a + c * row, 0);
	    }

	    return row.reduce((a, c, i) => a + c * (col[i] || 0), 0);
	  }));

	  if (m === 1) {
	    product = product[0]; // Avoid [[a, b, c, ...]]
	  }

	  if (p === 1) {
	    return product.map(x => x[0]); // Avoid [[a], [b], [c], ...]]
	  }

	  return product;
	}
	/**
	 * Check if a value is a string (including a String object)
	 * @param {*} str - Value to check
	 * @returns {boolean}
	 */


	function isString(str) {
	  return type(str) === "string";
	}
	/**
	 * Determine the internal JavaScript [[Class]] of an object.
	 * @param {*} o - Value to check
	 * @returns {string}
	 */


	function type(o) {
	  let str = Object.prototype.toString.call(o);
	  return (str.match(/^\[object\s+(.*?)\]$/)[1] || "").toLowerCase();
	}
	/**
	 * Like Object.assign() but copies property descriptors (including symbols)
	 * @param {Object} target - Object to copy to
	 * @param {...Object} sources - Objects to copy from
	 * @returns {Object} target
	 */


	function extend(target, ...sources) {
	  for (let source of sources) {
	    if (source) {
	      let descriptors = Object.getOwnPropertyDescriptors(source);
	      Object.defineProperties(target, descriptors);
	    }
	  }

	  return target;
	}
	/**
	 * Copy a descriptor from one object to another
	 * @param {Object} target - Object to copy to
	 * @param {Object} source - Object to copy from
	 * @param {string} prop - Name of property
	 */


	function copyDescriptor(target, source, prop) {
	  let descriptor = Object.getOwnPropertyDescriptor(source, prop);
	  Object.defineProperty(target, prop, descriptor);
	}
	/**
	 * Uppercase the first letter of a string
	 * @param {string} str - String to capitalize
	 * @returns Capitalized string
	 */


	function capitalize(str) {
	  if (!str) {
	    return str;
	  }

	  return str[0].toUpperCase() + str.slice(1);
	}
	/**
	 * Round a number to a certain number of significant digits based on a range
	 * @param {number} n - The number to round
	 * @param {number} precision - Number of significant digits
	 * @param {Array[2]} range - Range to base decimals on
	 */


	function toPrecision(n, precision, range = [0, 1]) {
	  precision = +precision;
	  let digits = ((range[1] || range[0] || 1) + "").length;
	  let decimals = Math.max(0, precision + 1 - digits);
	  return +n.toFixed(decimals);
	}

	function parseCoord(coord) {
	  if (coord.indexOf(".") > 0) {
	    // Reduce a coordinate of a certain color space until the color is in gamut
	    let [spaceId, coordName] = coord.split(".");
	    let space = Color.space(spaceId);

	    if (!(coordName in space.coords)) {
	      throw new ReferenceError(`Color space "${space.name}" has no "${coordName}" coordinate.`);
	    }

	    return [space, coordName];
	  }
	}

	function value(obj, prop, value) {
	  let props = prop.split(".");
	  let lastProp = props.pop();
	  obj = props.reduceRight((acc, cur) => {
	    return acc && acc[cur];
	  }, obj);

	  if (obj) {
	    if (value === undefined) {
	      // Get
	      return obj[lastProp];
	    } else {
	      // Set
	      return obj[lastProp] = value;
	    }
	  }
	}

	var util = /*#__PURE__*/Object.freeze({
	  __proto__: null,
	  isString: isString,
	  type: type,
	  extend: extend,
	  copyDescriptor: copyDescriptor,
	  capitalize: capitalize,
	  toPrecision: toPrecision,
	  parseCoord: parseCoord,
	  value: value,
	  multiplyMatrices: multiplyMatrices
	});
	/**
	 * Module version of Bliss.Hooks.
	 * @author Lea Verou
	 */

	class Hooks {
	  add(name, callback, first) {
	    if (typeof arguments[0] != "string") {
	      // Multiple hooks
	      for (var name in arguments[0]) {
	        this.add(name, arguments[0][name], arguments[1]);
	      }

	      return;
	    }

	    (Array.isArray(name) ? name : [name]).forEach(function (name) {
	      this[name] = this[name] || [];

	      if (callback) {
	        this[name][first ? "unshift" : "push"](callback);
	      }
	    }, this);
	  }

	  run(name, env) {
	    this[name] = this[name] || [];
	    this[name].forEach(function (callback) {
	      callback.call(env && env.context ? env.context : env, env);
	    });
	  }

	}

	const ε = .000075;
	const hasDOM = typeof document !== "undefined";

	class Color$1$1 {
	  // Signatures:
	  // new Color(stringToParse)
	  // new Color(otherColor)
	  // new Color(coords, alpha) // defaults to sRGB
	  // new Color(CSS variable [, root])
	  constructor(...args) {
	    let str, color; // new Color(color)
	    // new Color({spaceId, coords})
	    // new Color({space, coords})

	    if (args[0] && typeof args[0] === "object" && (args[0].space || args[0].spaceId) && args[0].coords) {
	      color = args[0];
	    } else if (isString(args[0])) {
	      // new Color("--foo" [, root])
	      if (hasDOM && args[0].indexOf("--") === 0) {
	        // CSS variable
	        let root = arguments[1] && arguments[1].nodeType === 1 ? arguments[1] : document.documentElement;
	        str = getComputedStyle(root).getPropertyValue(arguments[0]);
	      } // new Color(string)
	      else if (args.length === 1) {
	        str = args[0];
	      }

	      if (str) {
	        color = Color$1$1.parse(str);
	      }
	    }

	    if (color) {
	      if ("spaceId" in color) {
	        this.spaceId = color.spaceId;
	      } else {
	        this.space = color.space;
	      }

	      this.coords = color.coords.slice();
	      this.alpha = color.alpha;
	    } else {
	      // default signature new Color([ColorSpace,] array [, alpha])
	      let spaceId, coords, alpha;

	      if (Array.isArray(args[0])) {
	        // No color space provided, default to sRGB
	        [spaceId, coords, alpha] = ["sRGB", ...args];
	      } else {
	        [spaceId, coords, alpha] = args;
	      }

	      this.spaceId = spaceId || "sRGB";
	      this.coords = coords ? coords.slice() : [0, 0, 0];
	      this.alpha = alpha;
	    }

	    this.alpha = this.alpha < 1 ? this.alpha : 1; // this also deals with NaN etc
	    // Convert "NaN" to NaN

	    for (let i = 0; i < this.coords.length; i++) {
	      if (this.coords[i] === "NaN") {
	        this.coords[i] = NaN;
	      }
	    }
	  }

	  get space() {
	    return Color$1$1.spaces[this.spaceId];
	  }

	  set space(value) {
	    // Setting spaceId works with color space objects too
	    return this.spaceId = value;
	  }

	  get spaceId() {
	    return this._spaceId;
	  } // Handle dynamic changes of color space


	  set spaceId(id) {
	    let newSpace = Color$1$1.space(id);
	    id = newSpace.id;

	    if (this.space && newSpace && this.space !== newSpace) {
	      // We’re not setting this for the first time, need to:
	      // a) Convert coords
	      this.coords = this[id]; // b) Remove instance properties from previous color space

	      for (let prop in this.space.instance) {
	        if (this.hasOwnProperty(prop)) {
	          delete this[prop];
	        }
	      }
	    }

	    this._spaceId = id; // Add new instance properties from new color space

	    extend(this, this.space.instance);
	  }

	  get white() {
	    return this.space.white || Color$1$1.whites.D50;
	  } // Set properties and return current instance


	  set(prop, value$1) {
	    if (arguments.length === 1 && type(arguments[0]) === "object") {
	      // Argument is an object literal
	      let object = arguments[0];

	      for (let p in object) {
	        this.set(p, object[p]);
	      }
	    } else {
	      if (typeof value$1 === "function") {
	        let current = value(this, prop);
	        value(this, prop, value$1.call(this, current));
	      } else {
	        value(this, prop, value$1);
	      }
	    }

	    return this;
	  }

	  lighten(amount = .25) {
	    let ret = new Color$1$1(this);
	    let lightness = ret.lightness;
	    ret.lightness = lightness * (1 + amount);
	    return ret;
	  }

	  darken(amount = .25) {
	    let ret = new Color$1$1(this);
	    let lightness = ret.lightness;
	    ret.lightness = lightness * (1 - amount);
	    return ret;
	  } // Euclidean distance of colors in an arbitrary color space


	  distance(color, space = "lab") {
	    color = Color$1$1.get(color);
	    space = Color$1$1.space(space);
	    let coords1 = this[space.id];
	    let coords2 = color[space.id];
	    return Math.sqrt(coords1.reduce((a, c, i) => {
	      if (isNaN(c) || isNaN(coords2[i])) {
	        return a;
	      }

	      return a + (coords2[i] - c) ** 2;
	    }, 0));
	  }

	  deltaE(color, o = {}) {
	    if (isString(o)) {
	      o = {
	        method: o
	      };
	    }

	    let {
	      method = Color$1$1.defaults.deltaE,
	      ...rest
	    } = o;
	    color = Color$1$1.get(color);

	    if (this["deltaE" + method]) {
	      return this["deltaE" + method](color, rest);
	    }

	    return this.deltaE76(color);
	  } // 1976 DeltaE. 2.3 is the JND


	  deltaE76(color) {
	    return this.distance(color, "lab");
	  } // Relative luminance


	  get luminance() {
	    return this.xyz.Y;
	  }

	  set luminance(value) {
	    this.xyz.Y = value;
	  } // WCAG 2.0 contrast https://www.w3.org/TR/WCAG20-TECHS/G18.html


	  contrast(color) {
	    color = Color$1$1.get(color);
	    let L1 = this.luminance;
	    let L2 = color.luminance;

	    if (L2 > L1) {
	      [L1, L2] = [L2, L1];
	    }

	    return (L1 + .05) / (L2 + .05);
	  } // Chromaticity coordinates


	  get uv() {
	    let [X, Y, Z] = this.xyz;
	    let denom = X + 15 * Y + 3 * Z;
	    return [4 * X / denom, 9 * Y / denom];
	  }

	  get xy() {
	    let [X, Y, Z] = this.xyz;
	    let sum = X + Y + Z;
	    return [X / sum, Y / sum];
	  } // no setters, as lightness information is lost
	  // when converting color to chromaticity
	  // Get formatted coords


	  getCoords({
	    inGamut,
	    precision = Color$1$1.defaults.precision
	  } = {}) {
	    let coords = this.coords;

	    if (inGamut && !this.inGamut()) {
	      coords = this.toGamut(inGamut === true ? undefined : inGamut).coords;
	    }

	    if (precision !== undefined && precision !== null) {
	      let bounds = this.space.coords ? Object.values(this.space.coords) : [];
	      coords = coords.map((n, i) => toPrecision(n, precision, bounds[i]));
	    }

	    return coords;
	  }
	  /**
	   * @return {Boolean} Is the color in gamut?
	   */


	  inGamut(space = this.space, options) {
	    space = Color$1$1.space(space);
	    return Color$1$1.inGamut(space, this[space.id], options);
	  }

	  static inGamut(space, coords, {
	    epsilon = ε
	  } = {}) {
	    space = Color$1$1.space(space);

	    if (space.inGamut) {
	      return space.inGamut(coords);
	    } else {
	      if (!space.coords) {
	        return true;
	      } // No color-space specific inGamut() function, just check if coords are within reference range


	      let bounds = Object.values(space.coords);
	      return coords.every((c, i) => {
	        if (Number.isNaN(c)) {
	          return true;
	        }

	        let [min, max] = bounds[i];
	        return (min === undefined || c >= min - epsilon) && (max === undefined || c <= max + epsilon);
	      });
	    }
	  }
	  /**
	   * Force coordinates in gamut of a certain color space and return the result
	   * @param {Object} options
	   * @param {string} options.method - How to force into gamut.
	   *        If "clip", coordinates are just clipped to their reference range.
	   *        If in the form [colorSpaceId].[coordName], that coordinate is reduced
	   *        until the color is in gamut. Please note that this may produce nonsensical
	   *        results for certain coordinates (e.g. hue) or infinite loops if reducing the coordinate never brings the color in gamut.
	   * @param {ColorSpace|string} options.space - The space whose gamut we want to map to
	   * @param {boolean} options.inPlace - If true, modify the current color, otherwise return a new one.
	   */


	  toGamut({
	    method = Color$1$1.defaults.gamutMapping,
	    space = this.space,
	    inPlace
	  } = {}) {
	    if (isString(arguments[0])) {
	      space = arguments[0];
	    }

	    space = Color$1$1.space(space);

	    if (this.inGamut(space, {
	      epsilon: 0
	    })) {
	      return this;
	    } // 3 spaces:
	    // this.space: current color space
	    // space: space whose gamut we are mapping to
	    // mapSpace: space with the coord we're reducing


	    let color = this.to(space);

	    if (method.indexOf(".") > 0 && !this.inGamut(space)) {
	      let clipped = color.toGamut({
	        method: "clip",
	        space
	      }); // distance of original color from gamut boundary

	      let base_error = this.deltaE(clipped, {
	        method: "2000"
	      }); // console.log(base_error);

	      if (this.deltaE(clipped, {
	        method: "2000"
	      }) > 2.3) {
	        // Reduce a coordinate of a certain color space until the color is in gamut
	        let [mapSpace, coordName] = parseCoord(method);
	        let mappedColor = color.to(mapSpace);
	        let bounds = mapSpace.coords[coordName];
	        let min = bounds[0];
	        let ε = .001; // for deltaE

	        let low = min;
	        let high = mappedColor[coordName]; // distance of current estimate from original color

	        let error = color.deltaE(mappedColor, {
	          method: "2000"
	        }); // let i = 0;

	        while (high - low > ε && error < base_error) {
	          let clipped = mappedColor.toGamut({
	            space,
	            method: "clip"
	          });
	          let deltaE = mappedColor.deltaE(clipped, {
	            method: "2000"
	          });
	          error = color.deltaE(mappedColor, {
	            method: "2000"
	          });

	          if (deltaE - 2 < ε) {
	            low = mappedColor[coordName]; // console.log(++i, "in", mappedColor.chroma, mappedColor.srgb, error);
	          } else {
	            // console.log(++i, "out", mappedColor.chroma, mappedColor.srgb, clipped.srgb, deltaE, error);
	            if (Math.abs(deltaE - 2) < ε) {
	              // We've found the boundary
	              break;
	            }

	            high = mappedColor[coordName];
	          }

	          mappedColor[coordName] = (high + low) / 2;
	        }

	        color = mappedColor.to(space);
	      } else {
	        color = clipped;
	      }
	    }

	    if (method === "clip" // Dumb coord clipping
	    // finish off smarter gamut mapping with clip to get rid of ε, see #17
	    || !color.inGamut(space, {
	      epsilon: 0
	    })) {
	      let bounds = Object.values(space.coords);
	      color.coords = color.coords.map((c, i) => {
	        let [min, max] = bounds[i];

	        if (min !== undefined) {
	          c = Math.max(min, c);
	        }

	        if (max !== undefined) {
	          c = Math.min(c, max);
	        }

	        return c;
	      });
	    }

	    if (space.id !== this.spaceId) {
	      color = color.to(this.space);
	    }

	    if (inPlace) {
	      this.coords = color.coords;
	      return this;
	    } else {
	      return color;
	    }
	  }

	  clone() {
	    return new Color$1$1(this.spaceId, this.coords, this.alpha);
	  }
	  /**
	   * Convert to color space and return a new color
	   * @param {Object|string} space - Color space object or id
	   * @param {Object} options
	   * @param {boolean} options.inGamut - Whether to force resulting color in gamut
	   * @returns {Color}
	   */


	  to(space, {
	    inGamut
	  } = {}) {
	    space = Color$1$1.space(space);
	    let id = space.id;
	    let color = new Color$1$1(id, this[id], this.alpha);

	    if (inGamut) {
	      color.toGamut({
	        inPlace: true
	      });
	    }

	    return color;
	  }

	  toJSON() {
	    return {
	      spaceId: this.spaceId,
	      coords: this.coords,
	      alpha: this.alpha
	    };
	  }
	  /**
	   * Generic toString() method, outputs a color(spaceId ...coords) function
	   * @param {Object} options
	   * @param {number} options.precision - Significant digits
	   * @param {boolean} options.commas - Whether to use commas to separate arguments or spaces (and a slash for alpha) [default: false]
	   * @param {Function|String|Array} options.format - If function, maps all coordinates. Keywords tap to colorspace-specific formats (e.g. "hex")
	   * @param {boolean} options.inGamut - Adjust coordinates to fit in gamut first? [default: false]
	   * @param {string} options.name - Function name [default: color]
	   */


	  toString({
	    precision = Color$1$1.defaults.precision,
	    format,
	    commas,
	    inGamut,
	    name = "color",
	    fallback
	  } = {}) {
	    let strAlpha = this.alpha < 1 ? ` ${commas ? "," : "/"} ${this.alpha}` : "";
	    let coords = this.getCoords({
	      inGamut,
	      precision
	    }); // Convert NaN to zeros to have a chance at a valid CSS color
	    // Also convert -0 to 0

	    coords = coords.map(c => c ? c : 0);

	    if (isString(format)) {
	      if (format === "%") {
	        let maximumSignificantDigits = precision;

	        if (!Number.isInteger(precision) || precision > 21) {
	          maximumSignificantDigits = 21;
	        }

	        format = c => c.toLocaleString("en-US", {
	          style: "percent",
	          maximumSignificantDigits
	        });
	      }
	    }

	    if (typeof format === "function") {
	      coords = coords.map(format);
	    }

	    let args = [...coords];

	    if (name === "color") {
	      // If output is a color() function, add colorspace id as first argument
	      args.unshift(this.space ? this.space.cssId || this.space.id : "XYZ");
	    }

	    let ret = `${name}(${args.join(commas ? ", " : " ")}${strAlpha})`;

	    if (fallback) {
	      // Return a CSS string that's actually supported by the current browser
	      // Return as a String object, so we can also hang the color object on it
	      // in case it's different than this. That way third party code can use that
	      // for e.g. computing text color, indicating out of gamut etc
	      if (!hasDOM || !self.CSS || CSS.supports("color", ret)) {
	        ret = new String(ret);
	        ret.color = this;
	        return ret;
	      }

	      let fallbacks = Array.isArray(fallback) ? fallback.slice() : Color$1$1.defaults.fallbackSpaces;

	      for (let i = 0, fallbackSpace; fallbackSpace = fallbacks[i]; i++) {
	        if (Color$1$1.spaces[fallbackSpace]) {
	          let color = this.to(fallbackSpace);
	          ret = color.toString({
	            precision
	          });

	          if (CSS.supports("color", ret)) {
	            ret = new String(ret);
	            ret.color = color;
	            return ret;
	          } else if (fallbacks === Color$1$1.defaults.fallbackSpaces) {
	            // Drop this space from the default fallbacks since it's not supported
	            fallbacks.splice(i, 1);
	            i--;
	          }
	        }
	      } // None of the fallbacks worked, return in the most conservative form possible


	      let color = this.to("srgb");
	      ret = new String(color.toString({
	        commas: true
	      }));
	      ret.color = color;
	    }

	    return ret;
	  }

	  equals(color) {
	    color = Color$1$1.get(color);
	    return this.spaceId === color.spaceId && this.alpha === color.alpha && this.coords.every((c, i) => c === color.coords[i]);
	  } // Adapt XYZ from white point W1 to W2


	  static chromaticAdaptation(W1, W2, XYZ, options = {}) {
	    W1 = W1 || Color$1$1.whites.D50;
	    W2 = W2 || Color$1$1.whites.D50;

	    if (W1 === W2) {
	      return XYZ;
	    }

	    let env = {
	      W1,
	      W2,
	      XYZ,
	      options
	    };
	    Color$1$1.hooks.run("chromatic-adaptation-start", env);

	    if (!env.M) {
	      if (env.W1 === Color$1$1.whites.D65 && env.W2 === Color$1$1.whites.D50) {
	        // Linear Bradford CAT
	        env.M = [[1.0478112, 0.0228866, -0.0501270], [0.0295424, 0.9904844, -0.0170491], [-0.0092345, 0.0150436, 0.7521316]];
	      } else if (env.W1 === Color$1$1.whites.D50 && env.W2 === Color$1$1.whites.D65) {
	        env.M = [[0.9555766, -0.0230393, 0.0631636], [-0.0282895, 1.0099416, 0.0210077], [0.0122982, -0.0204830, 1.3299098]];
	      }
	    }

	    Color$1$1.hooks.run("chromatic-adaptation-end", env);

	    if (env.M) {
	      return multiplyMatrices(env.M, env.XYZ);
	    } else {
	      throw new TypeError("Only Bradford CAT with white points D50 and D65 supported for now.");
	    }
	  } // CSS color to Color object


	  static parse(str) {
	    let env = {
	      str
	    };
	    Color$1$1.hooks.run("parse-start", env);

	    if (env.color) {
	      return env.color;
	    }

	    env.parsed = Color$1$1.parseFunction(env.str);
	    Color$1$1.hooks.run("parse-function-start", env);

	    if (env.color) {
	      return env.color;
	    } // Try colorspace-specific parsing


	    for (let space of Object.values(Color$1$1.spaces)) {
	      if (space.parse) {
	        let color = space.parse(env.str, env.parsed);

	        if (color) {
	          return color;
	        }
	      }
	    }

	    let name = env.parsed && env.parsed.name;

	    if (!/^color|^rgb/.test(name) && hasDOM && document.head) {
	      // Use browser to parse when a DOM is available
	      // we mainly use this for color names right now if keywords.js is not included
	      // and for future-proofing
	      let previousColor = document.head.style.color;
	      document.head.style.color = "";
	      document.head.style.color = str;

	      if (document.head.style.color !== previousColor) {
	        let computed = getComputedStyle(document.head).color;
	        document.head.style.color = previousColor;

	        if (computed) {
	          str = computed;
	          env.parsed = Color$1$1.parseFunction(computed);
	          name = env.parsed.name;
	        }
	      }
	    }

	    if (env.parsed) {
	      // It's a function
	      if (name === "rgb" || name === "rgba") {
	        let args = env.parsed.args.map((c, i) => i < 3 && !c.percentage ? c / 255 : +c);
	        return {
	          spaceId: "srgb",
	          coords: args.slice(0, 3),
	          alpha: args[3]
	        };
	      } else if (name === "color") {
	        let spaceId = env.parsed.args.shift().toLowerCase();
	        let space = Object.values(Color$1$1.spaces).find(space => (space.cssId || space.id) === spaceId);

	        if (space) {
	          // From https://drafts.csswg.org/css-color-4/#color-function
	          // If more <number>s or <percentage>s are provided than parameters that the colorspace takes, the excess <number>s at the end are ignored.
	          // If less <number>s or <percentage>s are provided than parameters that the colorspace takes, the missing parameters default to 0. (This is particularly convenient for multichannel printers where the additional inks are spot colors or varnishes that most colors on the page won’t use.)
	          let argCount = Object.keys(space.coords).length;
	          let alpha = env.parsed.rawArgs.indexOf("/") > 0 ? env.parsed.args.pop() : 1;
	          let coords = Array(argCount).fill(0);
	          coords.forEach((_, i) => coords[i] = env.parsed.args[i] || 0);
	          return {
	            spaceId: space.id,
	            coords,
	            alpha
	          };
	        } else {
	          throw new TypeError(`Color space ${spaceId} not found. Missing a plugin?`);
	        }
	      }
	    }

	    throw new TypeError(`Could not parse ${str} as a color. Missing a plugin?`);
	  }
	  /**
	   * Parse a CSS function, regardless of its name and arguments
	   * @param String str String to parse
	   * @return Object An object with {name, args, rawArgs}
	   */


	  static parseFunction(str) {
	    if (!str) {
	      return;
	    }

	    str = str.trim();
	    const isFunctionRegex = /^([a-z]+)\((.+?)\)$/i;
	    const isNumberRegex = /^-?[\d.]+$/;
	    let parts = str.match(isFunctionRegex);

	    if (parts) {
	      // It is a function, parse args
	      let args = parts[2].match(/([-\w.]+(?:%|deg)?)/g);
	      args = args.map(arg => {
	        if (/%$/.test(arg)) {
	          // Convert percentages to 0-1 numbers
	          let n = new Number(+arg.slice(0, -1) / 100);
	          n.percentage = true;
	          return n;
	        } else if (/deg$/.test(arg)) {
	          // Drop deg from degrees and convert to number
	          let n = new Number(+arg.slice(0, -3));
	          n.deg = true;
	          return n;
	        } else if (isNumberRegex.test(arg)) {
	          // Convert numerical args to numbers
	          return +arg;
	        } // Return everything else as-is


	        return arg;
	      });
	      return {
	        name: parts[1].toLowerCase(),
	        rawName: parts[1],
	        rawArgs: parts[2],
	        // An argument could be (as of css-color-4):
	        // a number, percentage, degrees (hue), ident (in color())
	        args
	      };
	    }
	  } // One-off convert between color spaces


	  static convert(coords, fromSpace, toSpace) {
	    fromSpace = Color$1$1.space(fromSpace);
	    toSpace = Color$1$1.space(toSpace);

	    if (fromSpace === toSpace) {
	      // Same space, no change needed
	      return coords;
	    } // Convert NaN to 0, which seems to be valid in every coordinate of every color space


	    coords = coords.map(c => Number.isNaN(c) ? 0 : c);
	    let fromId = fromSpace.id;
	    let toId = toSpace.id; // Do we have a more specific conversion function?
	    // Avoids round-tripping to & from XYZ

	    if (toSpace.from && toSpace.from[fromId]) {
	      // No white point adaptation, we assume the custom function takes care of it
	      return toSpace.from[fromId](coords);
	    }

	    if (fromSpace.to && fromSpace.to[toId]) {
	      // No white point adaptation, we assume the custom function takes care of it
	      return fromSpace.to[toId](coords);
	    }

	    let XYZ = fromSpace.toXYZ(coords);

	    if (toSpace.white !== fromSpace.white) {
	      // Different white point, perform white point adaptation
	      XYZ = Color$1$1.chromaticAdaptation(fromSpace.white, toSpace.white, XYZ);
	    }

	    return toSpace.fromXYZ(XYZ);
	  }
	  /**
	   * Get a color from the argument passed
	   * Basically gets us the same result as new Color(color) but doesn't clone an existing color object
	   */


	  static get(color, ...args) {
	    if (color instanceof Color$1$1) {
	      return color;
	    }

	    return new Color$1$1(color, ...args);
	  }
	  /**
	   * Return a color space object from an id or color space object
	   * Mainly used internally, so that functions can easily accept either
	   */


	  static space(space) {
	    let type$1 = type(space);

	    if (type$1 === "string") {
	      // It's a color space id
	      let ret = Color$1$1.spaces[space.toLowerCase()];

	      if (!ret) {
	        throw new TypeError(`No color space found with id = "${space}"`);
	      }

	      return ret;
	    } else if (space && type$1 === "object") {
	      return space;
	    }

	    throw new TypeError(`${space} is not a valid color space`);
	  } // Define a new color space


	  static defineSpace({
	    id,
	    inherits
	  }) {
	    let space = Color$1$1.spaces[id] = arguments[0];

	    if (inherits) {
	      const except = ["id", "parse", "instance", "properties"];
	      let parent = Color$1$1.spaces[inherits];

	      for (let prop in parent) {
	        if (!except.includes(prop) && !(prop in space)) {
	          copyDescriptor(space, parent, prop);
	        }
	      }
	    }

	    let coords = space.coords;

	    if (space.properties) {
	      extend(Color$1$1.prototype, space.properties);
	    }

	    if (!space.fromXYZ && !space.toXYZ) {
	      // Using a different connection space, define from/to XYZ functions based on that
	      let connectionSpace; // What are we using as a connection space?

	      if (space.from && space.to) {
	        let from = new Set(Object.keys(space.from));
	        let to = new Set(Object.keys(space.to)); // Find spaces we can both convert to and from

	        let candidates = [...from].filter(id => {
	          if (to.has(id)) {
	            // Of those, only keep those that have fromXYZ and toXYZ
	            let space = Color$1$1.spaces[id];
	            return space && space.fromXYZ && space.toXYZ;
	          }
	        });

	        if (candidates.length > 0) {
	          // Great, we found connection spaces! Pick the first one
	          connectionSpace = Color$1$1.spaces[candidates[0]];
	        }
	      }

	      if (connectionSpace) {
	        // Define from/to XYZ functions based on the connection space
	        Object.assign(space, {
	          // ISSUE do we need white point adaptation here?
	          fromXYZ(XYZ) {
	            let newCoords = connectionSpace.fromXYZ(XYZ);
	            return this.from[connectionSpace.id](newCoords);
	          },

	          toXYZ(coords) {
	            let newCoords = this.to[connectionSpace.id](coords);
	            return connectionSpace.toXYZ(newCoords);
	          }

	        });
	      } else {
	        throw new ReferenceError(`No connection space found for ${space.name}.`);
	      }
	    }

	    let coordNames = Object.keys(coords); // Define getters and setters for color[spaceId]
	    // e.g. color.lch on *any* color gives us the lch coords

	    Object.defineProperty(Color$1$1.prototype, id, {
	      // Convert coords to coords in another colorspace and return them
	      // Source colorspace: this.spaceId
	      // Target colorspace: id
	      get() {
	        let ret = Color$1$1.convert(this.coords, this.spaceId, id);

	        if (!self.Proxy) {
	          return ret;
	        } // Enable color.spaceId.coordName syntax


	        return new Proxy(ret, {
	          has: (obj, property) => {
	            return coordNames.includes(property) || Reflect.has(obj, property);
	          },
	          get: (obj, property, receiver) => {
	            let i = coordNames.indexOf(property);

	            if (i > -1) {
	              return obj[i];
	            }

	            return Reflect.get(obj, property, receiver);
	          },
	          set: (obj, property, value, receiver) => {
	            let i = coordNames.indexOf(property);

	            if (property > -1) {
	              // Is property a numerical index?
	              i = property; // next if will take care of modifying the color
	            }

	            if (i > -1) {
	              obj[i] = value; // Update color.coords

	              this.coords = Color$1$1.convert(obj, id, this.spaceId);
	              return true;
	            }

	            return Reflect.set(obj, property, value, receiver);
	          }
	        });
	      },

	      // Convert coords in another colorspace to internal coords and set them
	      // Target colorspace: this.spaceId
	      // Source colorspace: id
	      set(coords) {
	        this.coords = Color$1$1.convert(coords, id, this.spaceId);
	      },

	      configurable: true,
	      enumerable: true
	    });
	    return space;
	  } // Define a shortcut property, e.g. color.lightness instead of color.lch.lightness
	  // Shorcut is looked up on Color.shortcuts at calling time
	  // If `long` is provided, it's added to Color.shortcuts as well, otherwise it's assumed to be already there


	  static defineShortcut(prop, obj = Color$1$1.prototype, long) {
	    if (long) {
	      Color$1$1.shortcuts[prop] = long;
	    }

	    Object.defineProperty(obj, prop, {
	      get() {
	        return value(this, Color$1$1.shortcuts[prop]);
	      },

	      set(value$1) {
	        return value(this, Color$1$1.shortcuts[prop], value$1);
	      },

	      configurable: true,
	      enumerable: true
	    });
	  } // Define static versions of all instance methods


	  static statify(names = []) {
	    names = names || Object.getOwnPropertyNames(Color$1$1.prototype);

	    for (let prop of Object.getOwnPropertyNames(Color$1$1.prototype)) {
	      let descriptor = Object.getOwnPropertyDescriptor(Color$1$1.prototype, prop);

	      if (descriptor.get || descriptor.set) {
	        continue; // avoid accessors
	      }

	      let method = descriptor.value;

	      if (typeof method === "function" && !(prop in Color$1$1)) {
	        // We have a function, and no static version already
	        Color$1$1[prop] = function (color, ...args) {
	          color = Color$1$1.get(color);
	          return color[prop](...args);
	        };
	      }
	    }
	  }

	}

	Object.assign(Color$1$1, {
	  util,
	  hooks: new Hooks(),
	  whites: {
	    D50: [0.96422, 1.00000, 0.82521],
	    D65: [0.95047, 1.00000, 1.08883]
	  },
	  spaces: {},
	  // These will be available as getters and setters on EVERY color instance.
	  // They refer to LCH by default, but can be set to anything
	  // and you can add more by calling Color.defineShortcut()
	  shortcuts: {
	    "lightness": "lch.lightness",
	    "chroma": "lch.chroma",
	    "hue": "lch.hue"
	  },
	  // Global defaults one may want to configure
	  defaults: {
	    gamutMapping: "lch.chroma",
	    precision: 5,
	    deltaE: "76",
	    // Default deltaE method
	    fallbackSpaces: ["p3", "srgb"]
	  }
	});
	Color$1$1.defineSpace({
	  id: "xyz",
	  name: "XYZ",
	  coords: {
	    X: [],
	    Y: [],
	    Z: []
	  },
	  white: Color$1$1.whites.D50,
	  inGamut: coords => true,
	  toXYZ: coords => coords,
	  fromXYZ: coords => coords
	});

	for (let prop in Color$1$1.shortcuts) {
	  Color$1$1.defineShortcut(prop);
	} // Make static methods for all instance methods


	Color$1$1.statify(); // Color.DEBUGGING = true;

	Color$1$1.defineSpace({
	  id: "lab",
	  name: "Lab",
	  coords: {
	    L: [0, 100],
	    a: [-100, 100],
	    b: [-100, 100]
	  },
	  inGamut: coords => true,
	  // Assuming XYZ is relative to D50, convert to CIE Lab
	  // from CIE standard, which now defines these as a rational fraction
	  white: Color$1$1.whites.D50,
	  ε: 216 / 24389,
	  // 6^3/29^3
	  κ: 24389 / 27,

	  // 29^3/3^3
	  fromXYZ(XYZ) {
	    const {
	      κ,
	      ε,
	      white
	    } = this; // compute xyz, which is XYZ scaled relative to reference white

	    let xyz = XYZ.map((value, i) => value / white[i]); // now compute f

	    let f = xyz.map(value => value > ε ? Math.cbrt(value) : (κ * value + 16) / 116);
	    return [116 * f[1] - 16, // L
	    500 * (f[0] - f[1]), // a
	    200 * (f[1] - f[2]) // b
	    ];
	  },

	  toXYZ(Lab) {
	    // Convert Lab to D50-adapted XYZ
	    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
	    const {
	      κ,
	      ε,
	      white
	    } = this; // compute f, starting with the luminance-related term

	    let f = [];
	    f[1] = (Lab[0] + 16) / 116;
	    f[0] = Lab[1] / 500 + f[1];
	    f[2] = f[1] - Lab[2] / 200; // compute xyz

	    var xyz = [Math.pow(f[0], 3) > ε ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ, Lab[0] > κ * ε ? Math.pow((Lab[0] + 16) / 116, 3) : Lab[0] / κ, Math.pow(f[2], 3) > ε ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ]; // Compute XYZ by scaling xyz by reference white

	    return xyz.map((value, i) => value * white[i]);
	  },

	  parse(str, parsed = Color$1$1.parseFunction(str)) {
	    if (parsed && parsed.name === "lab") {
	      let L = parsed.args[0]; // Percentages in lab() don't translate to a 0-1 range, but a 0-100 range

	      if (L.percentage) {
	        parsed.args[0] = L * 100;
	      }

	      return {
	        spaceId: "lab",
	        coords: parsed.args.slice(0, 3),
	        alpha: parsed.args.slice(3)[0]
	      };
	    }
	  },

	  instance: {
	    toString({
	      format,
	      ...rest
	    } = {}) {
	      if (!format) {
	        format = (c, i) => i === 0 ? c + "%" : c;
	      }

	      return Color$1$1.prototype.toString.call(this, {
	        name: "lab",
	        format,
	        ...rest
	      });
	    }

	  }
	});
	const range = [0, 360];
	range.isAngle = true;

	function constrain(angle) {
	  return (angle % 360 + 360) % 360;
	}

	function adjust(arc, angles) {
	  if (arc === "raw") {
	    return angles;
	  }

	  let [a1, a2] = angles.map(constrain);
	  let angleDiff = a2 - a1;

	  if (arc === "increasing") {
	    if (angleDiff < 0) {
	      a2 += 360;
	    }
	  } else if (arc === "decreasing") {
	    if (angleDiff > 0) {
	      a1 += 360;
	    }
	  } else if (arc === "longer") {
	    if (-180 < angleDiff && angleDiff < 180) {
	      if (angleDiff > 0) {
	        a2 += 360;
	      } else {
	        a1 += 360;
	      }
	    }
	  } else if (arc === "shorter") {
	    if (angleDiff > 180) {
	      a1 += 360;
	    } else if (angleDiff < -180) {
	      a2 += 360;
	    }
	  }

	  return [a1, a2];
	}

	Color$1$1.defineSpace({
	  id: "lch",
	  name: "LCH",
	  coords: {
	    lightness: [0, 100],
	    chroma: [0, 150],
	    hue: range
	  },
	  inGamut: coords => true,
	  white: Color$1$1.whites.D50,
	  from: {
	    lab(Lab) {
	      // Convert to polar form
	      let [L, a, b] = Lab;
	      let hue;
	      const ε = 0.0005;

	      if (Math.abs(a) < ε && Math.abs(b) < ε) {
	        hue = NaN;
	      } else {
	        hue = Math.atan2(b, a) * 180 / Math.PI;
	      }

	      return [L, // L is still L
	      Math.sqrt(a ** 2 + b ** 2), // Chroma
	      constrain(hue) // Hue, in degrees [0 to 360)
	      ];
	    }

	  },
	  to: {
	    lab(LCH) {
	      // Convert from polar form
	      let [Lightness, Chroma, Hue] = LCH; // Clamp any negative Chroma

	      if (Chroma < 0) {
	        Chroma = 0;
	      } // Deal with NaN Hue


	      if (isNaN(Hue)) {
	        Hue = 0;
	      }

	      return [Lightness, // L is still L
	      Chroma * Math.cos(Hue * Math.PI / 180), // a
	      Chroma * Math.sin(Hue * Math.PI / 180) // b
	      ];
	    }

	  },

	  parse(str, parsed = Color$1$1.parseFunction(str)) {
	    if (parsed && parsed.name === "lch") {
	      let L = parsed.args[0]; // Percentages in lch() don't translate to a 0-1 range, but a 0-100 range

	      if (L.percentage) {
	        parsed.args[0] = L * 100;
	      }

	      return {
	        spaceId: "lch",
	        coords: parsed.args.slice(0, 3),
	        alpha: parsed.args.slice(3)[0]
	      };
	    }
	  },

	  instance: {
	    toString({
	      format,
	      ...rest
	    } = {}) {
	      if (!format) {
	        format = (c, i) => i === 0 ? c + "%" : c;
	      }

	      return Color$1$1.prototype.toString.call(this, {
	        name: "lch",
	        format,
	        ...rest
	      });
	    }

	  }
	});
	Color$1$1.defineSpace({
	  id: "srgb",
	  name: "sRGB",
	  coords: {
	    red: [0, 1],
	    green: [0, 1],
	    blue: [0, 1]
	  },
	  white: Color$1$1.whites.D65,

	  // convert an array of sRGB values in the range 0.0 - 1.0
	  // to linear light (un-companded) form.
	  // https://en.wikipedia.org/wiki/SRGB
	  toLinear(RGB) {
	    return RGB.map(function (val) {
	      if (val < 0.04045) {
	        return val / 12.92;
	      }

	      return Math.pow((val + 0.055) / 1.055, 2.4);
	    });
	  },

	  // convert an array of linear-light sRGB values in the range 0.0-1.0
	  // to gamma corrected form
	  // https://en.wikipedia.org/wiki/SRGB
	  toGamma(RGB) {
	    return RGB.map(function (val) {
	      if (val > 0.0031308) {
	        return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
	      }

	      return 12.92 * val;
	    });
	  },

	  toXYZ_M: [[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]],
	  fromXYZ_M: [[3.2404542, -1.5371385, -0.4985314], [-0.9692660, 1.8760108, 0.0415560], [0.0556434, -0.2040259, 1.0572252]],

	  // convert an array of sRGB values to CIE XYZ
	  // using sRGB's own white, D65 (no chromatic adaptation)
	  // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
	  // also
	  // https://www.image-engineering.de/library/technotes/958-how-to-convert-between-srgb-and-ciexyz
	  toXYZ(rgb) {
	    rgb = this.toLinear(rgb);
	    return multiplyMatrices(this.toXYZ_M, rgb);
	  },

	  fromXYZ(XYZ) {
	    return this.toGamma(multiplyMatrices(this.fromXYZ_M, XYZ));
	  },

	  // Properties added to Color.prototype
	  properties: {
	    toHex({
	      alpha = true,
	      // include alpha in hex?
	      collapse = true // collapse to 3-4 digit hex when possible?

	    } = {}) {
	      let coords = this.to("srgb", {
	        inGamut: true
	      }).coords;

	      if (this.alpha < 1 && alpha) {
	        coords.push(this.alpha);
	      }

	      coords = coords.map(c => Math.round(c * 255));
	      let collapsible = collapse && coords.every(c => c % 17 === 0);
	      let hex = coords.map(c => {
	        if (collapsible) {
	          return (c / 17).toString(16);
	        }

	        return c.toString(16).padStart(2, "0");
	      }).join("");
	      return "#" + hex;
	    },

	    get hex() {
	      return this.toHex();
	    }

	  },
	  // Properties present only on sRGB colors
	  instance: {
	    toString({
	      inGamut = true,
	      commas,
	      format = "%",
	      ...rest
	    } = {}) {
	      if (format === 255) {
	        format = c => c * 255;
	      } else if (format === "hex") {
	        return this.toHex(arguments[0]);
	      }

	      return Color$1$1.prototype.toString.call(this, {
	        inGamut,
	        commas,
	        format,
	        name: "rgb" + (commas && this.alpha < 1 ? "a" : ""),
	        ...rest
	      });
	    }

	  },

	  parseHex(str) {
	    if (str.length <= 5) {
	      // #rgb or #rgba, duplicate digits
	      str = str.replace(/[a-f0-9]/gi, "$&$&");
	    }

	    let rgba = [];
	    str.replace(/[a-f0-9]{2}/gi, component => {
	      rgba.push(parseInt(component, 16) / 255);
	    });
	    return {
	      spaceId: "srgb",
	      coords: rgba.slice(0, 3),
	      alpha: rgba.slice(3)[0]
	    };
	  }

	});
	Color$1$1.hooks.add("parse-start", env => {
	  let str = env.str;

	  if (/^#([a-f0-9]{3,4}){1,2}$/i.test(str)) {
	    env.color = Color$1$1.spaces.srgb.parseHex(str);
	  }
	});
	Color$1$1.defineSpace({
	  id: "hsl",
	  name: "HSL",
	  coords: {
	    hue: range,
	    saturation: [0, 100],
	    lightness: [0, 100]
	  },

	  inGamut(coords) {
	    let rgb = this.to.srgb(coords);
	    return Color$1$1.inGamut("srgb", rgb);
	  },

	  white: Color$1$1.whites.D65,
	  // Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB
	  from: {
	    srgb(rgb) {
	      rgb = rgb.map(c => c * 100);
	      let max = Math.max.apply(Math, rgb);
	      let min = Math.min.apply(Math, rgb);
	      let [r, g, b] = rgb;
	      let [h, s, l] = [NaN, 0, (min + max) / 2];
	      let d = max - min;

	      if (d !== 0) {
	        s = d * 100 / (100 - Math.abs(2 * l - 100));

	        switch (max) {
	          case r:
	            h = (g - b) / d + (g < b ? 6 : 0);
	            break;

	          case g:
	            h = (b - r) / d + 2;
	            break;

	          case b:
	            h = (r - g) / d + 4;
	        }

	        h = h * 60;
	      }

	      return [h, s, l];
	    }

	  },
	  // Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
	  to: {
	    srgb(hsl) {
	      let [h, s, l] = hsl;
	      h = h % 360;

	      if (h < 0) {
	        h += 360;
	      }

	      s /= 100;
	      l /= 100;

	      function f(n) {
	        let k = (n + h / 30) % 12;
	        let a = s * Math.min(l, 1 - l);
	        return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
	      }

	      return [f(0), f(8), f(4)];
	    }

	  },

	  parse(str, parsed = Color$1$1.parseFunction(str)) {
	    if (parsed && /^hsla?$/.test(parsed.name)) {
	      let hsl = parsed.args; // percentages are converted to [0, 1] by parseFunction

	      hsl[1] *= 100;
	      hsl[2] *= 100;
	      return {
	        spaceId: "hsl",
	        coords: hsl.slice(0, 3),
	        alpha: hsl[3]
	      };
	    }
	  },

	  instance: {
	    toString({
	      precision,
	      commas,
	      format,
	      inGamut,
	      ...rest
	    } = {}) {
	      if (!format) {
	        format = (c, i) => i > 0 ? c + "%" : c;
	      }

	      return Color$1$1.prototype.toString.call(this, {
	        inGamut: true,
	        // hsl() out of gamut makes no sense
	        commas,
	        format,
	        name: "hsl" + (commas && this.alpha < 1 ? "a" : ""),
	        ...rest
	      });
	    }

	  }
	}); // The Hue, Whiteness Blackness (HWB) colorspace
	// See https://drafts.csswg.org/css-color-4/#the-hwb-notation
	// Note that, like HSL, calculations are done directly on
	// gamma-corrected sRGB values rather than linearising them first.

	Color$1$1.defineSpace({
	  id: "hwb",
	  name: "HWB",
	  coords: {
	    hue: range,
	    whiteness: [0, 100],
	    blackness: [0, 100]
	  },

	  inGamut(coords) {
	    let rgb = this.to.srgb(coords);
	    return Color$1$1.inGamut("srgb", rgb);
	  },

	  white: Color$1$1.whites.D65,
	  from: {
	    srgb(rgb) {
	      let hsl = Color$1$1.spaces.hsl.from.srgb(rgb);
	      let h = hsl[0]; // calculate white and black

	      let w = Math.min(...rgb);
	      let b = 1 - Math.max(...rgb);
	      w *= 100;
	      b *= 100;
	      return [h, w, b];
	    },

	    hsv(hsv) {
	      let [h, s, v] = hsv;
	      return [h, v * (100 - s) / 100, 100 - v];
	    },

	    hsl(hsl) {
	      let hsv = Color$1$1.spaces.hsv.from.hsl(hsl);
	      return this.hsv(hsv);
	    }

	  },
	  to: {
	    srgb(hwb) {
	      let [h, w, b] = hwb; // Now convert percentages to [0..1]

	      w /= 100;
	      b /= 100; // Achromatic check (white plus black >= 1)

	      let sum = w + b;

	      if (sum >= 1) {
	        let gray = w / sum;
	        return [gray, gray, gray];
	      } // From https://drafts.csswg.org/css-color-4/#hwb-to-rgb


	      let rgb = Color$1$1.spaces.hsl.to.srgb([h, 100, 50]);

	      for (var i = 0; i < 3; i++) {
	        rgb[i] *= 1 - w - b;
	        rgb[i] += w;
	      }

	      return rgb;
	    },

	    hsv(hwb) {
	      let [h, w, b] = hwb; // Now convert percentages to [0..1]

	      w /= 100;
	      b /= 100; // Achromatic check (white plus black >= 1)

	      let sum = w + b;

	      if (sum >= 1) {
	        let gray = w / sum;
	        return [h, 0, gray];
	      }

	      let v = 1 - b;
	      let s = 100 - 100 * w / (100 - b);
	      return [h, s, v * 100];
	    },

	    hsl(hwb) {
	      let hsv = Color$1$1.spaces.hwb.to.hsv(hwb);
	      return Color$1$1.spaces.hsv.to.hsl(hsv);
	    }

	  },

	  parse(str, parsed = Color$1$1.parseFunction(str)) {
	    if (parsed && /^hwba?$/.test(parsed.name)) {
	      let hwb = parsed.args; // white and black percentages are converted to [0, 1] by parseFunction

	      hwb[1] *= 100;
	      hwb[2] *= 100;
	      return {
	        spaceId: "hwb",
	        coords: hwb.slice(0, 3),
	        alpha: hwb[3]
	      };
	    }
	  },

	  instance: {
	    toString({
	      format,
	      commas,
	      inGamut,
	      ...rest
	    } = {}) {
	      if (!format) {
	        format = (c, i) => i > 0 ? c + "%" : c;
	      }

	      return Color$1$1.prototype.toString.call(this, {
	        inGamut: true,
	        // hwb() out of gamut makes no sense
	        commas: false,
	        // never commas
	        format,
	        name: "hwb",
	        ...rest
	      });
	    }

	  }
	}); // The Hue, Whiteness Blackness (HWB) colorspace
	// See https://drafts.csswg.org/css-color-4/#the-hwb-notation
	// Note that, like HSL, calculations are done directly on
	// gamma-corrected sRGB values rather than linearising them first.

	Color$1$1.defineSpace({
	  id: "hsv",
	  name: "HSV",
	  coords: {
	    hue: range,
	    saturation: [0, 100],
	    value: [0, 100]
	  },

	  inGamut(coords) {
	    let hsl = this.to.hsl(coords);
	    return Color$1$1.spaces.hsl.inGamut(hsl);
	  },

	  white: Color$1$1.whites.D65,
	  from: {
	    // https://en.wikipedia.org/wiki/HSL_and_HSV#Interconversion
	    hsl(hsl) {
	      let [h, s, l] = hsl;
	      s /= 100;
	      l /= 100;
	      let v = l + s * Math.min(l, 1 - l);
	      return [h, // h is the same
	      v === 0 ? 0 : 200 * (1 - l / v), // s
	      100 * v];
	    }

	  },
	  to: {
	    // https://en.wikipedia.org/wiki/HSL_and_HSV#Interconversion
	    hsl(hsv) {
	      let [h, s, v] = hsv;
	      s /= 100;
	      v /= 100;
	      let l = 100 * v * (1 - s / 2);
	      return [h, // h is the same
	      l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l];
	    }

	  }
	});
	Color$1$1.defineSpace({
	  inherits: "srgb",
	  id: "p3",
	  name: "P3",
	  cssId: "display-p3",
	  // Gamma correction is the same as sRGB
	  // convert an array of display-p3 values to CIE XYZ
	  // using  D65 (no chromatic adaptation)
	  // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
	  // Functions are the same as sRGB, just with different matrices
	  toXYZ_M: [[0.4865709486482162, 0.26566769316909306, 0.1982172852343625], [0.2289745640697488, 0.6917385218365064, 0.079286914093745], [0.0000000000000000, 0.04511338185890264, 1.043944368900976]],
	  fromXYZ_M: [[2.493496911941425, -0.9313836179191239, -0.40271078445071684], [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577], [0.03584583024378447, -0.07617238926804182, 0.9568845240076872]]
	});
	Color$1$1.defineSpace({
	  inherits: "srgb",
	  id: "a98rgb",
	  name: "Adobe 98 RGB compatible",
	  cssId: "a98-rgb",

	  toLinear(RGB) {
	    return RGB.map(val => Math.pow(Math.abs(val), 563 / 256) * Math.sign(val));
	  },

	  toGamma(RGB) {
	    return RGB.map(val => Math.pow(Math.abs(val), 256 / 563) * Math.sign(val));
	  },

	  // convert an array of linear-light a98-rgb values to CIE XYZ
	  // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
	  // has greater numerical precision than section 4.3.5.3 of
	  // https://www.adobe.com/digitalimag/pdfs/AdobeRGB1998.pdf
	  // but the values below were calculated from first principles
	  // from the chromaticity coordinates of R G B W
	  toXYZ_M: [[0.5766690429101305, 0.1855582379065463, 0.1882286462349947], [0.29734497525053605, 0.6273635662554661, 0.07529145849399788], [0.02703136138641234, 0.07068885253582723, 0.9913375368376388]],
	  fromXYZ_M: [[2.0415879038107465, -0.5650069742788596, -0.34473135077832956], [-0.9692436362808795, 1.8759675015077202, 0.04155505740717557], [0.013444280632031142, -0.11836239223101838, 1.0151749943912054]]
	});
	Color$1$1.defineSpace({
	  inherits: "srgb",
	  id: "prophoto",
	  name: "ProPhoto",
	  cssId: "prophoto-rgb",
	  white: Color$1$1.whites.D50,

	  toLinear(RGB) {
	    // Transfer curve is gamma 1.8 with a small linear portion
	    const Et2 = 16 / 512;
	    return RGB.map(function (val) {
	      if (val <= Et2) {
	        return val / 16;
	      }

	      return Math.pow(val, 1.8);
	    });
	  },

	  toGamma(RGB) {
	    const Et = 1 / 512;
	    return RGB.map(function (val) {
	      if (val >= Et) {
	        return Math.pow(val, 1 / 1.8);
	      }

	      return 16 * val;
	    });
	  },

	  // convert an array of  prophoto-rgb values to CIE XYZ
	  // using  D50 (so no chromatic adaptation needed afterwards)
	  // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
	  toXYZ_M: [[0.7977604896723027, 0.13518583717574031, 0.0313493495815248], [0.2880711282292934, 0.7118432178101014, 0.00008565396060525902], [0.0, 0.0, 0.8251046025104601]],
	  fromXYZ_M: [[1.3457989731028281, -0.25558010007997534, -0.05110628506753401], [-0.5446224939028347, 1.5082327413132781, 0.02053603239147973], [0.0, 0.0, 1.2119675456389454]]
	});
	Color$1$1.defineSpace({
	  inherits: "srgb",
	  id: "rec2020",
	  name: "REC.2020",
	  α: 1.09929682680944,
	  β: 0.018053968510807,

	  toLinear(RGB) {
	    const {
	      α,
	      β
	    } = this;
	    return RGB.map(function (val) {
	      if (val < β * 4.5) {
	        return val / 4.5;
	      }

	      return Math.pow((val + α - 1) / α, 2.4);
	    });
	  },

	  toGamma(RGB) {
	    const {
	      α,
	      β
	    } = this;
	    return RGB.map(function (val) {
	      if (val > β) {
	        return α * Math.pow(val, 1 / 2.4) - (α - 1);
	      }

	      return 4.5 * val;
	    });
	  },

	  // convert an array of linear-light rec2020 values to CIE XYZ
	  // using  D65 (no chromatic adaptation)
	  // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
	  // 0 is actually calculated as  4.994106574466076e-17
	  toXYZ_M: [[0.6369580483012914, 0.14461690358620832, 0.1688809751641721], [0.2627002120112671, 0.6779980715188708, 0.05930171646986196], [0.000000000000000, 0.028072693049087428, 1.060985057710791]],
	  // from ITU-R BT.2124-0 Annex 2 p.3
	  fromXYZ_M: [[1.716651187971268, -0.355670783776392, -0.253366281373660], [-0.666684351832489, 1.616481236634939, 0.0157685458139111], [0.017639857445311, -0.042770613257809, 0.942103121235474]]
	});
	Color$1$1.defineSpace({
	  // Absolute CIE XYZ, with a D65 whitepoint,
	  // as used in most HDR colorspaces as a starting point.
	  // SDR spaces are converted per BT.2048
	  // so that diffuse, media white is 203 cd/m²
	  id: "absxyzd65",
	  name: "Absolute XYZ D65",
	  coords: {
	    Xa: [0, 9504.7],
	    Ya: [0, 10000],
	    Za: [0, 10888.3]
	  },
	  white: Color$1$1.whites.D65,
	  Yw: 203,
	  // absolute luminance of media white
	  inGamut: coords => true,

	  fromXYZ(XYZ) {
	    // First adapt from D50 to D65, with linear Bradford default
	    const W1 = Color$1$1.whites.D50;
	    const W2 = Color$1$1.whites.D65;
	    XYZ = Color$1$1.chromaticAdaptation(W1, W2, XYZ);
	    const {
	      Yw
	    } = this; // Then make XYZ absolute, not relative to media white
	    // Maximum luminance in PQ is 10,000 cd/m²
	    // Relative XYZ has Y=1 for media white

	    return XYZ.map(function (val) {
	      return Math.max(val * Yw, 0);
	    });
	  },

	  toXYZ(AbsXYZ) {
	    // First convert to media-white relative XYZ
	    const {
	      Yw
	    } = this;
	    let XYZ = AbsXYZ.map(function (val) {
	      return Math.max(val / Yw, 0);
	    }); // Then adapt to D50

	    const W1 = Color$1$1.whites.D65;
	    const W2 = Color$1$1.whites.D50;
	    return Color$1$1.chromaticAdaptation(W1, W2, XYZ);
	  }

	});
	Color$1$1.defineSpace({
	  id: "jzazbz",
	  cssid: "Jzazbz",
	  name: "Jzazbz",
	  coords: {
	    Jz: [0, 1],
	    az: [-0.5, 0.5],
	    bz: [-0.5, 0.5]
	  },
	  inGamut: coords => true,
	  // Note that XYZ is relative to D65
	  white: Color$1$1.whites.D65,
	  b: 1.15,
	  g: 0.66,
	  n: 2610 / 2 ** 14,
	  ninv: 2 ** 14 / 2610,
	  c1: 3424 / 2 ** 12,
	  c2: 2413 / 2 ** 7,
	  c3: 2392 / 2 ** 7,
	  p: 1.7 * 2523 / 2 ** 5,
	  pinv: 2 ** 5 / (1.7 * 2523),
	  d: -0.56,
	  d0: 1.6295499532821566E-11,
	  XYZtoCone_M: [[0.41478972, 0.579999, 0.0146480], [-0.2015100, 1.120649, 0.0531008], [-0.0166008, 0.264800, 0.6684799]],
	  // XYZtoCone_M inverted
	  ConetoXYZ_M: [[1.9242264357876067, -1.0047923125953657, 0.037651404030618], [0.35031676209499907, 0.7264811939316552, -0.06538442294808501], [-0.09098281098284752, -0.3127282905230739, 1.5227665613052603]],
	  ConetoIab_M: [[0.5, 0.5, 0], [3.524000, -4.066708, 0.542708], [0.199076, 1.096799, -1.295875]],
	  // ConetoIab_M inverted
	  IabtoCone_M: [[1, 0.1386050432715393, 0.05804731615611886], [0.9999999999999999, -0.1386050432715393, -0.05804731615611886], [0.9999999999999998, -0.09601924202631895, -0.8118918960560388]],

	  fromXYZ(XYZ) {
	    const {
	      b,
	      g,
	      n,
	      p,
	      c1,
	      c2,
	      c3,
	      d,
	      d0,
	      XYZtoCone_M,
	      ConetoIab_M
	    } = this; // First make XYZ absolute, not relative to media white
	    // Maximum luminance in PQ is 10,000 cd/m²
	    // Relative XYZ has Y=1 for media white
	    // BT.2048 says media white Y=203 at PQ 58
	    // console.log({XYZ});

	    let [Xa, Ya, Za] = Color$1$1.spaces.absxyzd65.fromXYZ(XYZ); // console.log({Xa, Ya, Za});
	    // modify X and Y

	    let Xm = b * Xa - (b - 1) * Za;
	    let Ym = g * Ya - (g - 1) * Xa; // console.log({Xm, Ym, Za});
	    // move to LMS cone domain

	    let LMS = multiplyMatrices(XYZtoCone_M, [Xm, Ym, Za]); // console.log({LMS});
	    // PQ-encode LMS

	    let PQLMS = LMS.map(function (val) {
	      let num = c1 + c2 * (val / 10000) ** n;
	      let denom = 1 + c3 * (val / 10000) ** n; // console.log({val, num, denom});

	      return (num / denom) ** p;
	    }); // console.log({PQLMS});
	    // almost there, calculate Iz az bz

	    let [Iz, az, bz] = multiplyMatrices(ConetoIab_M, PQLMS); // console.log({Iz, az, bz});

	    let Jz = (1 + d) * Iz / (1 + d * Iz) - d0;
	    return [Jz, az, bz];
	  },

	  toXYZ(Jzazbz) {
	    const {
	      b,
	      g,
	      ninv,
	      pinv,
	      c1,
	      c2,
	      c3,
	      d,
	      d0,
	      ConetoXYZ_M,
	      IabtoCone_M
	    } = this;
	    let [Jz, az, bz] = Jzazbz;
	    let Iz = (Jz + d0) / (1 + d - d * (Jz + d0)); // console.log({Iz});
	    // bring into LMS cone domain

	    let PQLMS = multiplyMatrices(IabtoCone_M, [Iz, az, bz]); // console.log({PQLMS});
	    // convert from PQ-coded to linear-light

	    let LMS = PQLMS.map(function (val) {
	      let num = c1 - val ** pinv;
	      let denom = c3 * val ** pinv - c2;
	      let x = 10000 * (num / denom) ** ninv; // console.log({x, num, denom})

	      return x; // luminance relative to diffuse white, [0, 70 or so].
	    }); // console.log({LMS});
	    // modified abs XYZ

	    let [Xm, Ym, Za] = multiplyMatrices(ConetoXYZ_M, LMS); // console.log({sXm, Ym, Za});
	    // restore standard D50 relative XYZ, relative to media white

	    let Xa = (Xm + (b - 1) * Za) / b;
	    let Ya = (Ym + (g - 1) * Xa) / g;
	    return Color$1$1.spaces.absxyzd65.toXYZ([Xa, Ya, Za]);
	  },

	  parse(str, parsed = Color$1$1.parseFunction(str)) {
	    if (parsed && parsed.name === "jzabz") {
	      return {
	        spaceId: "jzazbz",
	        coords: parsed.args.slice(0, 3),
	        alpha: parsed.args.slice(3)[0]
	      };
	    }
	  },

	  instance: {
	    toString({
	      format,
	      ...rest
	    } = {}) {
	      return Color$1$1.prototype.toString.call(this, {
	        name: "jzazbz",
	        format,
	        ...rest
	      });
	    }

	  }
	});
	Color$1$1.defineSpace({
	  id: "jzczhz",
	  name: "JzCzHz",
	  coords: {
	    Jz: [0, 1],
	    chroma: [0, 1],
	    hue: range
	  },
	  inGamut: coords => true,
	  white: Color$1$1.D65,
	  from: {
	    jzazbz(jzazbz) {
	      // Convert to polar form
	      let [Jz, az, bz] = jzazbz;
	      let hue;
	      const ε = 0.000005; // chromatic components much smaller than a,b

	      if (Math.abs(az) < ε && Math.abs(bz) < ε) {
	        hue = NaN;
	      } else {
	        hue = Math.atan2(bz, az) * 180 / Math.PI;
	      }

	      return [Jz, // Jz is still Jz
	      Math.sqrt(az ** 2 + bz ** 2), // Chroma
	      constrain(hue) // Hue, in degrees [0 to 360)
	      ];
	    }

	  },
	  to: {
	    jzazbz(jzczhz) {
	      // Convert from polar form
	      // debugger;
	      return [jzczhz[0], // Jz is still Jz
	      jzczhz[1] * Math.cos(jzczhz[2] * Math.PI / 180), // az
	      jzczhz[1] * Math.sin(jzczhz[2] * Math.PI / 180) // bz
	      ];
	    }

	  },

	  parse(str, parsed = Color$1$1.parseFunction(str)) {
	    if (parsed && parsed.name === "jzczhz") {
	      parsed.args[0];
	      return {
	        spaceId: "jzczhz",
	        coords: parsed.args.slice(0, 3),
	        alpha: parsed.args.slice(3)[0]
	      };
	    }
	  }

	});
	Color$1$1.spaces.rec2020;
	Color$1$1.defineSpace({
	  // Only the PQ form of ICtCp is implemented here. There is also an HLG form.
	  // from Dolby, "WHAT IS ICTCP?"
	  // https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf
	  // and
	  // Dolby, "Perceptual Color Volume
	  // Measuring the Distinguishable Colors of HDR and WCG Displays"
	  // https://professional.dolby.com/siteassets/pdfs/dolby-vision-measuring-perceptual-color-volume-v7.1.pdf
	  id: "ictcp",
	  name: "ICTCP",
	  // From BT.2100-2 page 7:
	  // During production, signal values are expected to exceed the
	  // range E′ = [0.0 : 1.0]. This provides processing headroom and avoids
	  // signal degradation during cascaded processing. Such values of E′,
	  // below 0.0 or exceeding 1.0, should not be clipped during production
	  // and exchange.
	  // Values below 0.0 should not be clipped in reference displays (even
	  // though they represent “negative” light) to allow the black level of
	  // the signal (LB) to be properly set using test signals known as “PLUGE”
	  coords: {
	    I: [0, 1],
	    // Constant luminance
	    CT: [-0.5, 0.5],
	    // Full BT.2020 gamut in range [-0.5, 0.5]
	    CP: [-0.5, 0.5]
	  },
	  inGamut: coords => true,
	  // Note that XYZ is relative to D65
	  white: Color$1$1.whites.D65,
	  c1: 3424 / 4096,
	  c2: 2413 / 128,
	  c3: 2392 / 128,
	  m1: 2610 / 16384,
	  m2: 2523 / 32,
	  im1: 16384 / 2610,
	  im2: 32 / 2523,
	  // The matrix below includes the 4% crosstalk components
	  // and is from the Dolby "What is ICtCp" paper"
	  XYZtoLMS_M: [[0.3592, 0.6976, -0.0358], [-0.1922, 1.1004, 0.0755], [0.0070, 0.0749, 0.8434]],
	  // linear-light Rec.2020 to LMS, again with crosstalk
	  // rational terms from Jan Fröhlich,
	  // Encoding High Dynamic Range andWide Color Gamut Imagery, p.97
	  // and ITU-R BT.2124-0 p.2
	  Rec2020toLMS_M: [[1688 / 4096, 2146 / 4096, 262 / 4096], [683 / 4096, 2951 / 4096, 462 / 4096], [99 / 4096, 309 / 4096, 3688 / 4096]],
	  // this includes the Ebner LMS coefficients,
	  // the rotation, and the scaling to [-0.5,0.5] range
	  // rational terms from Fröhlich p.97
	  // and ITU-R BT.2124-0 pp.2-3
	  LMStoIPT_M: [[2048 / 4096, 2048 / 4096, 0], [6610 / 4096, -13613 / 4096, 7003 / 4096], [17933 / 4096, -17390 / 4096, -543 / 4096]],
	  // inverted matrices, calculated from the above
	  IPTtoLMS_M: [[0.99998889656284013833, 0.00860505014728705821, 0.1110343715986164786], [1.0000111034371598616, -0.00860505014728705821, -0.1110343715986164786], [1.000032063391005412, 0.56004913547279000113, -0.32063391005412026469]],
	  LMStoRec2020_M: [[3.4375568932814012112, -2.5072112125095058195, 0.069654319228104608382], [-0.79142868665644156125, 1.9838372198740089874, -0.19240853321756742626], [-0.025646662911506476363, -0.099240248643945566751, 1.1248869115554520431]],
	  LMStoXYZ_M: [[2.0701800566956135096, -1.3264568761030210255, 0.20661600684785517081], [0.36498825003265747974, 0.68046736285223514102, -0.045421753075853231409], [-0.049595542238932107896, -0.049421161186757487412, 1.1879959417328034394]],

	  fromXYZ(XYZ) {
	    const {
	      XYZtoLMS_M
	    } = this; // console.log ({c1, c2, c3, m1, m2});
	    // Make XYZ absolute, not relative to media white
	    // Maximum luminance in PQ is 10,000 cd/m²
	    // Relative XYZ has Y=1 for media white
	    // BT.2048 says media white Y=203 at PQ 58
	    // This also does the D50 to D65 adaptation

	    let [Xa, Ya, Za] = Color$1$1.spaces.absxyzd65.fromXYZ(XYZ); // console.log({Xa, Ya, Za});
	    // move to LMS cone domain

	    let LMS = multiplyMatrices(XYZtoLMS_M, [Xa, Ya, Za]); // console.log({LMS});

	    return this.LMStoICtCp(LMS);
	  },

	  toXYZ(ICtCp) {
	    const {
	      LMStoXYZ_M
	    } = this;
	    let LMS = this.ICtCptoLMS(ICtCp);
	    let XYZa = multiplyMatrices(LMStoXYZ_M, LMS); // convert from Absolute, D65 XYZ to media white relative, D50 XYZ

	    return Color$1$1.spaces.absxyzd65.toXYZ(XYZa);
	  },

	  LMStoICtCp(LMS) {
	    const {
	      LMStoIPT_M,
	      c1,
	      c2,
	      c3,
	      m1,
	      m2
	    } = this; // console.log ({c1, c2, c3, m1, m2});
	    // apply the PQ EOTF
	    // we can't ever be dividing by zero because of the "1 +" in the denominator

	    let PQLMS = LMS.map(function (val) {
	      let num = c1 + c2 * (val / 10000) ** m1;
	      let denom = 1 + c3 * (val / 10000) ** m1;
	      console.log({
	        val,
	        num,
	        denom
	      });
	      return (num / denom) ** m2;
	    }); // console.log({PQLMS});
	    // LMS to IPT, with rotation for Y'C'bC'r compatibility

	    return multiplyMatrices(LMStoIPT_M, PQLMS);
	  },

	  ICtCptoLMS(ICtCp) {
	    const {
	      IPTtoLMS_M,
	      c1,
	      c2,
	      c3,
	      im1,
	      im2
	    } = this;
	    let PQLMS = multiplyMatrices(IPTtoLMS_M, ICtCp); // From BT.2124-0 Annex 2 Conversion 3

	    let LMS = PQLMS.map(function (val) {
	      let num = Math.max(val ** im2 - c1, 0);
	      let denom = c2 - c3 * val ** im2;
	      return 10000 * (num / denom) ** im1;
	    });
	    return LMS;
	  } // },
	  // from: {
	  // 	rec2020: function() {
	  // 	}
	  // },
	  // to: {
	  // 	rec2020: function() {
	  // 	}
	  // }


	});
	let methods = {
	  range(...args) {
	    return Color$1$1.range(this, ...args);
	  },

	  /**
	   * Return an intermediate color between two colors
	   * Signatures: color.mix(color, p, options)
	   *             color.mix(color, options)
	   *             color.mix(color)
	   */
	  mix(color, p = .5, o = {}) {
	    if (type(p) === "object") {
	      [p, o] = [.5, p];
	    }

	    let {
	      space,
	      outputSpace
	    } = o;
	    color = Color$1$1.get(color);
	    let range = this.range(color, {
	      space,
	      outputSpace
	    });
	    return range(p);
	  },

	  /**
	   * Interpolate to color2 and return an array of colors
	   * @returns {Array[Color]}
	   */
	  steps(...args) {
	    return Color$1$1.steps(this, ...args);
	  }

	};

	Color$1$1.steps = function (color1, color2, options = {}) {
	  let range;

	  if (isRange(color1)) {
	    // Tweaking existing range
	    [range, options] = [color1, color2];
	    [color1, color2] = range.rangeArgs.colors;
	  }

	  let {
	    maxDeltaE,
	    steps = 2,
	    maxSteps = 1000,
	    ...rangeOptions
	  } = options;

	  if (!range) {
	    color1 = Color$1$1.get(color1);
	    color2 = Color$1$1.get(color2);
	    range = Color$1$1.range(color1, color2, rangeOptions);
	  }

	  let totalDelta = this.deltaE(color2);
	  let actualSteps = maxDeltaE > 0 ? Math.max(steps, Math.ceil(totalDelta / maxDeltaE) + 1) : steps;
	  let ret = [];

	  if (maxSteps !== undefined) {
	    actualSteps = Math.min(actualSteps, maxSteps);
	  }

	  if (actualSteps === 1) {
	    ret = [{
	      p: .5,
	      color: range(.5)
	    }];
	  } else {
	    let step = 1 / (actualSteps - 1);
	    ret = Array.from({
	      length: actualSteps
	    }, (_, i) => {
	      let p = i * step;
	      return {
	        p,
	        color: range(p)
	      };
	    });
	  }

	  if (maxDeltaE > 0) {
	    // Iterate over all stops and find max deltaE
	    let maxDelta = ret.reduce((acc, cur, i) => i === 0 ? 0 : Math.max(acc, cur.color.deltaE(ret[i - 1].color)), 0);

	    while (maxDelta > maxDeltaE) {
	      // Insert intermediate stops and measure maxDelta again
	      // We need to do this for all pairs, otherwise the midpoint shifts
	      maxDelta = 0;

	      for (let i = 1; i < ret.length && ret.length < maxSteps; i++) {
	        let prev = ret[i - 1];
	        let cur = ret[i];
	        let p = (cur.p + prev.p) / 2;
	        let color = range(p);
	        maxDelta = Math.max(maxDelta, color.deltaE(prev.color), color.deltaE(cur.color));
	        ret.splice(i, 0, {
	          p,
	          color: range(p)
	        });
	        i++;
	      }
	    }
	  }

	  ret = ret.map(a => a.color);
	  return ret;
	};
	/**
	 * Interpolate to color2 and return a function that takes a 0-1 percentage
	 * @returns {Function}
	 */


	Color$1$1.range = function (color1, color2, options = {}) {
	  if (isRange(color1)) {
	    // Tweaking existing range
	    let [range, options] = [color1, color2];
	    return Color$1$1.range(...range.rangeArgs.colors, { ...range.rangeArgs.options,
	      ...options
	    });
	  }

	  let {
	    space,
	    outputSpace,
	    progression,
	    premultiplied
	  } = options; // Make sure we're working on copies of these colors

	  color1 = new Color$1$1(color1);
	  color2 = new Color$1$1(color2);
	  let rangeArgs = {
	    colors: [color1, color2],
	    options
	  };

	  if (space) {
	    space = Color$1$1.space(space);
	  } else {
	    space = Color$1$1.spaces[Color$1$1.defaults.interpolationSpace] || color1.space;
	  }

	  outputSpace = outputSpace ? Color$1$1.space(outputSpace) : color1.space || space;
	  color1 = color1.to(space).toGamut();
	  color2 = color2.to(space).toGamut(); // Handle hue interpolation
	  // See https://github.com/w3c/csswg-drafts/issues/4735#issuecomment-635741840

	  if (space.coords.hue && space.coords.hue.isAngle) {
	    let arc = options.hue = options.hue || "shorter";
	    [color1[space.id].hue, color2[space.id].hue] = adjust(arc, [color1[space.id].hue, color2[space.id].hue]);
	  }

	  if (premultiplied) {
	    // not coping with polar spaces yet
	    color1.coords = color1.coords.map(c => c * color1.alpha);
	    color2.coords = color2.coords.map(c => c * color2.alpha);
	  }

	  return Object.assign(p => {
	    p = progression ? progression(p) : p;
	    let coords = color1.coords.map((start, i) => {
	      let end = color2.coords[i];
	      return interpolate(start, end, p);
	    });
	    let alpha = interpolate(color1.alpha, color2.alpha, p);
	    let ret = new Color$1$1(space, coords, alpha);

	    if (premultiplied) {
	      // undo premultiplication
	      ret.coords = ret.coords.map(c => c / alpha);
	    }

	    if (outputSpace !== space) {
	      ret = ret.to(outputSpace);
	    }

	    return ret;
	  }, {
	    rangeArgs
	  });
	};

	function isRange(val) {
	  return type(val) === "function" && val.rangeArgs;
	} // Helper


	function interpolate(start, end, p) {
	  if (isNaN(start)) {
	    return end;
	  }

	  if (isNaN(end)) {
	    return start;
	  }

	  return start + (end - start) * p;
	}

	Object.assign(Color$1$1.defaults, {
	  interpolationSpace: "lab"
	});
	Object.assign(Color$1$1.prototype, methods);
	Color$1$1.statify(Object.keys(methods)); // More accurate color-difference formulae
	// than the simple 1976 Euclidean distance in Lab
	// CMC by the Color Measurement Committee of the
	// Bradford Society of Dyeists and Colorsts, 1994.
	// Uses LCH rather than Lab,
	// with different weights for L, C and H differences
	// A nice increase in accuracy for modest increase in complexity

	Color$1$1.prototype.deltaECMC = function (sample, {
	  l = 2,
	  c = 1
	} = {}) {
	  let color = this;
	  sample = Color$1$1.get(sample); // Given this color as the reference
	  // and a sample,
	  // calculate deltaE CMC.
	  // This implementation assumes the parametric
	  // weighting factors l:c are 2:1
	  //  which is typical for non-textile uses.

	  let [L1, a1, b1] = color.lab;
	  let C1 = color.chroma;
	  let H1 = color.hue;
	  let [L2, a2, b2] = sample.lab;
	  let C2 = sample.chroma; // Check for negative Chroma,
	  // which might happen through
	  // direct user input of LCH values

	  if (C1 < 0) {
	    C1 = 0;
	  }

	  if (C2 < 0) {
	    C2 = 0;
	  } // we don't need H2 as ΔH is calculated from Δa, Δb and ΔC
	  // console.log({L1, a1, b1});
	  // console.log({L2, a2, b2});
	  // Lightness and Chroma differences
	  // These are (color - sample), unlike deltaE2000


	  let ΔL = L1 - L2;
	  let ΔC = C1 - C2; // console.log({ΔL});
	  // console.log({ΔC});

	  let Δa = a1 - a2;
	  let Δb = b1 - b2; // console.log({Δa});
	  // console.log({Δb});
	  // weighted Hue difference, less for larger Chroma difference

	  const π = Math.PI;
	  const d2r = π / 180;
	  let H2 = Δa ** 2 + Δb ** 2 - ΔC ** 2; // due to roundoff error it is possible that, for zero a and b,
	  // ΔC > Δa + Δb is 0, resulting in attempting
	  // to take the square root of a negative number
	  // trying instead the equation from Industrial Color Physics
	  // By Georg A. Klein
	  // let ΔH = ((a1 * b2) - (a2 * b1)) / Math.sqrt(0.5 * ((C2 * C1) + (a2 * a1) + (b2 * b1)));
	  // console.log({ΔH});
	  // This gives the same result to 12 decimal places
	  // except it sometimes NaNs when trying to root a negative number
	  // let ΔH = Math.sqrt(H2); we never actually use the root, it gets squared again!!
	  // positional corrections to the lack of uniformity of CIELAB
	  // These are all trying to make JND ellipsoids more like spheres
	  // SL Lightness crispening factor, depends entirely on L1 not L2

	  let SL = 0.511; // linear portion of the Y to L transfer function

	  if (L1 >= 16) {
	    // cubic portion
	    SL = 0.040975 * L1 / (1 + 0.01765 * L1);
	  } // console.log({SL});
	  // SC Chroma factor


	  let SC = 0.0638 * C1 / (1 + 0.0131 * C1) + 0.638; // console.log({SC});
	  // Cross term T for blue non-linearity

	  let T;

	  if (Number.isNaN(H1)) {
	    H1 = 0;
	  }

	  if (H1 >= 164 && H1 <= 345) {
	    T = 0.56 + Math.abs(0.2 * Math.cos((H1 + 168) * d2r));
	  } else {
	    T = 0.36 + Math.abs(0.4 * Math.cos((H1 + 35) * d2r));
	  } // console.log({T});
	  // SH Hue factor also depends on C1,


	  let C4 = Math.pow(C1, 4);
	  let F = Math.sqrt(C4 / (C4 + 1900));
	  let SH = SC * (F * T + 1 - F); // console.log({SH});
	  // Finally calculate the deltaE, term by term as root sume of squares

	  let dE = (ΔL / (l * SL)) ** 2;
	  dE += (ΔC / (c * SC)) ** 2;
	  dE += H2 / SH ** 2; // dE += (ΔH / SH)  ** 2;

	  return Math.sqrt(dE); // Yay!!!
	};

	Color$1$1.statify(["deltaECMC"]); // deltaE2000 is a statistically significant improvement
	// and is recommended by the CIE and Idealliance
	// especially for color differences less than 10 deltaE76
	// but is wicked complicated
	// and many implementations have small errors!
	// DeltaE2000 is also discontinuous; in case this
	// matters to you, use deltaECMC instead.

	Color$1$1.prototype.deltaE2000 = function (sample, {
	  kL = 1,
	  kC = 1,
	  kH = 1
	} = {}) {
	  let color = this;
	  sample = Color$1$1.get(sample); // Given this color as the reference
	  // and the function parameter as the sample,
	  // calculate deltaE 2000.
	  // This implementation assumes the parametric
	  // weighting factors kL, kC and kH
	  // for the influence of viewing conditions
	  // are all 1, as sadly seems typical.
	  // kL should be increased for lightness texture or noise
	  // and kC increased for chroma noise

	  let [L1, a1, b1] = color.lab;
	  let C1 = color.chroma;
	  let [L2, a2, b2] = sample.lab;
	  let C2 = sample.chroma; // Check for negative Chroma,
	  // which might happen through
	  // direct user input of LCH values

	  if (C1 < 0) {
	    C1 = 0;
	  }

	  if (C2 < 0) {
	    C2 = 0;
	  }

	  let Cbar = (C1 + C2) / 2; // mean Chroma
	  // calculate a-axis asymmetry factor from mean Chroma
	  // this turns JND ellipses for near-neutral colors back into circles

	  let C7 = Math.pow(Cbar, 7);
	  const Gfactor = Math.pow(25, 7);
	  let G = 0.5 * (1 - Math.sqrt(C7 / (C7 + Gfactor))); // scale a axes by asymmetry factor
	  // this by the way is why there is no Lab2000 colorspace

	  let adash1 = (1 + G) * a1;
	  let adash2 = (1 + G) * a2; // calculate new Chroma from scaled a and original b axes

	  let Cdash1 = Math.sqrt(adash1 ** 2 + b1 ** 2);
	  let Cdash2 = Math.sqrt(adash2 ** 2 + b2 ** 2); // calculate new hues, with zero hue for true neutrals
	  // and in degrees, not radians

	  const π = Math.PI;
	  const r2d = 180 / π;
	  const d2r = π / 180;
	  let h1 = adash1 === 0 && b1 === 0 ? 0 : Math.atan2(b1, adash1);
	  let h2 = adash2 === 0 && b2 === 0 ? 0 : Math.atan2(b2, adash2);

	  if (h1 < 0) {
	    h1 += 2 * π;
	  }

	  if (h2 < 0) {
	    h2 += 2 * π;
	  }

	  h1 *= r2d;
	  h2 *= r2d; // Lightness and Chroma differences; sign matters

	  let ΔL = L2 - L1;
	  let ΔC = Cdash2 - Cdash1; // Hue difference, getting the sign correct

	  let hdiff = h2 - h1;
	  let hsum = h1 + h2;
	  let habs = Math.abs(hdiff);
	  let Δh;

	  if (Cdash1 == 0 && Cdash2 == 0) {
	    Δh = 0;
	  } else if (habs <= 180) {
	    Δh = hdiff;
	  } else if (hdiff > 180) {
	    Δh = hdiff - 360;
	  } else if (hdiff < -180) {
	    Δh = hdiff + 360;
	  } else {
	    console.log("the unthinkable has happened");
	  } // weighted Hue difference, more for larger Chroma


	  let ΔH = 2 * Math.sqrt(Cdash2 * Cdash1) * Math.sin(Δh * d2r / 2); // calculate mean Lightness and Chroma

	  let Ldash = (L1 + L2) / 2;
	  let Cdash = (Cdash1 + Cdash2) / 2;
	  let Cdash7 = Math.pow(Cdash, 7); // Compensate for non-linearity in the blue region of Lab.
	  // Four possibilities for hue weighting factor,
	  // depending on the angles, to get the correct sign

	  let hdash;

	  if (Cdash1 == 0 && Cdash2 == 0) {
	    hdash = hsum; // which should be zero
	  } else if (habs <= 180) {
	    hdash = hsum / 2;
	  } else if (hsum < 360) {
	    hdash = (hsum + 360) / 2;
	  } else {
	    hdash = (hsum - 360) / 2;
	  } // positional corrections to the lack of uniformity of CIELAB
	  // These are all trying to make JND ellipsoids more like spheres
	  // SL Lightness crispening factor
	  // a background with L=50 is assumed


	  let lsq = (Ldash - 50) ** 2;
	  let SL = 1 + 0.015 * lsq / Math.sqrt(20 + lsq); // SC Chroma factor, similar to those in CMC and deltaE 94 formulae

	  let SC = 1 + 0.045 * Cdash; // Cross term T for blue non-linearity

	  let T = 1;
	  T -= 0.17 * Math.cos((hdash - 30) * d2r);
	  T += 0.24 * Math.cos(2 * hdash * d2r);
	  T += 0.32 * Math.cos((3 * hdash + 6) * d2r);
	  T -= 0.20 * Math.cos((4 * hdash - 63) * d2r); // SH Hue factor depends on Chroma,
	  // as well as adjusted hue angle like deltaE94.

	  let SH = 1 + 0.015 * Cdash * T; // RT Hue rotation term compensates for rotation of JND ellipses
	  // and Munsell constant hue lines
	  // in the medium-high Chroma blue region
	  // (Hue 225 to 315)

	  let Δθ = 30 * Math.exp(-1 * ((hdash - 275) / 25) ** 2);
	  let RC = 2 * Math.sqrt(Cdash7 / (Cdash7 + Gfactor));
	  let RT = -1 * Math.sin(2 * Δθ * d2r) * RC; // Finally calculate the deltaE, term by term as root sume of squares

	  let dE = (ΔL / (kL * SL)) ** 2;
	  dE += (ΔC / (kC * SC)) ** 2;
	  dE += (ΔH / (kH * SH)) ** 2;
	  dE += RT * (ΔC / (kC * SC)) * (ΔH / (kH * SH));
	  return Math.sqrt(dE); // Yay!!!
	};

	Color$1$1.statify(["deltaE2000"]); // More accurate color-difference formulae
	// than the simple 1976 Euclidean distance in Lab
	// Uses JzCzHz, which has improved perceptual uniformity
	// and thus a simple Euclidean root-sum of ΔL² ΔC² ΔH²
	// gives good results.

	Color$1$1.prototype.deltaEJz = function (sample) {
	  let color = this;
	  sample = Color$1$1.get(sample); // Given this color as the reference
	  // and a sample,
	  // calculate deltaE in JzCzHz.

	  let [Jz1, Cz1, Hz1] = color.jzczhz;
	  let [Jz2, Cz2, Hz2] = sample.jzczhz; // Lightness and Chroma differences
	  // sign does not matter as they are squared.

	  let ΔJ = Jz1 - Jz2;
	  let ΔC = Cz1 - Cz2; // length of chord for ΔH

	  if (Number.isNaN(Hz1) && Number.isNaN(Hz2)) {
	    // both undefined hues
	    Hz1 = 0;
	    Hz2 = 0;
	  } else if (Number.isNaN(Hz1)) {
	    // one undefined, set to the defined hue
	    Hz1 = Hz2;
	  } else if (Number.isNaN(Hz2)) {
	    Hz2 = Hz1;
	  }

	  let Δh = Hz1 - Hz2;
	  let ΔH = 2 * Math.sqrt(Cz1 * Cz2) * Math.sin(Δh * Math.PI / 180);
	  return Math.sqrt(ΔJ ** 2 + ΔC ** 2 + ΔH ** 2);
	};

	Color$1$1.statify(["deltaEJz"]);
	Color$1$1.CATs = {};
	Color$1$1.hooks.add("chromatic-adaptation-start", env => {
	  if (env.options.method) {
	    env.M = Color$1$1.adapt(env.W1, env.W2, env.options.method);
	  }
	});
	Color$1$1.hooks.add("chromatic-adaptation-end", env => {
	  if (!env.M) {
	    env.M = Color$1$1.adapt(env.W1, env.W2, env.options.method);
	  }
	});

	Color$1$1.defineCAT = function ({
	  id,
	  toCone_M,
	  fromCone_M
	}) {
	  // Use id, toCone_M, fromCone_M like variables
	  Color$1$1.CATs[id] = arguments[0];
	};

	Color$1$1.adapt = function (W1, W2, id = "Bradford") {
	  // adapt from a source whitepoint or illuminant W1
	  // to a destination whitepoint or illuminant W2,
	  // using the given chromatic adaptation transform (CAT)
	  // debugger;
	  let method = Color$1$1.CATs[id];
	  let [ρs, γs, βs] = multiplyMatrices(method.toCone_M, W1);
	  let [ρd, γd, βd] = multiplyMatrices(method.toCone_M, W2); // all practical illuminants have non-zero XYZ so no division by zero can occur below

	  let scale = [[ρd / ρs, 0, 0], [0, γd / γs, 0], [0, 0, βd / βs]]; // console.log({scale});

	  let scaled_cone_M = multiplyMatrices(scale, method.toCone_M);
	  let adapt_M = multiplyMatrices(method.fromCone_M, scaled_cone_M); // console.log({scaled_cone_M, adapt_M});

	  return adapt_M;
	};

	Color$1$1.defineCAT({
	  id: "von Kries",
	  toCone_M: [[0.4002400, 0.7076000, -0.0808100], [-0.2263000, 1.1653200, 0.0457000], [0.0000000, 0.0000000, 0.9182200]],
	  fromCone_M: [[1.8599364, -1.1293816, 0.2198974], [0.3611914, 0.6388125, -0.0000064], [0.0000000, 0.0000000, 1.0890636]]
	});
	Color$1$1.defineCAT({
	  id: "Bradford",
	  // Convert an array of XYZ values in the range 0.0 - 1.0
	  // to cone fundamentals
	  toCone_M: [[0.8951000, 0.2664000, -0.1614000], [-0.7502000, 1.7135000, 0.0367000], [0.0389000, -0.0685000, 1.0296000]],
	  // and back
	  fromCone_M: [[0.9869929, -0.1470543, 0.1599627], [0.4323053, 0.5183603, 0.0492912], [-0.0085287, 0.0400428, 0.9684867]]
	});
	Color$1$1.defineCAT({
	  id: "CAT02",
	  // with complete chromatic adaptation to W2, so D = 1.0
	  toCone_M: [[0.7328000, 0.4296000, -0.1624000], [-0.7036000, 1.6975000, 0.0061000], [0.0030000, 0.0136000, 0.9834000]],
	  fromCone_M: [[1.0961238, -0.2788690, 0.1827452], [0.4543690, 0.4735332, 0.0720978], [-0.0096276, -0.0056980, 1.0153256]]
	});
	Color$1$1.defineCAT({
	  id: "CAT16",
	  toCone_M: [[0.401288, 0.650173, -0.051461], [-0.250268, 1.204414, 0.045854], [-0.002079, 0.048952, 0.953127]],
	  // the extra precision is needed to avoid roundtripping errors
	  fromCone_M: [[1.862067855087233e+0, -1.011254630531685e+0, 1.491867754444518e-1], [3.875265432361372e-1, 6.214474419314753e-1, -8.973985167612518e-3], [-1.584149884933386e-2, -3.412293802851557e-2, 1.049964436877850e+0]]
	});
	Object.assign(Color$1$1.whites, {
	  // whitepoint values from ASTM E308-01 with 10nm spacing, 1931 2 degree observer
	  // all normalized to Y (luminance) = 1.00000
	  // Illuminant A is a tungsten electric light, giving a very warm, orange light.
	  A: [1.09850, 1.00000, 0.35585],
	  // Illuminant C was an early approximation to daylight: illuminant A with a blue filter.
	  C: [0.98074, 1.000000, 1.18232],
	  // The daylight series of illuminants simulate natural daylight.
	  // The color temperature (in degrees Kelvin/100) ranges from
	  // cool, overcast daylight (D50) to bright, direct sunlight (D65).
	  D55: [0.95682, 1.00000, 0.92149],
	  D75: [0.94972, 1.00000, 1.22638],
	  // Equal-energy illuminant, used in two-stage CAT16
	  E: [1.00000, 1.00000, 1.00000],
	  // The F series of illuminants represent flourescent lights
	  F2: [0.99186, 1.00000, 0.67393],
	  F7: [0.95041, 1.00000, 1.08747],
	  F11: [1.00962, 1.00000, 0.64350]
	}); // Import all modules of Color.js

	/* @license twgl.js 4.21.2 Copyright (c) 2015, Gregg Tavares All Rights Reserved.
	Available via the MIT license.
	see: http://github.com/greggman/twgl.js for details */
	/*
	 * Copyright 2019 Gregg Tavares
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a
	 * copy of this software and associated documentation files (the "Software"),
	 * to deal in the Software without restriction, including without limitation
	 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
	 * and/or sell copies of the Software, and to permit persons to whom the
	 * Software is furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
	 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
	 * DEALINGS IN THE SOFTWARE.
	 */

	/* DataType */

	const BYTE = 0x1400;
	const UNSIGNED_BYTE = 0x1401;
	const SHORT = 0x1402;
	const UNSIGNED_SHORT = 0x1403;
	const INT = 0x1404;
	const UNSIGNED_INT = 0x1405;
	const FLOAT = 0x1406;
	/**
	 * Get the GL type for a typedArray
	 * @param {ArrayBufferView} typedArray a typedArray
	 * @return {number} the GL type for array. For example pass in an `Int8Array` and `gl.BYTE` will
	 *   be returned. Pass in a `Uint32Array` and `gl.UNSIGNED_INT` will be returned
	 * @memberOf module:twgl/typedArray
	 */

	function getGLTypeForTypedArray(typedArray) {
	  if (typedArray instanceof Int8Array) {
	    return BYTE;
	  } // eslint-disable-line


	  if (typedArray instanceof Uint8Array) {
	    return UNSIGNED_BYTE;
	  } // eslint-disable-line


	  if (typedArray instanceof Uint8ClampedArray) {
	    return UNSIGNED_BYTE;
	  } // eslint-disable-line


	  if (typedArray instanceof Int16Array) {
	    return SHORT;
	  } // eslint-disable-line


	  if (typedArray instanceof Uint16Array) {
	    return UNSIGNED_SHORT;
	  } // eslint-disable-line


	  if (typedArray instanceof Int32Array) {
	    return INT;
	  } // eslint-disable-line


	  if (typedArray instanceof Uint32Array) {
	    return UNSIGNED_INT;
	  } // eslint-disable-line


	  if (typedArray instanceof Float32Array) {
	    return FLOAT;
	  } // eslint-disable-line


	  throw new Error('unsupported typed array type');
	}
	/**
	 * Get the GL type for a typedArray type
	 * @param {ArrayBufferView} typedArrayType a typedArray constructor
	 * @return {number} the GL type for type. For example pass in `Int8Array` and `gl.BYTE` will
	 *   be returned. Pass in `Uint32Array` and `gl.UNSIGNED_INT` will be returned
	 * @memberOf module:twgl/typedArray
	 */


	function getGLTypeForTypedArrayType(typedArrayType) {
	  if (typedArrayType === Int8Array) {
	    return BYTE;
	  } // eslint-disable-line


	  if (typedArrayType === Uint8Array) {
	    return UNSIGNED_BYTE;
	  } // eslint-disable-line


	  if (typedArrayType === Uint8ClampedArray) {
	    return UNSIGNED_BYTE;
	  } // eslint-disable-line


	  if (typedArrayType === Int16Array) {
	    return SHORT;
	  } // eslint-disable-line


	  if (typedArrayType === Uint16Array) {
	    return UNSIGNED_SHORT;
	  } // eslint-disable-line


	  if (typedArrayType === Int32Array) {
	    return INT;
	  } // eslint-disable-line


	  if (typedArrayType === Uint32Array) {
	    return UNSIGNED_INT;
	  } // eslint-disable-line


	  if (typedArrayType === Float32Array) {
	    return FLOAT;
	  } // eslint-disable-line


	  throw new Error('unsupported typed array type');
	}

	const isArrayBuffer = typeof SharedArrayBuffer !== 'undefined' ? function isArrayBufferOrSharedArrayBuffer(a) {
	  return a && a.buffer && (a.buffer instanceof ArrayBuffer || a.buffer instanceof SharedArrayBuffer);
	} : function isArrayBuffer(a) {
	  return a && a.buffer && a.buffer instanceof ArrayBuffer;
	};

	function error(...args) {
	  console.error(...args);
	}

	function isBuffer(gl, t) {
	  return typeof WebGLBuffer !== 'undefined' && t instanceof WebGLBuffer;
	}

	function isShader(gl, t) {
	  return typeof WebGLShader !== 'undefined' && t instanceof WebGLShader;
	}

	function isTexture(gl, t) {
	  return typeof WebGLTexture !== 'undefined' && t instanceof WebGLTexture;
	}
	/*
	 * Copyright 2019 Gregg Tavares
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a
	 * copy of this software and associated documentation files (the "Software"),
	 * to deal in the Software without restriction, including without limitation
	 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
	 * and/or sell copies of the Software, and to permit persons to whom the
	 * Software is furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
	 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
	 * DEALINGS IN THE SOFTWARE.
	 */


	const STATIC_DRAW = 0x88e4;
	const ARRAY_BUFFER = 0x8892;
	const ELEMENT_ARRAY_BUFFER = 0x8893;
	const BUFFER_SIZE = 0x8764;
	const BYTE$1 = 0x1400;
	const UNSIGNED_BYTE$1 = 0x1401;
	const SHORT$1 = 0x1402;
	const UNSIGNED_SHORT$1 = 0x1403;
	const INT$1 = 0x1404;
	const UNSIGNED_INT$1 = 0x1405;
	const FLOAT$1 = 0x1406;
	const defaults = {
	  attribPrefix: ""
	};

	function setBufferFromTypedArray(gl, type, buffer, array, drawType) {
	  gl.bindBuffer(type, buffer);
	  gl.bufferData(type, array, drawType || STATIC_DRAW);
	}
	/**
	 * Given typed array creates a WebGLBuffer and copies the typed array
	 * into it.
	 *
	 * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	 * @param {ArrayBuffer|SharedArrayBuffer|ArrayBufferView|WebGLBuffer} typedArray the typed array. Note: If a WebGLBuffer is passed in it will just be returned. No action will be taken
	 * @param {number} [type] the GL bind type for the buffer. Default = `gl.ARRAY_BUFFER`.
	 * @param {number} [drawType] the GL draw type for the buffer. Default = 'gl.STATIC_DRAW`.
	 * @return {WebGLBuffer} the created WebGLBuffer
	 * @memberOf module:twgl/attributes
	 */


	function createBufferFromTypedArray(gl, typedArray, type, drawType) {
	  if (isBuffer(gl, typedArray)) {
	    return typedArray;
	  }

	  type = type || ARRAY_BUFFER;
	  const buffer = gl.createBuffer();
	  setBufferFromTypedArray(gl, type, buffer, typedArray, drawType);
	  return buffer;
	}

	function isIndices(name) {
	  return name === "indices";
	} // This is really just a guess. Though I can't really imagine using
	// anything else? Maybe for some compression?


	function getNormalizationForTypedArray(typedArray) {
	  if (typedArray instanceof Int8Array) {
	    return true;
	  } // eslint-disable-line


	  if (typedArray instanceof Uint8Array) {
	    return true;
	  } // eslint-disable-line


	  return false;
	} // This is really just a guess. Though I can't really imagine using
	// anything else? Maybe for some compression?


	function getNormalizationForTypedArrayType(typedArrayType) {
	  if (typedArrayType === Int8Array) {
	    return true;
	  } // eslint-disable-line


	  if (typedArrayType === Uint8Array) {
	    return true;
	  } // eslint-disable-line


	  return false;
	}

	function getArray(array) {
	  return array.length ? array : array.data;
	}

	const texcoordRE = /coord|texture/i;
	const colorRE = /color|colour/i;

	function guessNumComponentsFromName(name, length) {
	  let numComponents;

	  if (texcoordRE.test(name)) {
	    numComponents = 2;
	  } else if (colorRE.test(name)) {
	    numComponents = 4;
	  } else {
	    numComponents = 3; // position, normals, indices ...
	  }

	  if (length % numComponents > 0) {
	    throw new Error(`Can not guess numComponents for attribute '${name}'. Tried ${numComponents} but ${length} values is not evenly divisible by ${numComponents}. You should specify it.`);
	  }

	  return numComponents;
	}

	function getNumComponents(array, arrayName) {
	  return array.numComponents || array.size || guessNumComponentsFromName(arrayName, getArray(array).length);
	}

	function makeTypedArray(array, name) {
	  if (isArrayBuffer(array)) {
	    return array;
	  }

	  if (isArrayBuffer(array.data)) {
	    return array.data;
	  }

	  if (Array.isArray(array)) {
	    array = {
	      data: array
	    };
	  }

	  let Type = array.type;

	  if (!Type) {
	    if (isIndices(name)) {
	      Type = Uint16Array;
	    } else {
	      Type = Float32Array;
	    }
	  }

	  return new Type(array.data);
	}
	/**
	 * The info for an attribute. This is effectively just the arguments to `gl.vertexAttribPointer` plus the WebGLBuffer
	 * for the attribute.
	 *
	 * @typedef {Object} AttribInfo
	 * @property {number[]|ArrayBufferView} [value] a constant value for the attribute. Note: if this is set the attribute will be
	 *    disabled and set to this constant value and all other values will be ignored.
	 * @property {number} [numComponents] the number of components for this attribute.
	 * @property {number} [size] synonym for `numComponents`.
	 * @property {number} [type] the type of the attribute (eg. `gl.FLOAT`, `gl.UNSIGNED_BYTE`, etc...) Default = `gl.FLOAT`
	 * @property {boolean} [normalize] whether or not to normalize the data. Default = false
	 * @property {number} [offset] offset into buffer in bytes. Default = 0
	 * @property {number} [stride] the stride in bytes per element. Default = 0
	 * @property {number} [divisor] the divisor in instances. Default = undefined. Note: undefined = don't call gl.vertexAttribDivisor
	 *    where as anything else = do call it with this value
	 * @property {WebGLBuffer} buffer the buffer that contains the data for this attribute
	 * @property {number} [drawType] the draw type passed to gl.bufferData. Default = gl.STATIC_DRAW
	 * @memberOf module:twgl
	 */

	/**
	 * Use this type of array spec when TWGL can't guess the type or number of components of an array
	 * @typedef {Object} FullArraySpec
	 * @property {number[]|ArrayBufferView} [value] a constant value for the attribute. Note: if this is set the attribute will be
	 *    disabled and set to this constant value and all other values will be ignored.
	 * @property {(number|number[]|ArrayBufferView)} data The data of the array. A number alone becomes the number of elements of type.
	 * @property {number} [numComponents] number of components for `vertexAttribPointer`. Default is based on the name of the array.
	 *    If `coord` is in the name assumes `numComponents = 2`.
	 *    If `color` is in the name assumes `numComponents = 4`.
	 *    otherwise assumes `numComponents = 3`
	 * @property {constructor} [type] type. This is only used if `data` is a JavaScript array. It is the constructor for the typedarray. (eg. `Uint8Array`).
	 * For example if you want colors in a `Uint8Array` you might have a `FullArraySpec` like `{ type: Uint8Array, data: [255,0,255,255, ...], }`.
	 * @property {number} [size] synonym for `numComponents`.
	 * @property {boolean} [normalize] normalize for `vertexAttribPointer`. Default is true if type is `Int8Array` or `Uint8Array` otherwise false.
	 * @property {number} [stride] stride for `vertexAttribPointer`. Default = 0
	 * @property {number} [offset] offset for `vertexAttribPointer`. Default = 0
	 * @property {number} [divisor] divisor for `vertexAttribDivisor`. Default = undefined. Note: undefined = don't call gl.vertexAttribDivisor
	 *    where as anything else = do call it with this value
	 * @property {string} [attrib] name of attribute this array maps to. Defaults to same name as array prefixed by the default attribPrefix.
	 * @property {string} [name] synonym for `attrib`.
	 * @property {string} [attribName] synonym for `attrib`.
	 * @property {WebGLBuffer} [buffer] Buffer to use for this attribute. This lets you use your own buffer
	 *    but you will need to supply `numComponents` and `type`. You can effectively pass an `AttribInfo`
	 *    to provide this. Example:
	 *
	 *         const bufferInfo1 = twgl.createBufferInfoFromArrays(gl, {
	 *           position: [1, 2, 3, ... ],
	 *         });
	 *         const bufferInfo2 = twgl.createBufferInfoFromArrays(gl, {
	 *           position: bufferInfo1.attribs.position,  // use the same buffer from bufferInfo1
	 *         });
	 *
	 * @memberOf module:twgl
	 */

	/**
	 * An individual array in {@link module:twgl.Arrays}
	 *
	 * When passed to {@link module:twgl.createBufferInfoFromArrays} if an ArraySpec is `number[]` or `ArrayBufferView`
	 * the types will be guessed based on the name. `indices` will be `Uint16Array`, everything else will
	 * be `Float32Array`. If an ArraySpec is a number it's the number of floats for an empty (zeroed) buffer.
	 *
	 * @typedef {(number|number[]|ArrayBufferView|module:twgl.FullArraySpec)} ArraySpec
	 * @memberOf module:twgl
	 */

	/**
	 * This is a JavaScript object of arrays by name. The names should match your shader's attributes. If your
	 * attributes have a common prefix you can specify it by calling {@link module:twgl.setAttributePrefix}.
	 *
	 *     Bare JavaScript Arrays
	 *
	 *         var arrays = {
	 *            position: [-1, 1, 0],
	 *            normal: [0, 1, 0],
	 *            ...
	 *         }
	 *
	 *     Bare TypedArrays
	 *
	 *         var arrays = {
	 *            position: new Float32Array([-1, 1, 0]),
	 *            color: new Uint8Array([255, 128, 64, 255]),
	 *            ...
	 *         }
	 *
	 * *   Will guess at `numComponents` if not specified based on name.
	 *
	 *     If `coord` is in the name assumes `numComponents = 2`
	 *
	 *     If `color` is in the name assumes `numComponents = 4`
	 *
	 *     otherwise assumes `numComponents = 3`
	 *
	 * Objects with various fields. See {@link module:twgl.FullArraySpec}.
	 *
	 *     var arrays = {
	 *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
	 *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
	 *       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
	 *       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
	 *     };
	 *
	 * @typedef {Object.<string, module:twgl.ArraySpec>} Arrays
	 * @memberOf module:twgl
	 */

	/**
	 * Creates a set of attribute data and WebGLBuffers from set of arrays
	 *
	 * Given
	 *
	 *      var arrays = {
	 *        position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
	 *        texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
	 *        normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
	 *        color:    { numComponents: 4, data: [255, 255, 255, 255, 255, 0, 0, 255, 0, 0, 255, 255], type: Uint8Array, },
	 *        indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
	 *      };
	 *
	 * returns something like
	 *
	 *      var attribs = {
	 *        position: { numComponents: 3, type: gl.FLOAT,         normalize: false, buffer: WebGLBuffer, },
	 *        texcoord: { numComponents: 2, type: gl.FLOAT,         normalize: false, buffer: WebGLBuffer, },
	 *        normal:   { numComponents: 3, type: gl.FLOAT,         normalize: false, buffer: WebGLBuffer, },
	 *        color:    { numComponents: 4, type: gl.UNSIGNED_BYTE, normalize: true,  buffer: WebGLBuffer, },
	 *      };
	 *
	 * notes:
	 *
	 * *   Arrays can take various forms
	 *
	 *     Bare JavaScript Arrays
	 *
	 *         var arrays = {
	 *            position: [-1, 1, 0],
	 *            normal: [0, 1, 0],
	 *            ...
	 *         }
	 *
	 *     Bare TypedArrays
	 *
	 *         var arrays = {
	 *            position: new Float32Array([-1, 1, 0]),
	 *            color: new Uint8Array([255, 128, 64, 255]),
	 *            ...
	 *         }
	 *
	 * *   Will guess at `numComponents` if not specified based on name.
	 *
	 *     If `coord` is in the name assumes `numComponents = 2`
	 *
	 *     If `color` is in the name assumes `numComponents = 4`
	 *
	 *     otherwise assumes `numComponents = 3`
	 *
	 * @param {WebGLRenderingContext} gl The webgl rendering context.
	 * @param {module:twgl.Arrays} arrays The arrays
	 * @param {module:twgl.BufferInfo} [srcBufferInfo] a BufferInfo to copy from
	 *   This lets you share buffers. Any arrays you supply will override
	 *   the buffers from srcBufferInfo.
	 * @return {Object.<string, module:twgl.AttribInfo>} the attribs
	 * @memberOf module:twgl/attributes
	 */


	function createAttribsFromArrays(gl, arrays) {
	  const attribs = {};
	  Object.keys(arrays).forEach(function (arrayName) {
	    if (!isIndices(arrayName)) {
	      const array = arrays[arrayName];
	      const attribName = array.attrib || array.name || array.attribName || defaults.attribPrefix + arrayName;

	      if (array.value) {
	        if (!Array.isArray(array.value) && !isArrayBuffer(array.value)) {
	          throw new Error('array.value is not array or typedarray');
	        }

	        attribs[attribName] = {
	          value: array.value
	        };
	      } else {
	        let buffer;
	        let type;
	        let normalization;
	        let numComponents;

	        if (array.buffer && array.buffer instanceof WebGLBuffer) {
	          buffer = array.buffer;
	          numComponents = array.numComponents || array.size;
	          type = array.type;
	          normalization = array.normalize;
	        } else if (typeof array === "number" || typeof array.data === "number") {
	          const numValues = array.data || array;
	          const arrayType = array.type || Float32Array;
	          const numBytes = numValues * arrayType.BYTES_PER_ELEMENT;
	          type = getGLTypeForTypedArrayType(arrayType);
	          normalization = array.normalize !== undefined ? array.normalize : getNormalizationForTypedArrayType(arrayType);
	          numComponents = array.numComponents || array.size || guessNumComponentsFromName(arrayName, numValues);
	          buffer = gl.createBuffer();
	          gl.bindBuffer(ARRAY_BUFFER, buffer);
	          gl.bufferData(ARRAY_BUFFER, numBytes, array.drawType || STATIC_DRAW);
	        } else {
	          const typedArray = makeTypedArray(array, arrayName);
	          buffer = createBufferFromTypedArray(gl, typedArray, undefined, array.drawType);
	          type = getGLTypeForTypedArray(typedArray);
	          normalization = array.normalize !== undefined ? array.normalize : getNormalizationForTypedArray(typedArray);
	          numComponents = getNumComponents(array, arrayName);
	        }

	        attribs[attribName] = {
	          buffer: buffer,
	          numComponents: numComponents,
	          type: type,
	          normalize: normalization,
	          stride: array.stride || 0,
	          offset: array.offset || 0,
	          divisor: array.divisor === undefined ? undefined : array.divisor,
	          drawType: array.drawType
	        };
	      }
	    }
	  });
	  gl.bindBuffer(ARRAY_BUFFER, null);
	  return attribs;
	}

	function getBytesPerValueForGLType(gl, type) {
	  if (type === BYTE$1) return 1; // eslint-disable-line

	  if (type === UNSIGNED_BYTE$1) return 1; // eslint-disable-line

	  if (type === SHORT$1) return 2; // eslint-disable-line

	  if (type === UNSIGNED_SHORT$1) return 2; // eslint-disable-line

	  if (type === INT$1) return 4; // eslint-disable-line

	  if (type === UNSIGNED_INT$1) return 4; // eslint-disable-line

	  if (type === FLOAT$1) return 4; // eslint-disable-line

	  return 0;
	} // Tries to get the number of elements from a set of arrays.


	const positionKeys = ['position', 'positions', 'a_position'];

	function getNumElementsFromAttributes(gl, attribs) {
	  let key;
	  let ii;

	  for (ii = 0; ii < positionKeys.length; ++ii) {
	    key = positionKeys[ii];

	    if (key in attribs) {
	      break;
	    }

	    key = defaults.attribPrefix + key;

	    if (key in attribs) {
	      break;
	    }
	  }

	  if (ii === positionKeys.length) {
	    key = Object.keys(attribs)[0];
	  }

	  const attrib = attribs[key];
	  gl.bindBuffer(ARRAY_BUFFER, attrib.buffer);
	  const numBytes = gl.getBufferParameter(ARRAY_BUFFER, BUFFER_SIZE);
	  gl.bindBuffer(ARRAY_BUFFER, null);
	  const bytesPerValue = getBytesPerValueForGLType(gl, attrib.type);
	  const totalElements = numBytes / bytesPerValue;
	  const numComponents = attrib.numComponents || attrib.size; // TODO: check stride

	  const numElements = totalElements / numComponents;

	  if (numElements % 1 !== 0) {
	    throw new Error(`numComponents ${numComponents} not correct for length ${length}`);
	  }

	  return numElements;
	}
	/**
	 * @typedef {Object} BufferInfo
	 * @property {number} numElements The number of elements to pass to `gl.drawArrays` or `gl.drawElements`.
	 * @property {number} [elementType] The type of indices `UNSIGNED_BYTE`, `UNSIGNED_SHORT` etc..
	 * @property {WebGLBuffer} [indices] The indices `ELEMENT_ARRAY_BUFFER` if any indices exist.
	 * @property {Object.<string, module:twgl.AttribInfo>} [attribs] The attribs appropriate to call `setAttributes`
	 * @memberOf module:twgl
	 */

	/**
	 * Creates a BufferInfo from an object of arrays.
	 *
	 * This can be passed to {@link module:twgl.setBuffersAndAttributes} and to
	 * {@link module:twgl:drawBufferInfo}.
	 *
	 * Given an object like
	 *
	 *     var arrays = {
	 *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
	 *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
	 *       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
	 *       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
	 *     };
	 *
	 *  Creates an BufferInfo like this
	 *
	 *     bufferInfo = {
	 *       numElements: 4,        // or whatever the number of elements is
	 *       indices: WebGLBuffer,  // this property will not exist if there are no indices
	 *       attribs: {
	 *         position: { buffer: WebGLBuffer, numComponents: 3, },
	 *         normal:   { buffer: WebGLBuffer, numComponents: 3, },
	 *         texcoord: { buffer: WebGLBuffer, numComponents: 2, },
	 *       },
	 *     };
	 *
	 *  The properties of arrays can be JavaScript arrays in which case the number of components
	 *  will be guessed.
	 *
	 *     var arrays = {
	 *        position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
	 *        texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
	 *        normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
	 *        indices:  [0, 1, 2, 1, 2, 3],
	 *     };
	 *
	 *  They can also be TypedArrays
	 *
	 *     var arrays = {
	 *        position: new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0]),
	 *        texcoord: new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]),
	 *        normal:   new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
	 *        indices:  new Uint16Array([0, 1, 2, 1, 2, 3]),
	 *     };
	 *
	 *  Or AugmentedTypedArrays
	 *
	 *     var positions = createAugmentedTypedArray(3, 4);
	 *     var texcoords = createAugmentedTypedArray(2, 4);
	 *     var normals   = createAugmentedTypedArray(3, 4);
	 *     var indices   = createAugmentedTypedArray(3, 2, Uint16Array);
	 *
	 *     positions.push([0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0]);
	 *     texcoords.push([0, 0, 0, 1, 1, 0, 1, 1]);
	 *     normals.push([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
	 *     indices.push([0, 1, 2, 1, 2, 3]);
	 *
	 *     var arrays = {
	 *        position: positions,
	 *        texcoord: texcoords,
	 *        normal:   normals,
	 *        indices:  indices,
	 *     };
	 *
	 * For the last example it is equivalent to
	 *
	 *     var bufferInfo = {
	 *       attribs: {
	 *         position: { numComponents: 3, buffer: gl.createBuffer(), },
	 *         texcoord: { numComponents: 2, buffer: gl.createBuffer(), },
	 *         normal: { numComponents: 3, buffer: gl.createBuffer(), },
	 *       },
	 *       indices: gl.createBuffer(),
	 *       numElements: 6,
	 *     };
	 *
	 *     gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.position.buffer);
	 *     gl.bufferData(gl.ARRAY_BUFFER, arrays.position, gl.STATIC_DRAW);
	 *     gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.texcoord.buffer);
	 *     gl.bufferData(gl.ARRAY_BUFFER, arrays.texcoord, gl.STATIC_DRAW);
	 *     gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.normal.buffer);
	 *     gl.bufferData(gl.ARRAY_BUFFER, arrays.normal, gl.STATIC_DRAW);
	 *     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);
	 *     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrays.indices, gl.STATIC_DRAW);
	 *
	 * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	 * @param {module:twgl.Arrays} arrays Your data
	 * @param {module:twgl.BufferInfo} [srcBufferInfo] An existing
	 *        buffer info to start from. WebGLBuffers etc specified
	 *        in the srcBufferInfo will be used in a new BufferInfo
	 *        with any arrays specified overriding the ones in
	 *        srcBufferInfo.
	 * @return {module:twgl.BufferInfo} A BufferInfo
	 * @memberOf module:twgl/attributes
	 */


	function createBufferInfoFromArrays(gl, arrays, srcBufferInfo) {
	  const newAttribs = createAttribsFromArrays(gl, arrays);
	  const bufferInfo = Object.assign({}, srcBufferInfo ? srcBufferInfo : {});
	  bufferInfo.attribs = Object.assign({}, srcBufferInfo ? srcBufferInfo.attribs : {}, newAttribs);
	  const indices = arrays.indices;

	  if (indices) {
	    const newIndices = makeTypedArray(indices, "indices");
	    bufferInfo.indices = createBufferFromTypedArray(gl, newIndices, ELEMENT_ARRAY_BUFFER);
	    bufferInfo.numElements = newIndices.length;
	    bufferInfo.elementType = getGLTypeForTypedArray(newIndices);
	  } else if (!bufferInfo.numElements) {
	    bufferInfo.numElements = getNumElementsFromAttributes(gl, bufferInfo.attribs);
	  }

	  return bufferInfo;
	}
	/*
	 * Copyright 2019 Gregg Tavares
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a
	 * copy of this software and associated documentation files (the "Software"),
	 * to deal in the Software without restriction, including without limitation
	 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
	 * and/or sell copies of the Software, and to permit persons to whom the
	 * Software is furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
	 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
	 * DEALINGS IN THE SOFTWARE.
	 */

	/**
	 * Gets the gl version as a number
	 * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	 * @return {number} version of gl
	 * @private
	 */
	//function getVersionAsNumber(gl) {
	//  return parseFloat(gl.getParameter(gl.VERSION).substr(6));
	//}

	/**
	 * Check if context is WebGL 2.0
	 * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	 * @return {bool} true if it's WebGL 2.0
	 * @memberOf module:twgl
	 */

	function isWebGL2(gl) {
	  // This is the correct check but it's slow
	  //  return gl.getParameter(gl.VERSION).indexOf("WebGL 2.0") === 0;
	  // This might also be the correct check but I'm assuming it's slow-ish
	  // return gl instanceof WebGL2RenderingContext;
	  return !!gl.texStorage2D;
	}
	/**
	 * Gets a string for WebGL enum
	 *
	 * Note: Several enums are the same. Without more
	 * context (which function) it's impossible to always
	 * give the correct enum. As it is, for matching values
	 * it gives all enums. Checking the WebGL2RenderingContext
	 * that means
	 *
	 *      0     = ZERO | POINT | NONE | NO_ERROR
	 *      1     = ONE | LINES | SYNC_FLUSH_COMMANDS_BIT
	 *      32777 = BLEND_EQUATION_RGB | BLEND_EQUATION_RGB
	 *      36662 = COPY_READ_BUFFER | COPY_READ_BUFFER_BINDING
	 *      36663 = COPY_WRITE_BUFFER | COPY_WRITE_BUFFER_BINDING
	 *      36006 = FRAMEBUFFER_BINDING | DRAW_FRAMEBUFFER_BINDING
	 *
	 * It's also not useful for bits really unless you pass in individual bits.
	 * In other words
	 *
	 *     const bits = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT;
	 *     twgl.glEnumToString(gl, bits);  // not going to work
	 *
	 * Note that some enums only exist on extensions. If you
	 * want them to show up you need to pass the extension at least
	 * once. For example
	 *
	 *     const ext = gl.getExtension('WEBGL_compressed_texture_s3tc');
	 *     if (ext) {
	 *        twgl.glEnumToString(ext, 0);  // just prime the function
	 *
	 *        ..later..
	 *
	 *        const internalFormat = ext.COMPRESSED_RGB_S3TC_DXT1_EXT;
	 *        console.log(twgl.glEnumToString(gl, internalFormat));
	 *
	 * Notice I didn't have to pass the extension the second time. This means
	 * you can have place that generically gets an enum for texture formats for example.
	 * and as long as you primed the function with the extensions
	 *
	 * If you're using `twgl.addExtensionsToContext` to enable your extensions
	 * then twgl will automatically get the extension's enums.
	 *
	 * @param {WebGLRenderingContext} gl A WebGLRenderingContext or any extension object
	 * @param {number} value the value of the enum you want to look up.
	 * @return {string} enum string or hex value
	 * @memberOf module:twgl
	 * @function glEnumToString
	 */


	const glEnumToString = function () {
	  const haveEnumsForType = {};
	  const enums = {};

	  function addEnums(gl) {
	    const type = gl.constructor.name;

	    if (!haveEnumsForType[type]) {
	      for (const key in gl) {
	        if (typeof gl[key] === 'number') {
	          const existing = enums[gl[key]];
	          enums[gl[key]] = existing ? `${existing} | ${key}` : key;
	        }
	      }

	      haveEnumsForType[type] = true;
	    }
	  }

	  return function glEnumToString(gl, value) {
	    addEnums(gl);
	    return enums[value] || (typeof value === 'number' ? `0x${value.toString(16)}` : value);
	  };
	}();
	/*
	 * Copyright 2019 Gregg Tavares
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a
	 * copy of this software and associated documentation files (the "Software"),
	 * to deal in the Software without restriction, including without limitation
	 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
	 * and/or sell copies of the Software, and to permit persons to whom the
	 * Software is furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
	 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
	 * DEALINGS IN THE SOFTWARE.
	 */

	/**
	 * Low level shader program related functions
	 *
	 * You should generally not need to use these functions. They are provided
	 * for those cases where you're doing something out of the ordinary
	 * and you need lower level access.
	 *
	 * For backward compatibility they are available at both `twgl.programs` and `twgl`
	 * itself
	 *
	 * See {@link module:twgl} for core functions
	 *
	 * @module twgl/programs
	 */

	const error$1 = error;

	function getElementById(id) {
	  return typeof document !== 'undefined' && document.getElementById ? document.getElementById(id) : null;
	}

	const TEXTURE0 = 0x84c0;
	const ARRAY_BUFFER$1 = 0x8892;
	const ELEMENT_ARRAY_BUFFER$1 = 0x8893;
	const COMPILE_STATUS = 0x8b81;
	const LINK_STATUS = 0x8b82;
	const FRAGMENT_SHADER = 0x8b30;
	const VERTEX_SHADER = 0x8b31;
	const SEPARATE_ATTRIBS = 0x8c8d;
	const ACTIVE_UNIFORMS = 0x8b86;
	const ACTIVE_ATTRIBUTES = 0x8b89;
	const TRANSFORM_FEEDBACK_VARYINGS = 0x8c83;
	const ACTIVE_UNIFORM_BLOCKS = 0x8a36;
	const UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER = 0x8a44;
	const UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER = 0x8a46;
	const UNIFORM_BLOCK_DATA_SIZE = 0x8a40;
	const UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES = 0x8a43;
	const FLOAT$3 = 0x1406;
	const FLOAT_VEC2 = 0x8B50;
	const FLOAT_VEC3 = 0x8B51;
	const FLOAT_VEC4 = 0x8B52;
	const INT$3 = 0x1404;
	const INT_VEC2 = 0x8B53;
	const INT_VEC3 = 0x8B54;
	const INT_VEC4 = 0x8B55;
	const BOOL = 0x8B56;
	const BOOL_VEC2 = 0x8B57;
	const BOOL_VEC3 = 0x8B58;
	const BOOL_VEC4 = 0x8B59;
	const FLOAT_MAT2 = 0x8B5A;
	const FLOAT_MAT3 = 0x8B5B;
	const FLOAT_MAT4 = 0x8B5C;
	const SAMPLER_2D = 0x8B5E;
	const SAMPLER_CUBE = 0x8B60;
	const SAMPLER_3D = 0x8B5F;
	const SAMPLER_2D_SHADOW = 0x8B62;
	const FLOAT_MAT2x3 = 0x8B65;
	const FLOAT_MAT2x4 = 0x8B66;
	const FLOAT_MAT3x2 = 0x8B67;
	const FLOAT_MAT3x4 = 0x8B68;
	const FLOAT_MAT4x2 = 0x8B69;
	const FLOAT_MAT4x3 = 0x8B6A;
	const SAMPLER_2D_ARRAY = 0x8DC1;
	const SAMPLER_2D_ARRAY_SHADOW = 0x8DC4;
	const SAMPLER_CUBE_SHADOW = 0x8DC5;
	const UNSIGNED_INT$3 = 0x1405;
	const UNSIGNED_INT_VEC2 = 0x8DC6;
	const UNSIGNED_INT_VEC3 = 0x8DC7;
	const UNSIGNED_INT_VEC4 = 0x8DC8;
	const INT_SAMPLER_2D = 0x8DCA;
	const INT_SAMPLER_3D = 0x8DCB;
	const INT_SAMPLER_CUBE = 0x8DCC;
	const INT_SAMPLER_2D_ARRAY = 0x8DCF;
	const UNSIGNED_INT_SAMPLER_2D = 0x8DD2;
	const UNSIGNED_INT_SAMPLER_3D = 0x8DD3;
	const UNSIGNED_INT_SAMPLER_CUBE = 0x8DD4;
	const UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;
	const TEXTURE_2D$1 = 0x0DE1;
	const TEXTURE_CUBE_MAP$1 = 0x8513;
	const TEXTURE_3D$1 = 0x806F;
	const TEXTURE_2D_ARRAY$1 = 0x8C1A;
	const typeMap = {};
	/**
	 * Returns the corresponding bind point for a given sampler type
	 */

	function getBindPointForSamplerType(gl, type) {
	  return typeMap[type].bindPoint;
	} // This kind of sucks! If you could compose functions as in `var fn = gl[name];`
	// this code could be a lot smaller but that is sadly really slow (T_T)


	function floatSetter(gl, location) {
	  return function (v) {
	    gl.uniform1f(location, v);
	  };
	}

	function floatArraySetter(gl, location) {
	  return function (v) {
	    gl.uniform1fv(location, v);
	  };
	}

	function floatVec2Setter(gl, location) {
	  return function (v) {
	    gl.uniform2fv(location, v);
	  };
	}

	function floatVec3Setter(gl, location) {
	  return function (v) {
	    gl.uniform3fv(location, v);
	  };
	}

	function floatVec4Setter(gl, location) {
	  return function (v) {
	    gl.uniform4fv(location, v);
	  };
	}

	function intSetter(gl, location) {
	  return function (v) {
	    gl.uniform1i(location, v);
	  };
	}

	function intArraySetter(gl, location) {
	  return function (v) {
	    gl.uniform1iv(location, v);
	  };
	}

	function intVec2Setter(gl, location) {
	  return function (v) {
	    gl.uniform2iv(location, v);
	  };
	}

	function intVec3Setter(gl, location) {
	  return function (v) {
	    gl.uniform3iv(location, v);
	  };
	}

	function intVec4Setter(gl, location) {
	  return function (v) {
	    gl.uniform4iv(location, v);
	  };
	}

	function uintSetter(gl, location) {
	  return function (v) {
	    gl.uniform1ui(location, v);
	  };
	}

	function uintArraySetter(gl, location) {
	  return function (v) {
	    gl.uniform1uiv(location, v);
	  };
	}

	function uintVec2Setter(gl, location) {
	  return function (v) {
	    gl.uniform2uiv(location, v);
	  };
	}

	function uintVec3Setter(gl, location) {
	  return function (v) {
	    gl.uniform3uiv(location, v);
	  };
	}

	function uintVec4Setter(gl, location) {
	  return function (v) {
	    gl.uniform4uiv(location, v);
	  };
	}

	function floatMat2Setter(gl, location) {
	  return function (v) {
	    gl.uniformMatrix2fv(location, false, v);
	  };
	}

	function floatMat3Setter(gl, location) {
	  return function (v) {
	    gl.uniformMatrix3fv(location, false, v);
	  };
	}

	function floatMat4Setter(gl, location) {
	  return function (v) {
	    gl.uniformMatrix4fv(location, false, v);
	  };
	}

	function floatMat23Setter(gl, location) {
	  return function (v) {
	    gl.uniformMatrix2x3fv(location, false, v);
	  };
	}

	function floatMat32Setter(gl, location) {
	  return function (v) {
	    gl.uniformMatrix3x2fv(location, false, v);
	  };
	}

	function floatMat24Setter(gl, location) {
	  return function (v) {
	    gl.uniformMatrix2x4fv(location, false, v);
	  };
	}

	function floatMat42Setter(gl, location) {
	  return function (v) {
	    gl.uniformMatrix4x2fv(location, false, v);
	  };
	}

	function floatMat34Setter(gl, location) {
	  return function (v) {
	    gl.uniformMatrix3x4fv(location, false, v);
	  };
	}

	function floatMat43Setter(gl, location) {
	  return function (v) {
	    gl.uniformMatrix4x3fv(location, false, v);
	  };
	}

	function samplerSetter(gl, type, unit, location) {
	  const bindPoint = getBindPointForSamplerType(gl, type);
	  return isWebGL2(gl) ? function (textureOrPair) {
	    let texture;
	    let sampler;

	    if (isTexture(gl, textureOrPair)) {
	      texture = textureOrPair;
	      sampler = null;
	    } else {
	      texture = textureOrPair.texture;
	      sampler = textureOrPair.sampler;
	    }

	    gl.uniform1i(location, unit);
	    gl.activeTexture(TEXTURE0 + unit);
	    gl.bindTexture(bindPoint, texture);
	    gl.bindSampler(unit, sampler);
	  } : function (texture) {
	    gl.uniform1i(location, unit);
	    gl.activeTexture(TEXTURE0 + unit);
	    gl.bindTexture(bindPoint, texture);
	  };
	}

	function samplerArraySetter(gl, type, unit, location, size) {
	  const bindPoint = getBindPointForSamplerType(gl, type);
	  const units = new Int32Array(size);

	  for (let ii = 0; ii < size; ++ii) {
	    units[ii] = unit + ii;
	  }

	  return isWebGL2(gl) ? function (textures) {
	    gl.uniform1iv(location, units);
	    textures.forEach(function (textureOrPair, index) {
	      gl.activeTexture(TEXTURE0 + units[index]);
	      let texture;
	      let sampler;

	      if (isTexture(gl, textureOrPair)) {
	        texture = textureOrPair;
	        sampler = null;
	      } else {
	        texture = textureOrPair.texture;
	        sampler = textureOrPair.sampler;
	      }

	      gl.bindSampler(unit, sampler);
	      gl.bindTexture(bindPoint, texture);
	    });
	  } : function (textures) {
	    gl.uniform1iv(location, units);
	    textures.forEach(function (texture, index) {
	      gl.activeTexture(TEXTURE0 + units[index]);
	      gl.bindTexture(bindPoint, texture);
	    });
	  };
	}

	typeMap[FLOAT$3] = {
	  Type: Float32Array,
	  size: 4,
	  setter: floatSetter,
	  arraySetter: floatArraySetter
	};
	typeMap[FLOAT_VEC2] = {
	  Type: Float32Array,
	  size: 8,
	  setter: floatVec2Setter,
	  cols: 2
	};
	typeMap[FLOAT_VEC3] = {
	  Type: Float32Array,
	  size: 12,
	  setter: floatVec3Setter,
	  cols: 3
	};
	typeMap[FLOAT_VEC4] = {
	  Type: Float32Array,
	  size: 16,
	  setter: floatVec4Setter,
	  cols: 4
	};
	typeMap[INT$3] = {
	  Type: Int32Array,
	  size: 4,
	  setter: intSetter,
	  arraySetter: intArraySetter
	};
	typeMap[INT_VEC2] = {
	  Type: Int32Array,
	  size: 8,
	  setter: intVec2Setter,
	  cols: 2
	};
	typeMap[INT_VEC3] = {
	  Type: Int32Array,
	  size: 12,
	  setter: intVec3Setter,
	  cols: 3
	};
	typeMap[INT_VEC4] = {
	  Type: Int32Array,
	  size: 16,
	  setter: intVec4Setter,
	  cols: 4
	};
	typeMap[UNSIGNED_INT$3] = {
	  Type: Uint32Array,
	  size: 4,
	  setter: uintSetter,
	  arraySetter: uintArraySetter
	};
	typeMap[UNSIGNED_INT_VEC2] = {
	  Type: Uint32Array,
	  size: 8,
	  setter: uintVec2Setter,
	  cols: 2
	};
	typeMap[UNSIGNED_INT_VEC3] = {
	  Type: Uint32Array,
	  size: 12,
	  setter: uintVec3Setter,
	  cols: 3
	};
	typeMap[UNSIGNED_INT_VEC4] = {
	  Type: Uint32Array,
	  size: 16,
	  setter: uintVec4Setter,
	  cols: 4
	};
	typeMap[BOOL] = {
	  Type: Uint32Array,
	  size: 4,
	  setter: intSetter,
	  arraySetter: intArraySetter
	};
	typeMap[BOOL_VEC2] = {
	  Type: Uint32Array,
	  size: 8,
	  setter: intVec2Setter,
	  cols: 2
	};
	typeMap[BOOL_VEC3] = {
	  Type: Uint32Array,
	  size: 12,
	  setter: intVec3Setter,
	  cols: 3
	};
	typeMap[BOOL_VEC4] = {
	  Type: Uint32Array,
	  size: 16,
	  setter: intVec4Setter,
	  cols: 4
	};
	typeMap[FLOAT_MAT2] = {
	  Type: Float32Array,
	  size: 32,
	  setter: floatMat2Setter,
	  rows: 2,
	  cols: 2
	};
	typeMap[FLOAT_MAT3] = {
	  Type: Float32Array,
	  size: 48,
	  setter: floatMat3Setter,
	  rows: 3,
	  cols: 3
	};
	typeMap[FLOAT_MAT4] = {
	  Type: Float32Array,
	  size: 64,
	  setter: floatMat4Setter,
	  rows: 4,
	  cols: 4
	};
	typeMap[FLOAT_MAT2x3] = {
	  Type: Float32Array,
	  size: 32,
	  setter: floatMat23Setter,
	  rows: 2,
	  cols: 3
	};
	typeMap[FLOAT_MAT2x4] = {
	  Type: Float32Array,
	  size: 32,
	  setter: floatMat24Setter,
	  rows: 2,
	  cols: 4
	};
	typeMap[FLOAT_MAT3x2] = {
	  Type: Float32Array,
	  size: 48,
	  setter: floatMat32Setter,
	  rows: 3,
	  cols: 2
	};
	typeMap[FLOAT_MAT3x4] = {
	  Type: Float32Array,
	  size: 48,
	  setter: floatMat34Setter,
	  rows: 3,
	  cols: 4
	};
	typeMap[FLOAT_MAT4x2] = {
	  Type: Float32Array,
	  size: 64,
	  setter: floatMat42Setter,
	  rows: 4,
	  cols: 2
	};
	typeMap[FLOAT_MAT4x3] = {
	  Type: Float32Array,
	  size: 64,
	  setter: floatMat43Setter,
	  rows: 4,
	  cols: 3
	};
	typeMap[SAMPLER_2D] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_2D$1
	};
	typeMap[SAMPLER_CUBE] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_CUBE_MAP$1
	};
	typeMap[SAMPLER_3D] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_3D$1
	};
	typeMap[SAMPLER_2D_SHADOW] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_2D$1
	};
	typeMap[SAMPLER_2D_ARRAY] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_2D_ARRAY$1
	};
	typeMap[SAMPLER_2D_ARRAY_SHADOW] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_2D_ARRAY$1
	};
	typeMap[SAMPLER_CUBE_SHADOW] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_CUBE_MAP$1
	};
	typeMap[INT_SAMPLER_2D] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_2D$1
	};
	typeMap[INT_SAMPLER_3D] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_3D$1
	};
	typeMap[INT_SAMPLER_CUBE] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_CUBE_MAP$1
	};
	typeMap[INT_SAMPLER_2D_ARRAY] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_2D_ARRAY$1
	};
	typeMap[UNSIGNED_INT_SAMPLER_2D] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_2D$1
	};
	typeMap[UNSIGNED_INT_SAMPLER_3D] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_3D$1
	};
	typeMap[UNSIGNED_INT_SAMPLER_CUBE] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_CUBE_MAP$1
	};
	typeMap[UNSIGNED_INT_SAMPLER_2D_ARRAY] = {
	  Type: null,
	  size: 0,
	  setter: samplerSetter,
	  arraySetter: samplerArraySetter,
	  bindPoint: TEXTURE_2D_ARRAY$1
	};

	function floatAttribSetter(gl, index) {
	  return function (b) {
	    if (b.value) {
	      gl.disableVertexAttribArray(index);

	      switch (b.value.length) {
	        case 4:
	          gl.vertexAttrib4fv(index, b.value);
	          break;

	        case 3:
	          gl.vertexAttrib3fv(index, b.value);
	          break;

	        case 2:
	          gl.vertexAttrib2fv(index, b.value);
	          break;

	        case 1:
	          gl.vertexAttrib1fv(index, b.value);
	          break;

	        default:
	          throw new Error('the length of a float constant value must be between 1 and 4!');
	      }
	    } else {
	      gl.bindBuffer(ARRAY_BUFFER$1, b.buffer);
	      gl.enableVertexAttribArray(index);
	      gl.vertexAttribPointer(index, b.numComponents || b.size, b.type || FLOAT$3, b.normalize || false, b.stride || 0, b.offset || 0);

	      if (b.divisor !== undefined) {
	        gl.vertexAttribDivisor(index, b.divisor);
	      }
	    }
	  };
	}

	function intAttribSetter(gl, index) {
	  return function (b) {
	    if (b.value) {
	      gl.disableVertexAttribArray(index);

	      if (b.value.length === 4) {
	        gl.vertexAttrib4iv(index, b.value);
	      } else {
	        throw new Error('The length of an integer constant value must be 4!');
	      }
	    } else {
	      gl.bindBuffer(ARRAY_BUFFER$1, b.buffer);
	      gl.enableVertexAttribArray(index);
	      gl.vertexAttribIPointer(index, b.numComponents || b.size, b.type || INT$3, b.stride || 0, b.offset || 0);

	      if (b.divisor !== undefined) {
	        gl.vertexAttribDivisor(index, b.divisor);
	      }
	    }
	  };
	}

	function uintAttribSetter(gl, index) {
	  return function (b) {
	    if (b.value) {
	      gl.disableVertexAttribArray(index);

	      if (b.value.length === 4) {
	        gl.vertexAttrib4uiv(index, b.value);
	      } else {
	        throw new Error('The length of an unsigned integer constant value must be 4!');
	      }
	    } else {
	      gl.bindBuffer(ARRAY_BUFFER$1, b.buffer);
	      gl.enableVertexAttribArray(index);
	      gl.vertexAttribIPointer(index, b.numComponents || b.size, b.type || UNSIGNED_INT$3, b.stride || 0, b.offset || 0);

	      if (b.divisor !== undefined) {
	        gl.vertexAttribDivisor(index, b.divisor);
	      }
	    }
	  };
	}

	function matAttribSetter(gl, index, typeInfo) {
	  const defaultSize = typeInfo.size;
	  const count = typeInfo.count;
	  return function (b) {
	    gl.bindBuffer(ARRAY_BUFFER$1, b.buffer);
	    const numComponents = b.size || b.numComponents || defaultSize;
	    const size = numComponents / count;
	    const type = b.type || FLOAT$3;
	    const typeInfo = typeMap[type];
	    const stride = typeInfo.size * numComponents;
	    const normalize = b.normalize || false;
	    const offset = b.offset || 0;
	    const rowOffset = stride / count;

	    for (let i = 0; i < count; ++i) {
	      gl.enableVertexAttribArray(index + i);
	      gl.vertexAttribPointer(index + i, size, type, normalize, stride, offset + rowOffset * i);

	      if (b.divisor !== undefined) {
	        gl.vertexAttribDivisor(index + i, b.divisor);
	      }
	    }
	  };
	}

	const attrTypeMap = {};
	attrTypeMap[FLOAT$3] = {
	  size: 4,
	  setter: floatAttribSetter
	};
	attrTypeMap[FLOAT_VEC2] = {
	  size: 8,
	  setter: floatAttribSetter
	};
	attrTypeMap[FLOAT_VEC3] = {
	  size: 12,
	  setter: floatAttribSetter
	};
	attrTypeMap[FLOAT_VEC4] = {
	  size: 16,
	  setter: floatAttribSetter
	};
	attrTypeMap[INT$3] = {
	  size: 4,
	  setter: intAttribSetter
	};
	attrTypeMap[INT_VEC2] = {
	  size: 8,
	  setter: intAttribSetter
	};
	attrTypeMap[INT_VEC3] = {
	  size: 12,
	  setter: intAttribSetter
	};
	attrTypeMap[INT_VEC4] = {
	  size: 16,
	  setter: intAttribSetter
	};
	attrTypeMap[UNSIGNED_INT$3] = {
	  size: 4,
	  setter: uintAttribSetter
	};
	attrTypeMap[UNSIGNED_INT_VEC2] = {
	  size: 8,
	  setter: uintAttribSetter
	};
	attrTypeMap[UNSIGNED_INT_VEC3] = {
	  size: 12,
	  setter: uintAttribSetter
	};
	attrTypeMap[UNSIGNED_INT_VEC4] = {
	  size: 16,
	  setter: uintAttribSetter
	};
	attrTypeMap[BOOL] = {
	  size: 4,
	  setter: intAttribSetter
	};
	attrTypeMap[BOOL_VEC2] = {
	  size: 8,
	  setter: intAttribSetter
	};
	attrTypeMap[BOOL_VEC3] = {
	  size: 12,
	  setter: intAttribSetter
	};
	attrTypeMap[BOOL_VEC4] = {
	  size: 16,
	  setter: intAttribSetter
	};
	attrTypeMap[FLOAT_MAT2] = {
	  size: 4,
	  setter: matAttribSetter,
	  count: 2
	};
	attrTypeMap[FLOAT_MAT3] = {
	  size: 9,
	  setter: matAttribSetter,
	  count: 3
	};
	attrTypeMap[FLOAT_MAT4] = {
	  size: 16,
	  setter: matAttribSetter,
	  count: 4
	};
	const errorRE = /ERROR:\s*\d+:(\d+)/gi;

	function addLineNumbersWithError(src, log = '', lineOffset = 0) {
	  // Note: Error message formats are not defined by any spec so this may or may not work.
	  const matches = [...log.matchAll(errorRE)];
	  const lineNoToErrorMap = new Map(matches.map((m, ndx) => {
	    const lineNo = parseInt(m[1]);
	    const next = matches[ndx + 1];
	    const end = next ? next.index : log.length;
	    const msg = log.substring(m.index, end);
	    return [lineNo - 1, msg];
	  }));
	  return src.split('\n').map((line, lineNo) => {
	    const err = lineNoToErrorMap.get(lineNo);
	    return `${lineNo + 1 + lineOffset}: ${line}${err ? `\n\n^^^ ${err}` : ''}`;
	  }).join('\n');
	}
	/**
	 * Error Callback
	 * @callback ErrorCallback
	 * @param {string} msg error message.
	 * @param {number} [lineOffset] amount to add to line number
	 * @memberOf module:twgl
	 */


	const spaceRE = /^[ \t]*\n/;
	/**
	 * Loads a shader.
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	 * @param {string} shaderSource The shader source.
	 * @param {number} shaderType The type of shader.
	 * @param {module:twgl.ErrorCallback} opt_errorCallback callback for errors.
	 * @return {WebGLShader} The created shader.
	 * @private
	 */

	function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
	  const errFn = opt_errorCallback || error$1; // Create the shader object

	  const shader = gl.createShader(shaderType); // Remove the first end of line because WebGL 2.0 requires
	  // #version 300 es
	  // as the first line. No whitespace allowed before that line
	  // so
	  //
	  // <script>
	  // #version 300 es
	  // </script>
	  //
	  // Has one line before it which is invalid according to GLSL ES 3.00
	  //

	  let lineOffset = 0;

	  if (spaceRE.test(shaderSource)) {
	    lineOffset = 1;
	    shaderSource = shaderSource.replace(spaceRE, '');
	  } // Load the shader source


	  gl.shaderSource(shader, shaderSource); // Compile the shader

	  gl.compileShader(shader); // Check the compile status

	  const compiled = gl.getShaderParameter(shader, COMPILE_STATUS);

	  if (!compiled) {
	    // Something went wrong during compilation; get the error
	    const lastError = gl.getShaderInfoLog(shader);
	    errFn(`${addLineNumbersWithError(shaderSource, lastError, lineOffset)}\nError compiling ${glEnumToString(gl, shaderType)}: ${lastError}`);
	    gl.deleteShader(shader);
	    return null;
	  }

	  return shader;
	}
	/**
	 * @typedef {Object} ProgramOptions
	 * @property {function(string)} [errorCallback] callback for errors
	 * @property {Object.<string,number>} [attribLocations] a attribute name to location map
	 * @property {(module:twgl.BufferInfo|Object.<string,module:twgl.AttribInfo>|string[])} [transformFeedbackVaryings] If passed
	 *   a BufferInfo will use the attribs names inside. If passed an object of AttribInfos will use the names from that object. Otherwise
	 *   you can pass an array of names.
	 * @property {number} [transformFeedbackMode] the mode to pass `gl.transformFeedbackVaryings`. Defaults to `SEPARATE_ATTRIBS`.
	 * @memberOf module:twgl
	 */

	/**
	 * Gets the program options based on all these optional arguments
	 * @param {module:twgl.ProgramOptions|string[]} [opt_attribs] Options for the program or an array of attribs names. Locations will be assigned by index if not passed in
	 * @param {number[]} [opt_locations] The locations for the. A parallel array to opt_attribs letting you assign locations.
	 * @param {module:twgl.ErrorCallback} [opt_errorCallback] callback for errors. By default it just prints an error to the console
	 *        on error. If you want something else pass an callback. It's passed an error message.
	 * @return {module:twgl.ProgramOptions} an instance of ProgramOptions based on the arguments passed in
	 * @private
	 */


	function getProgramOptions(opt_attribs, opt_locations, opt_errorCallback) {
	  let transformFeedbackVaryings;
	  let transformFeedbackMode;

	  if (typeof opt_locations === 'function') {
	    opt_errorCallback = opt_locations;
	    opt_locations = undefined;
	  }

	  if (typeof opt_attribs === 'function') {
	    opt_errorCallback = opt_attribs;
	    opt_attribs = undefined;
	  } else if (opt_attribs && !Array.isArray(opt_attribs)) {
	    // If we have an errorCallback we can just return this object
	    // Otherwise we need to construct one with default errorCallback
	    if (opt_attribs.errorCallback) {
	      return opt_attribs;
	    }

	    const opt = opt_attribs;
	    opt_errorCallback = opt.errorCallback;
	    opt_attribs = opt.attribLocations;
	    transformFeedbackVaryings = opt.transformFeedbackVaryings;
	    transformFeedbackMode = opt.transformFeedbackMode;
	  }

	  const options = {
	    errorCallback: opt_errorCallback || error$1,
	    transformFeedbackVaryings: transformFeedbackVaryings,
	    transformFeedbackMode: transformFeedbackMode
	  };

	  if (opt_attribs) {
	    let attribLocations = {};

	    if (Array.isArray(opt_attribs)) {
	      opt_attribs.forEach(function (attrib, ndx) {
	        attribLocations[attrib] = opt_locations ? opt_locations[ndx] : ndx;
	      });
	    } else {
	      attribLocations = opt_attribs;
	    }

	    options.attribLocations = attribLocations;
	  }

	  return options;
	}

	const defaultShaderType = ["VERTEX_SHADER", "FRAGMENT_SHADER"];

	function getShaderTypeFromScriptType(gl, scriptType) {
	  if (scriptType.indexOf("frag") >= 0) {
	    return FRAGMENT_SHADER;
	  } else if (scriptType.indexOf("vert") >= 0) {
	    return VERTEX_SHADER;
	  }

	  return undefined;
	}

	function deleteShaders(gl, shaders) {
	  shaders.forEach(function (shader) {
	    gl.deleteShader(shader);
	  });
	}
	/**
	 * Creates a program, attaches (and/or compiles) shaders, binds attrib locations, links the
	 * program and calls useProgram.
	 *
	 * NOTE: There are 4 signatures for this function
	 *
	 *     twgl.createProgram(gl, [vs, fs], options);
	 *     twgl.createProgram(gl, [vs, fs], opt_errFunc);
	 *     twgl.createProgram(gl, [vs, fs], opt_attribs, opt_errFunc);
	 *     twgl.createProgram(gl, [vs, fs], opt_attribs, opt_locations, opt_errFunc);
	 *
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	 * @param {WebGLShader[]|string[]} shaders The shaders to attach, or element ids for their source, or strings that contain their source
	 * @param {module:twgl.ProgramOptions|string[]|module:twgl.ErrorCallback} [opt_attribs] Options for the program or an array of attribs names or an error callback. Locations will be assigned by index if not passed in
	 * @param {number[]} [opt_locations|module:twgl.ErrorCallback] The locations for the. A parallel array to opt_attribs letting you assign locations or an error callback.
	 * @param {module:twgl.ErrorCallback} [opt_errorCallback] callback for errors. By default it just prints an error to the console
	 *        on error. If you want something else pass an callback. It's passed an error message.
	 * @return {WebGLProgram?} the created program or null if error.
	 * @memberOf module:twgl/programs
	 */


	function createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
	  const progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
	  const realShaders = [];
	  const newShaders = [];

	  for (let ndx = 0; ndx < shaders.length; ++ndx) {
	    let shader = shaders[ndx];

	    if (typeof shader === 'string') {
	      const elem = getElementById(shader);
	      const src = elem ? elem.text : shader;
	      let type = gl[defaultShaderType[ndx]];

	      if (elem && elem.type) {
	        type = getShaderTypeFromScriptType(gl, elem.type) || type;
	      }

	      shader = loadShader(gl, src, type, progOptions.errorCallback);
	      newShaders.push(shader);
	    }

	    if (isShader(gl, shader)) {
	      realShaders.push(shader);
	    }
	  }

	  if (realShaders.length !== shaders.length) {
	    progOptions.errorCallback("not enough shaders for program");
	    deleteShaders(gl, newShaders);
	    return null;
	  }

	  const program = gl.createProgram();
	  realShaders.forEach(function (shader) {
	    gl.attachShader(program, shader);
	  });

	  if (progOptions.attribLocations) {
	    Object.keys(progOptions.attribLocations).forEach(function (attrib) {
	      gl.bindAttribLocation(program, progOptions.attribLocations[attrib], attrib);
	    });
	  }

	  let varyings = progOptions.transformFeedbackVaryings;

	  if (varyings) {
	    if (varyings.attribs) {
	      varyings = varyings.attribs;
	    }

	    if (!Array.isArray(varyings)) {
	      varyings = Object.keys(varyings);
	    }

	    gl.transformFeedbackVaryings(program, varyings, progOptions.transformFeedbackMode || SEPARATE_ATTRIBS);
	  }

	  gl.linkProgram(program); // Check the link status

	  const linked = gl.getProgramParameter(program, LINK_STATUS);

	  if (!linked) {
	    // something went wrong with the link
	    const lastError = gl.getProgramInfoLog(program);
	    progOptions.errorCallback(`${realShaders.map(shader => {
      const src = addLineNumbersWithError(gl.getShaderSource(shader), '', 0);
      const type = gl.getShaderParameter(shader, gl.SHADER_TYPE);
      return `${glEnumToString(gl, type)}\n${src}}`;
    }).join('\n')}\nError in program linking: ${lastError}`);
	    gl.deleteProgram(program);
	    deleteShaders(gl, newShaders);
	    return null;
	  }

	  return program;
	}
	/**
	 * Creates a program from 2 sources.
	 *
	 * NOTE: There are 4 signatures for this function
	 *
	 *     twgl.createProgramFromSource(gl, [vs, fs], opt_options);
	 *     twgl.createProgramFromSource(gl, [vs, fs], opt_errFunc);
	 *     twgl.createProgramFromSource(gl, [vs, fs], opt_attribs, opt_errFunc);
	 *     twgl.createProgramFromSource(gl, [vs, fs], opt_attribs, opt_locations, opt_errFunc);
	 *
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext
	 *        to use.
	 * @param {string[]} shaderSources Array of sources for the
	 *        shaders. The first is assumed to be the vertex shader,
	 *        the second the fragment shader.
	 * @param {module:twgl.ProgramOptions|string[]|module:twgl.ErrorCallback} [opt_attribs] Options for the program or an array of attribs names or an error callback. Locations will be assigned by index if not passed in
	 * @param {number[]} [opt_locations|module:twgl.ErrorCallback] The locations for the. A parallel array to opt_attribs letting you assign locations or an error callback.
	 * @param {module:twgl.ErrorCallback} [opt_errorCallback] callback for errors. By default it just prints an error to the console
	 *        on error. If you want something else pass an callback. It's passed an error message.
	 * @return {WebGLProgram?} the created program or null if error.
	 * @memberOf module:twgl/programs
	 */


	function createProgramFromSources(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
	  const progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
	  const shaders = [];

	  for (let ii = 0; ii < shaderSources.length; ++ii) {
	    const shader = loadShader(gl, shaderSources[ii], gl[defaultShaderType[ii]], progOptions.errorCallback);

	    if (!shader) {
	      return null;
	    }

	    shaders.push(shader);
	  }

	  return createProgram(gl, shaders, progOptions);
	}
	/**
	 * Returns true if attribute/uniform is a reserved/built in
	 *
	 * It makes no sense to me why GL returns these because it's
	 * illegal to call `gl.getUniformLocation` and `gl.getAttribLocation`
	 * with names that start with `gl_` (and `webgl_` in WebGL)
	 *
	 * I can only assume they are there because they might count
	 * when computing the number of uniforms/attributes used when you want to
	 * know if you are near the limit. That doesn't really make sense
	 * to me but the fact that these get returned are in the spec.
	 *
	 * @param {WebGLActiveInfo} info As returned from `gl.getActiveUniform` or
	 *    `gl.getActiveAttrib`.
	 * @return {bool} true if it's reserved
	 * @private
	 */


	function isBuiltIn(info) {
	  const name = info.name;
	  return name.startsWith("gl_") || name.startsWith("webgl_");
	}

	const tokenRE = /(\.|\[|]|\w+)/g;

	const isDigit = s => s >= '0' && s <= '9';

	function addSetterToUniformTree(fullPath, setter, node, uniformSetters) {
	  const tokens = fullPath.split(tokenRE).filter(s => s !== '');
	  let tokenNdx = 0;
	  let path = '';

	  for (;;) {
	    const token = tokens[tokenNdx++]; // has to be name or number

	    path += token;
	    const isArrayIndex = isDigit(token[0]);
	    const accessor = isArrayIndex ? parseInt(token) : token;

	    if (isArrayIndex) {
	      path += tokens[tokenNdx++]; // skip ']'
	    }

	    const isLastToken = tokenNdx === tokens.length;

	    if (isLastToken) {
	      node[accessor] = setter;
	      break;
	    } else {
	      const token = tokens[tokenNdx++]; // has to be . or [

	      const isArray = token === '[';
	      const child = node[accessor] || (isArray ? [] : {});
	      node[accessor] = child;
	      node = child;

	      uniformSetters[path] = uniformSetters[path] || function (node) {
	        return function (value) {
	          setUniformTree(node, value);
	        };
	      }(child);

	      path += token;
	    }
	  }
	}
	/**
	 * Creates setter functions for all uniforms of a shader
	 * program.
	 *
	 * @see {@link module:twgl.setUniforms}
	 *
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	 * @param {WebGLProgram} program the program to create setters for.
	 * @returns {Object.<string, function>} an object with a setter by name for each uniform
	 * @memberOf module:twgl/programs
	 */


	function createUniformSetters(gl, program) {
	  let textureUnit = 0;
	  /**
	   * Creates a setter for a uniform of the given program with it's
	   * location embedded in the setter.
	   * @param {WebGLProgram} program
	   * @param {WebGLUniformInfo} uniformInfo
	   * @returns {function} the created setter.
	   */

	  function createUniformSetter(program, uniformInfo, location) {
	    const isArray = uniformInfo.name.endsWith("[0]");
	    const type = uniformInfo.type;
	    const typeInfo = typeMap[type];

	    if (!typeInfo) {
	      throw new Error(`unknown type: 0x${type.toString(16)}`); // we should never get here.
	    }

	    let setter;

	    if (typeInfo.bindPoint) {
	      // it's a sampler
	      const unit = textureUnit;
	      textureUnit += uniformInfo.size;

	      if (isArray) {
	        setter = typeInfo.arraySetter(gl, type, unit, location, uniformInfo.size);
	      } else {
	        setter = typeInfo.setter(gl, type, unit, location, uniformInfo.size);
	      }
	    } else {
	      if (typeInfo.arraySetter && isArray) {
	        setter = typeInfo.arraySetter(gl, location);
	      } else {
	        setter = typeInfo.setter(gl, location);
	      }
	    }

	    setter.location = location;
	    return setter;
	  }

	  const uniformSetters = {};
	  const uniformTree = {};
	  const numUniforms = gl.getProgramParameter(program, ACTIVE_UNIFORMS);

	  for (let ii = 0; ii < numUniforms; ++ii) {
	    const uniformInfo = gl.getActiveUniform(program, ii);

	    if (isBuiltIn(uniformInfo)) {
	      continue;
	    }

	    let name = uniformInfo.name; // remove the array suffix.

	    if (name.endsWith("[0]")) {
	      name = name.substr(0, name.length - 3);
	    }

	    const location = gl.getUniformLocation(program, uniformInfo.name); // the uniform will have no location if it's in a uniform block

	    if (location) {
	      const setter = createUniformSetter(program, uniformInfo, location);
	      uniformSetters[name] = setter;
	      addSetterToUniformTree(name, setter, uniformTree, uniformSetters);
	    }
	  }

	  return uniformSetters;
	}
	/**
	 * @typedef {Object} TransformFeedbackInfo
	 * @property {number} index index of transform feedback
	 * @property {number} type GL type
	 * @property {number} size 1 - 4
	 * @memberOf module:twgl
	 */

	/**
	 * Create TransformFeedbackInfo for passing to bindTransformFeedbackInfo.
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	 * @param {WebGLProgram} program an existing WebGLProgram.
	 * @return {Object<string, module:twgl.TransformFeedbackInfo>}
	 * @memberOf module:twgl
	 */


	function createTransformFeedbackInfo(gl, program) {
	  const info = {};
	  const numVaryings = gl.getProgramParameter(program, TRANSFORM_FEEDBACK_VARYINGS);

	  for (let ii = 0; ii < numVaryings; ++ii) {
	    const varying = gl.getTransformFeedbackVarying(program, ii);
	    info[varying.name] = {
	      index: ii,
	      type: varying.type,
	      size: varying.size
	    };
	  }

	  return info;
	}
	/**
	 * @typedef {Object} UniformData
	 * @property {string} name The name of the uniform
	 * @property {number} type The WebGL type enum for this uniform
	 * @property {number} size The number of elements for this uniform
	 * @property {number} blockNdx The block index this uniform appears in
	 * @property {number} offset The byte offset in the block for this uniform's value
	 * @memberOf module:twgl
	 */

	/**
	 * The specification for one UniformBlockObject
	 *
	 * @typedef {Object} BlockSpec
	 * @property {number} index The index of the block.
	 * @property {number} size The size in bytes needed for the block
	 * @property {number[]} uniformIndices The indices of the uniforms used by the block. These indices
	 *    correspond to entries in a UniformData array in the {@link module:twgl.UniformBlockSpec}.
	 * @property {bool} usedByVertexShader Self explanatory
	 * @property {bool} usedByFragmentShader Self explanatory
	 * @property {bool} used Self explanatory
	 * @memberOf module:twgl
	 */

	/**
	 * A `UniformBlockSpec` represents the data needed to create and bind
	 * UniformBlockObjects for a given program
	 *
	 * @typedef {Object} UniformBlockSpec
	 * @property {Object.<string, module:twgl.BlockSpec>} blockSpecs The BlockSpec for each block by block name
	 * @property {UniformData[]} uniformData An array of data for each uniform by uniform index.
	 * @memberOf module:twgl
	 */

	/**
	 * Creates a UniformBlockSpec for the given program.
	 *
	 * A UniformBlockSpec represents the data needed to create and bind
	 * UniformBlockObjects
	 *
	 * @param {WebGL2RenderingContext} gl A WebGL2 Rendering Context
	 * @param {WebGLProgram} program A WebGLProgram for a successfully linked program
	 * @return {module:twgl.UniformBlockSpec} The created UniformBlockSpec
	 * @memberOf module:twgl/programs
	 */


	function createUniformBlockSpecFromProgram(gl, program) {
	  const numUniforms = gl.getProgramParameter(program, ACTIVE_UNIFORMS);
	  const uniformData = [];
	  const uniformIndices = [];

	  for (let ii = 0; ii < numUniforms; ++ii) {
	    uniformIndices.push(ii);
	    uniformData.push({});
	    const uniformInfo = gl.getActiveUniform(program, ii);
	    uniformData[ii].name = uniformInfo.name;
	  }

	  [["UNIFORM_TYPE", "type"], ["UNIFORM_SIZE", "size"], // num elements
	  ["UNIFORM_BLOCK_INDEX", "blockNdx"], ["UNIFORM_OFFSET", "offset"]].forEach(function (pair) {
	    const pname = pair[0];
	    const key = pair[1];
	    gl.getActiveUniforms(program, uniformIndices, gl[pname]).forEach(function (value, ndx) {
	      uniformData[ndx][key] = value;
	    });
	  });
	  const blockSpecs = {};
	  const numUniformBlocks = gl.getProgramParameter(program, ACTIVE_UNIFORM_BLOCKS);

	  for (let ii = 0; ii < numUniformBlocks; ++ii) {
	    const name = gl.getActiveUniformBlockName(program, ii);
	    const blockSpec = {
	      index: gl.getUniformBlockIndex(program, name),
	      usedByVertexShader: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
	      usedByFragmentShader: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
	      size: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_DATA_SIZE),
	      uniformIndices: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
	    };
	    blockSpec.used = blockSpec.usedByVertexShader || blockSpec.usedByFragmentShader;
	    blockSpecs[name] = blockSpec;
	  }

	  return {
	    blockSpecs: blockSpecs,
	    uniformData: uniformData
	  };
	}

	function setUniformTree(tree, values) {
	  for (const name in values) {
	    const prop = tree[name];

	    if (typeof prop === 'function') {
	      prop(values[name]);
	    } else {
	      setUniformTree(tree[name], values[name]);
	    }
	  }
	}
	/**
	 * Set uniforms and binds related textures.
	 *
	 * example:
	 *
	 *     const programInfo = createProgramInfo(
	 *         gl, ["some-vs", "some-fs"]);
	 *
	 *     const tex1 = gl.createTexture();
	 *     const tex2 = gl.createTexture();
	 *
	 *     ... assume we setup the textures with data ...
	 *
	 *     const uniforms = {
	 *       u_someSampler: tex1,
	 *       u_someOtherSampler: tex2,
	 *       u_someColor: [1,0,0,1],
	 *       u_somePosition: [0,1,1],
	 *       u_someMatrix: [
	 *         1,0,0,0,
	 *         0,1,0,0,
	 *         0,0,1,0,
	 *         0,0,0,0,
	 *       ],
	 *     };
	 *
	 *     gl.useProgram(program);
	 *
	 * This will automatically bind the textures AND set the
	 * uniforms.
	 *
	 *     twgl.setUniforms(programInfo, uniforms);
	 *
	 * For the example above it is equivalent to
	 *
	 *     var texUnit = 0;
	 *     gl.activeTexture(gl.TEXTURE0 + texUnit);
	 *     gl.bindTexture(gl.TEXTURE_2D, tex1);
	 *     gl.uniform1i(u_someSamplerLocation, texUnit++);
	 *     gl.activeTexture(gl.TEXTURE0 + texUnit);
	 *     gl.bindTexture(gl.TEXTURE_2D, tex2);
	 *     gl.uniform1i(u_someSamplerLocation, texUnit++);
	 *     gl.uniform4fv(u_someColorLocation, [1, 0, 0, 1]);
	 *     gl.uniform3fv(u_somePositionLocation, [0, 1, 1]);
	 *     gl.uniformMatrix4fv(u_someMatrix, false, [
	 *         1,0,0,0,
	 *         0,1,0,0,
	 *         0,0,1,0,
	 *         0,0,0,0,
	 *       ]);
	 *
	 * Note it is perfectly reasonable to call `setUniforms` multiple times. For example
	 *
	 *     const uniforms = {
	 *       u_someSampler: tex1,
	 *       u_someOtherSampler: tex2,
	 *     };
	 *
	 *     const moreUniforms {
	 *       u_someColor: [1,0,0,1],
	 *       u_somePosition: [0,1,1],
	 *       u_someMatrix: [
	 *         1,0,0,0,
	 *         0,1,0,0,
	 *         0,0,1,0,
	 *         0,0,0,0,
	 *       ],
	 *     };
	 *
	 *     twgl.setUniforms(programInfo, uniforms);
	 *     twgl.setUniforms(programInfo, moreUniforms);
	 *
	 * You can also add WebGLSamplers to uniform samplers as in
	 *
	 *     const uniforms = {
	 *       u_someSampler: {
	 *         texture: someWebGLTexture,
	 *         sampler: someWebGLSampler,
	 *       },
	 *     };
	 *
	 * In which case both the sampler and texture will be bound to the
	 * same unit.
	 *
	 * @param {(module:twgl.ProgramInfo|Object.<string, function>)} setters a `ProgramInfo` as returned from `createProgramInfo` or the setters returned from
	 *        `createUniformSetters`.
	 * @param {Object.<string, ?>} values an object with values for the
	 *        uniforms.
	 *   You can pass multiple objects by putting them in an array or by calling with more arguments.For example
	 *
	 *     const sharedUniforms = {
	 *       u_fogNear: 10,
	 *       u_projection: ...
	 *       ...
	 *     };
	 *
	 *     const localUniforms = {
	 *       u_world: ...
	 *       u_diffuseColor: ...
	 *     };
	 *
	 *     twgl.setUniforms(programInfo, sharedUniforms, localUniforms);
	 *
	 *     // is the same as
	 *
	 *     twgl.setUniforms(programInfo, [sharedUniforms, localUniforms]);
	 *
	 *     // is the same as
	 *
	 *     twgl.setUniforms(programInfo, sharedUniforms);
	 *     twgl.setUniforms(programInfo, localUniforms};
	 *
	 *   You can also fill out structure and array values either via
	 *   shortcut. Example
	 *
	 *     // -- in shader --
	 *     struct Light {
	 *       float intensity;
	 *       vec4 color;
	 *     };
	 *     uniform Light lights[2];
	 *
	 *     // in JavaScript
	 *
	 *     twgl.setUniforms(programInfo, {
	 *       lights: [
	 *         { intensity: 5.0, color: [1, 0, 0, 1] },
	 *         { intensity: 2.0, color: [0, 0, 1, 1] },
	 *       ],
	 *     });
	 *
	 *   or the more traditional way
	 *
	 *     twgl.setUniforms(programInfo, {
	 *       "lights[0].intensity": 5.0,
	 *       "lights[0].color": [1, 0, 0, 1],
	 *       "lights[1].intensity": 2.0,
	 *       "lights[1].color": [0, 0, 1, 1],
	 *     });
	 *
	 *   You can also specify partial paths
	 *
	 *     twgl.setUniforms(programInfo, {
	 *       'lights[1]: { intensity: 5.0, color: [1, 0, 0, 1] },
	 *     });
	 *
	 *   But you can not specify leaf array indices
	 *
	 * @memberOf module:twgl/programs
	 */


	function setUniforms(setters, ...args) {
	  // eslint-disable-line
	  const actualSetters = setters.uniformSetters || setters;
	  const numArgs = args.length;

	  for (let aNdx = 0; aNdx < numArgs; ++aNdx) {
	    const values = args[aNdx];

	    if (Array.isArray(values)) {
	      const numValues = values.length;

	      for (let ii = 0; ii < numValues; ++ii) {
	        setUniforms(actualSetters, values[ii]);
	      }
	    } else {
	      for (const name in values) {
	        const setter = actualSetters[name];

	        if (setter) {
	          setter(values[name]);
	        }
	      }
	    }
	  }
	}
	/**
	 * Creates setter functions for all attributes of a shader
	 * program. You can pass this to {@link module:twgl.setBuffersAndAttributes} to set all your buffers and attributes.
	 *
	 * @see {@link module:twgl.setAttributes} for example
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to use.
	 * @param {WebGLProgram} program the program to create setters for.
	 * @return {Object.<string, function>} an object with a setter for each attribute by name.
	 * @memberOf module:twgl/programs
	 */

	function createAttributeSetters(gl, program) {
	  const attribSetters = {};
	  const numAttribs = gl.getProgramParameter(program, ACTIVE_ATTRIBUTES);

	  for (let ii = 0; ii < numAttribs; ++ii) {
	    const attribInfo = gl.getActiveAttrib(program, ii);

	    if (isBuiltIn(attribInfo)) {
	      continue;
	    }

	    const index = gl.getAttribLocation(program, attribInfo.name);
	    const typeInfo = attrTypeMap[attribInfo.type];
	    const setter = typeInfo.setter(gl, index, typeInfo);
	    setter.location = index;
	    attribSetters[attribInfo.name] = setter;
	  }

	  return attribSetters;
	}
	/**
	 * Sets attributes and binds buffers (deprecated... use {@link module:twgl.setBuffersAndAttributes})
	 *
	 * Example:
	 *
	 *     const program = createProgramFromScripts(
	 *         gl, ["some-vs", "some-fs");
	 *
	 *     const attribSetters = createAttributeSetters(program);
	 *
	 *     const positionBuffer = gl.createBuffer();
	 *     const texcoordBuffer = gl.createBuffer();
	 *
	 *     const attribs = {
	 *       a_position: {buffer: positionBuffer, numComponents: 3},
	 *       a_texcoord: {buffer: texcoordBuffer, numComponents: 2},
	 *     };
	 *
	 *     gl.useProgram(program);
	 *
	 * This will automatically bind the buffers AND set the
	 * attributes.
	 *
	 *     setAttributes(attribSetters, attribs);
	 *
	 * Properties of attribs. For each attrib you can add
	 * properties:
	 *
	 * *   type: the type of data in the buffer. Default = gl.FLOAT
	 * *   normalize: whether or not to normalize the data. Default = false
	 * *   stride: the stride. Default = 0
	 * *   offset: offset into the buffer. Default = 0
	 * *   divisor: the divisor for instances. Default = undefined
	 *
	 * For example if you had 3 value float positions, 2 value
	 * float texcoord and 4 value uint8 colors you'd setup your
	 * attribs like this
	 *
	 *     const attribs = {
	 *       a_position: {buffer: positionBuffer, numComponents: 3},
	 *       a_texcoord: {buffer: texcoordBuffer, numComponents: 2},
	 *       a_color: {
	 *         buffer: colorBuffer,
	 *         numComponents: 4,
	 *         type: gl.UNSIGNED_BYTE,
	 *         normalize: true,
	 *       },
	 *     };
	 *
	 * @param {Object.<string, function>} setters Attribute setters as returned from createAttributeSetters
	 * @param {Object.<string, module:twgl.AttribInfo>} buffers AttribInfos mapped by attribute name.
	 * @memberOf module:twgl/programs
	 * @deprecated use {@link module:twgl.setBuffersAndAttributes}
	 */


	function setAttributes(setters, buffers) {
	  for (const name in buffers) {
	    const setter = setters[name];

	    if (setter) {
	      setter(buffers[name]);
	    }
	  }
	}
	/**
	 * Sets attributes and buffers including the `ELEMENT_ARRAY_BUFFER` if appropriate
	 *
	 * Example:
	 *
	 *     const programInfo = createProgramInfo(
	 *         gl, ["some-vs", "some-fs");
	 *
	 *     const arrays = {
	 *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
	 *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
	 *     };
	 *
	 *     const bufferInfo = createBufferInfoFromArrays(gl, arrays);
	 *
	 *     gl.useProgram(programInfo.program);
	 *
	 * This will automatically bind the buffers AND set the
	 * attributes.
	 *
	 *     setBuffersAndAttributes(gl, programInfo, bufferInfo);
	 *
	 * For the example above it is equivalent to
	 *
	 *     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	 *     gl.enableVertexAttribArray(a_positionLocation);
	 *     gl.vertexAttribPointer(a_positionLocation, 3, gl.FLOAT, false, 0, 0);
	 *     gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	 *     gl.enableVertexAttribArray(a_texcoordLocation);
	 *     gl.vertexAttribPointer(a_texcoordLocation, 4, gl.FLOAT, false, 0, 0);
	 *
	 * @param {WebGLRenderingContext} gl A WebGLRenderingContext.
	 * @param {(module:twgl.ProgramInfo|Object.<string, function>)} setters A `ProgramInfo` as returned from {@link module:twgl.createProgramInfo} or Attribute setters as returned from {@link module:twgl.createAttributeSetters}
	 * @param {(module:twgl.BufferInfo|module:twgl.VertexArrayInfo)} buffers a `BufferInfo` as returned from {@link module:twgl.createBufferInfoFromArrays}.
	 *   or a `VertexArrayInfo` as returned from {@link module:twgl.createVertexArrayInfo}
	 * @memberOf module:twgl/programs
	 */


	function setBuffersAndAttributes(gl, programInfo, buffers) {
	  if (buffers.vertexArrayObject) {
	    gl.bindVertexArray(buffers.vertexArrayObject);
	  } else {
	    setAttributes(programInfo.attribSetters || programInfo, buffers.attribs);

	    if (buffers.indices) {
	      gl.bindBuffer(ELEMENT_ARRAY_BUFFER$1, buffers.indices);
	    }
	  }
	}
	/**
	 * @typedef {Object} ProgramInfo
	 * @property {WebGLProgram} program A shader program
	 * @property {Object<string, function>} uniformSetters object of setters as returned from createUniformSetters,
	 * @property {Object<string, function>} attribSetters object of setters as returned from createAttribSetters,
	 * @property {module:twgl.UniformBlockSpec} [uniformBlockSpec] a uniform block spec for making UniformBlockInfos with createUniformBlockInfo etc..
	 * @property {Object<string, module:twgl.TransformFeedbackInfo>} [transformFeedbackInfo] info for transform feedbacks
	 * @memberOf module:twgl
	 */

	/**
	 * Creates a ProgramInfo from an existing program.
	 *
	 * A ProgramInfo contains
	 *
	 *     programInfo = {
	 *        program: WebGLProgram,
	 *        uniformSetters: object of setters as returned from createUniformSetters,
	 *        attribSetters: object of setters as returned from createAttribSetters,
	 *     }
	 *
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext
	 *        to use.
	 * @param {WebGLProgram} program an existing WebGLProgram.
	 * @return {module:twgl.ProgramInfo} The created ProgramInfo.
	 * @memberOf module:twgl/programs
	 */


	function createProgramInfoFromProgram(gl, program) {
	  const uniformSetters = createUniformSetters(gl, program);
	  const attribSetters = createAttributeSetters(gl, program);
	  const programInfo = {
	    program,
	    uniformSetters,
	    attribSetters
	  };

	  if (isWebGL2(gl)) {
	    programInfo.uniformBlockSpec = createUniformBlockSpecFromProgram(gl, program);
	    programInfo.transformFeedbackInfo = createTransformFeedbackInfo(gl, program);
	  }

	  return programInfo;
	}
	/**
	 * Creates a ProgramInfo from 2 sources.
	 *
	 * A ProgramInfo contains
	 *
	 *     programInfo = {
	 *        program: WebGLProgram,
	 *        uniformSetters: object of setters as returned from createUniformSetters,
	 *        attribSetters: object of setters as returned from createAttribSetters,
	 *     }
	 *
	 * NOTE: There are 4 signatures for this function
	 *
	 *     twgl.createProgramInfo(gl, [vs, fs], options);
	 *     twgl.createProgramInfo(gl, [vs, fs], opt_errFunc);
	 *     twgl.createProgramInfo(gl, [vs, fs], opt_attribs, opt_errFunc);
	 *     twgl.createProgramInfo(gl, [vs, fs], opt_attribs, opt_locations, opt_errFunc);
	 *
	 * @param {WebGLRenderingContext} gl The WebGLRenderingContext
	 *        to use.
	 * @param {string[]} shaderSources Array of sources for the
	 *        shaders or ids. The first is assumed to be the vertex shader,
	 *        the second the fragment shader.
	 * @param {module:twgl.ProgramOptions|string[]|module:twgl.ErrorCallback} [opt_attribs] Options for the program or an array of attribs names or an error callback. Locations will be assigned by index if not passed in
	 * @param {number[]} [opt_locations|module:twgl.ErrorCallback] The locations for the. A parallel array to opt_attribs letting you assign locations or an error callback.
	 * @param {module:twgl.ErrorCallback} [opt_errorCallback] callback for errors. By default it just prints an error to the console
	 *        on error. If you want something else pass an callback. It's passed an error message.
	 * @return {module:twgl.ProgramInfo?} The created ProgramInfo or null if it failed to link or compile
	 * @memberOf module:twgl/programs
	 */


	function createProgramInfo(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
	  const progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
	  let good = true;
	  shaderSources = shaderSources.map(function (source) {
	    // Lets assume if there is no \n it's an id
	    if (source.indexOf("\n") < 0) {
	      const script = getElementById(source);

	      if (!script) {
	        progOptions.errorCallback("no element with id: " + source);
	        good = false;
	      } else {
	        source = script.text;
	      }
	    }

	    return source;
	  });

	  if (!good) {
	    return null;
	  }

	  const program = createProgramFromSources(gl, shaderSources, progOptions);

	  if (!program) {
	    return null;
	  }

	  return createProgramInfoFromProgram(gl, program);
	}
	/*
	 * Copyright 2019 Gregg Tavares
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a
	 * copy of this software and associated documentation files (the "Software"),
	 * to deal in the Software without restriction, including without limitation
	 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
	 * and/or sell copies of the Software, and to permit persons to whom the
	 * Software is furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
	 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
	 * DEALINGS IN THE SOFTWARE.
	 */

	const TRIANGLES = 0x0004;
	const UNSIGNED_SHORT$3 = 0x1403;
	/**
	 * Drawing related functions
	 *
	 * For backward compatibility they are available at both `twgl.draw` and `twgl`
	 * itself
	 *
	 * See {@link module:twgl} for core functions
	 *
	 * @module twgl/draw
	 */

	/**
	 * Calls `gl.drawElements` or `gl.drawArrays`, whichever is appropriate
	 *
	 * normally you'd call `gl.drawElements` or `gl.drawArrays` yourself
	 * but calling this means if you switch from indexed data to non-indexed
	 * data you don't have to remember to update your draw call.
	 *
	 * @param {WebGLRenderingContext} gl A WebGLRenderingContext
	 * @param {(module:twgl.BufferInfo|module:twgl.VertexArrayInfo)} bufferInfo A BufferInfo as returned from {@link module:twgl.createBufferInfoFromArrays} or
	 *   a VertexArrayInfo as returned from {@link module:twgl.createVertexArrayInfo}
	 * @param {number} [type] eg (gl.TRIANGLES, gl.LINES, gl.POINTS, gl.TRIANGLE_STRIP, ...). Defaults to `gl.TRIANGLES`
	 * @param {number} [count] An optional count. Defaults to bufferInfo.numElements
	 * @param {number} [offset] An optional offset. Defaults to 0.
	 * @param {number} [instanceCount] An optional instanceCount. if set then `drawArraysInstanced` or `drawElementsInstanced` will be called
	 * @memberOf module:twgl/draw
	 */

	function drawBufferInfo(gl, bufferInfo, type, count, offset, instanceCount) {
	  type = type === undefined ? TRIANGLES : type;
	  const indices = bufferInfo.indices;
	  const elementType = bufferInfo.elementType;
	  const numElements = count === undefined ? bufferInfo.numElements : count;
	  offset = offset === undefined ? 0 : offset;

	  if (elementType || indices) {
	    if (instanceCount !== undefined) {
	      gl.drawElementsInstanced(type, numElements, elementType === undefined ? UNSIGNED_SHORT$3 : bufferInfo.elementType, offset, instanceCount);
	    } else {
	      gl.drawElements(type, numElements, elementType === undefined ? UNSIGNED_SHORT$3 : bufferInfo.elementType, offset);
	    }
	  } else {
	    if (instanceCount !== undefined) {
	      gl.drawArraysInstanced(type, offset, numElements, instanceCount);
	    } else {
	      gl.drawArrays(type, offset, numElements);
	    }
	  }
	}
	/**
	 * Resize a canvas to match the size it's displayed.
	 * @param {HTMLCanvasElement} canvas The canvas to resize.
	 * @param {number} [multiplier] So you can pass in `window.devicePixelRatio` or other scale value if you want to.
	 * @return {boolean} true if the canvas was resized.
	 * @memberOf module:twgl
	 */


	function resizeCanvasToDisplaySize(canvas, multiplier) {
	  multiplier = multiplier || 1;
	  multiplier = Math.max(0, multiplier);
	  const width = canvas.clientWidth * multiplier | 0;
	  const height = canvas.clientHeight * multiplier | 0;

	  if (canvas.width !== width || canvas.height !== height) {
	    canvas.width = width;
	    canvas.height = height;
	    return true;
	  }

	  return false;
	}

	var FullScreenQuad = {
	  position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]
	};

	var Random = "\n#ifndef RAND\n#define RAND\nfloat rand(vec2 co){\n    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);\n}\n#endif\n\n#ifndef HASH_3\n#define HASH_3\n\n// vec3 hash( vec3 x, int k )\n// {\n//     x = ((x>>8U)^x.yzx)*k;\n//     x = ((x>>8U)^x.yzx)*k;\n//     x = ((x>>8U)^x.yzx)*k;\n    \n//     return vec3(x)*(1.0/float(0xffffffffU));\n// }\n\n#endif\n\n";

	var LabColorSpace = "\n#ifndef LAB_COLORSPACE\n#define LAB_COLORSPACE\n\n#ifndef saturate\n#define saturate(v) clamp(v, 0.,1.)\n#endif\n\n".concat(Random, "\n\n//Lifted from https://code.google.com/p/flowabs/source/browse/glsl/?r=f36cbdcf7790a28d90f09e2cf89ec9a64911f138\nvec3 lab2xyz( vec3 c ) {\n    float fy = ( c.x + 16.0 ) / 116.0;\n    float fx = c.y / 500.0 + fy;\n    float fz = fy - c.z / 200.0;\n    return vec3(\n         95.047 * (( fx > 0.206897 ) ? fx * fx * fx : ( fx - 16.0 / 116.0 ) / 7.787),\n        100.000 * (( fy > 0.206897 ) ? fy * fy * fy : ( fy - 16.0 / 116.0 ) / 7.787),\n        108.883 * (( fz > 0.206897 ) ? fz * fz * fz : ( fz - 16.0 / 116.0 ) / 7.787)\n    );\n}\n\nvec3 xyz2rgb( vec3 c ) {\n    vec3 v =  c / 100.0 * mat3( \n        3.2406, -1.5372, -0.4986,\n        -0.9689, 1.8758, 0.0415,\n        0.0557, -0.2040, 1.0570\n    );\n    vec3 r;\n    r.x = ( v.r > 0.0031308 ) ? (( 1.055 * pow( v.r, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.r;\n    r.y = ( v.g > 0.0031308 ) ? (( 1.055 * pow( v.g, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.g;\n    r.z = ( v.b > 0.0031308 ) ? (( 1.055 * pow( v.b, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.b;\n    return r;\n}\n\nvec3 rgb2xyz( vec3 c ) {\n    vec3 tmp;\n    tmp.x = ( c.r > 0.04045 ) ? pow( ( c.r + 0.055 ) / 1.055, 2.4 ) : c.r / 12.92;\n    tmp.y = ( c.g > 0.04045 ) ? pow( ( c.g + 0.055 ) / 1.055, 2.4 ) : c.g / 12.92,\n    tmp.z = ( c.b > 0.04045 ) ? pow( ( c.b + 0.055 ) / 1.055, 2.4 ) : c.b / 12.92;\n    return 100.0 * tmp *\n        mat3( 0.4124, 0.3576, 0.1805,\n              0.2126, 0.7152, 0.0722,\n              0.0193, 0.1192, 0.9505 );\n}\n\nvec3 xyz2lab( vec3 c ) {\n    vec3 n = c / vec3( 95.047, 100, 108.883 );\n    vec3 v;\n    v.x = ( n.x > 0.008856 ) ? pow( n.x, 1.0 / 3.0 ) : ( 7.787 * n.x ) + ( 16.0 / 116.0 );\n    v.y = ( n.y > 0.008856 ) ? pow( n.y, 1.0 / 3.0 ) : ( 7.787 * n.y ) + ( 16.0 / 116.0 );\n    v.z = ( n.z > 0.008856 ) ? pow( n.z, 1.0 / 3.0 ) : ( 7.787 * n.z ) + ( 16.0 / 116.0 );\n    return vec3(( 116.0 * v.y ) - 16.0, 500.0 * ( v.x - v.y ), 200.0 * ( v.y - v.z ));\n}\n\nvec3 rgb2lab(vec3 c) {\n    vec3 lab = xyz2lab( rgb2xyz( c ) );\n    return vec3( lab.x / 100.0, 0.5 + 0.5 * ( lab.y / 127.0 ), 0.5 + 0.5 * ( lab.z / 127.0 ));\n}\n\nvec3 lab2rgb(vec3 c) {\n    return xyz2rgb( lab2xyz( vec3(100.0 * c.x, 2.0 * 127.0 * (c.y - 0.5), 2.0 * 127.0 * (c.z - 0.5)) ) );\n}\n\nvec3 lab2rgb2(vec3 c)\n{\n    float l = c.r;\n    float a = c.g;\n    float b = c.b;\n\n    vec3 rgb = vec3(0.);\n\n    float y = (l+16.)/116.;\n    float x = a/500. + y;\n    float z = y - b/200.;\n\n    y = pow(y, 3.) > 0.008856 ? pow(y,3.) : (y-16./116.)/7.787;\n    x = pow(x, 3.) > 0.008856 ? pow(x,3.) : (x-16./116.)/7.787;\n    z = pow(z, 3.) > 0.008856 ? pow(z,3.) : (z-16./116.)/7.787;\n\n    x *= 95.047;\n    y *= 100.;\n    z *= 108.883;\n\n    x /= 100.;\n    y /= 100.;\n    z /= 100.;\n\n    float R = x *  3.2406 + y * -1.5372 + z * -0.4986;\n    float G = x * -0.9689 + y *  1.8758 + z *  0.0415;\n    float B = x *  0.0557 + y * -0.2040 + z *  1.0570;\n\n    R = R > 0.0031308 ? 1.055 * pow(R , ( 1. / 2.4 ))  - 0.055 : 12.92 * R;\n    G = G > 0.0031308 ? 1.055 * pow(G , ( 1. / 2.4 ))  - 0.055 : 12.92 * G;\n    B = B > 0.0031308 ? 1.055 * pow(B , ( 1. / 2.4 ))  - 0.055 : 12.92 * B;\n\n    return vec3(R, G, B);\n\n}\n\nvec3 oklab_mix_2(vec3 colA, vec3 colB, float h)\n{\n    return lab2rgb(mix(rgb2lab(colA), rgb2lab(colB), h));\n}\n\n// See here: https://www.shadertoy.com/view/ttcyRS\nvec3 oklab_mix( vec3 colA, vec3 colB, float h )\n{\n    // https://bottosson.github.io/posts/oklab\n    const mat3 kCONEtoLMS = mat3(                \n         0.4121656120,  0.2118591070,  0.0883097947,\n         0.5362752080,  0.6807189584,  0.2818474174,\n         0.0514575653,  0.1074065790,  0.6302613616);\n    const mat3 kLMStoCONE = mat3(\n         4.0767245293, -1.2681437731, -0.0041119885,\n        -3.3072168827,  2.6093323231, -0.7034763098,\n         0.2307590544, -0.3411344290,  1.7068625689);\n                    \n    // rgb to cone (arg of pow can't be negative)\n    vec3 lmsA = pow( kCONEtoLMS*colA, vec3(1.0/3.0) );\n    vec3 lmsB = pow( kCONEtoLMS*colB, vec3(1.0/3.0) );\n    // lerp\n    vec3 lms = mix( lmsA, lmsB, h );\n    // gain in the middle (no oaklab anymore, but looks better?)\n lms *= 1.0+0.2*h*(1.0-h);\n    // cone to rgb\n    return kLMStoCONE*(lms*lms*lms);\n}\n#endif\n");

	var FragGradientLab = "\n#version 300 es\nprecision highp float;\n\n#define linearstep(edge0, edge1, x) min(max((x - edge0)/(edge1 - edge0), 0.0), 1.0)\n\n".concat(Random, "\n").concat(LabColorSpace, "\nconst int MAX_COLORS = 10;\n\nuniform vec2 resolution;\nuniform vec3 color1;\nuniform vec3 color2;\nuniform vec3 color3;\nuniform vec3 color4;\nuniform vec3 color5;\n\nuniform vec3 colors[MAX_COLORS];\n\nuniform int numColors;\n\nin vec4 fragUV;\nout vec4 FragColor;\n\nvoid main() {\n    vec2 uv = gl_FragCoord.xy / resolution;\n    uv.x += .001*rand(uv);\n\n    vec3 c1 = color1 / vec3(255.0);\n    vec3 c2 = color2 / vec3(255.0);\n    vec3 c3 = color3 / vec3(255.);\n    vec3 c4 = color4 / vec3(255.);\n    vec3 c5 = color5 / vec3(255.);\n\n    vec3 lab1 = rgb2lab(colors[0]/255.);\n    vec3 lab2 = rgb2lab(colors[1]/255.);\n    vec3 lab3 = rgb2lab(c3);\n    vec3 lab4 = rgb2lab(c4);\n    vec3 lab5 = rgb2lab(c5);\n\n    float nCol= float(numColors);\n    float step = 1./(nCol-1.);\n\n\n\n    // vec3 labOut = oklab_mix(lab1, lab2, linearstep(0.*step, 1.*step, uv.x));\n    float dither = rand(uv)*.001;\n    vec3 col = mix(rgb2lab(colors[0]/255.), rgb2lab(colors[1]/255.), linearstep(0.*step, 1.*step, uv.x + dither));\n    \n    for(int i = 2; i < MAX_COLORS; i++)\n    {\n        // break early when done\n        if(i >= numColors) break;\n\n        vec3 nextLab = rgb2lab(colors[i]/255.);\n\n        col = mix(col, nextLab, linearstep(float(i-1)*step, float(i)*step, uv.x)+ dither);\n    }\n    \n    col = lab2rgb(col);\n    // linear to gamma\n    col = pow( col, vec3(0.4545) );\n\n\n    FragColor.rgb = (col);\n}\n");

	var VertDefault = "\n#version 300 es\n\nin vec4 position;\nin vec2 texCoord;\n\n\nout vec4 fragUV;\n\nvoid main() {\n  gl_Position =  position;\n  \n  vec2 uv = position.xy;\n  uv = position.xy * 0.5 + 0.5;\n//   uv = vec2(position.x ,0.);\n// uv = position.xy;\n// uv = texCoord;\nuv = vec2(1.,0.);\n  fragUV = vec4(uv, 0., 0.);\n}\n";

	var Cellular2x2x2 = "\n// #version 120\n\n// Cellular noise (\"Worley noise\") in 3D in GLSL.\n// Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.\n// This code is released under the conditions of the MIT license.\n// See LICENSE file for details.\n// https://github.com/stegu/webgl-noise\n\n#ifndef MOD289_3\n#define MOD289_3\n// Modulo 289 without a division (only multiplications)\nvec3 mod289(vec3 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n#endif\n\n#ifndef MOD289_4\n#define MOD289_4\nvec4 mod289(vec4 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n#endif\n\n#ifndef MOD7_4\n#define MOD7_4\n// Modulo 7 without a division\nvec4 mod7(vec4 x) {\n  return x - floor(x * (1.0 / 7.0)) * 7.0;\n}\n#endif\n\n#ifndef PERMUTE_3\n#define PERMUTE_3\n// Permutation polynomial: (34x^2 + 6x) mod 289\nvec3 permute(vec3 x) {\n  return mod289((34.0 * x + 10.0) * x);\n}\n#endif\n\n#ifndef PERMUTE_4\n#define PERMUTE_4\nvec4 permute(vec4 x) {\n  return mod289((34.0 * x + 10.0) * x);\n}\n#endif\n\n// Cellular noise, returning F1 and F2 in a vec2.\n// Speeded up by using 2x2x2 search window instead of 3x3x3,\n// at the expense of some pattern artifacts.\n// F2 is often wrong and has sharp discontinuities.\n// If you need a good F2, use the slower 3x3x3 version.\nvec2 cellular2x2x2(vec3 P) {\n#define K 0.142857142857 // 1/7\n#define Ko 0.428571428571 // 1/2-K/2\n#define K2 0.020408163265306 // 1/(7*7)\n#define Kz 0.166666666667 // 1/6\n#define Kzo 0.416666666667 // 1/2-1/6*2\n#define jitter 0.8 // smaller jitter gives less errors in F2\n\tvec3 Pi = mod289(floor(P));\n \tvec3 Pf = fract(P);\n\tvec4 Pfx = Pf.x + vec4(0.0, -1.0, 0.0, -1.0);\n\tvec4 Pfy = Pf.y + vec4(0.0, 0.0, -1.0, -1.0);\n\tvec4 p = permute(Pi.x + vec4(0.0, 1.0, 0.0, 1.0));\n\tp = permute(p + Pi.y + vec4(0.0, 0.0, 1.0, 1.0));\n\tvec4 p1 = permute(p + Pi.z); // z+0\n\tvec4 p2 = permute(p + Pi.z + vec4(1.0)); // z+1\n\tvec4 ox1 = fract(p1*K) - Ko;\n\tvec4 oy1 = mod7(floor(p1*K))*K - Ko;\n\tvec4 oz1 = floor(p1*K2)*Kz - Kzo; // p1 < 289 guaranteed\n\tvec4 ox2 = fract(p2*K) - Ko;\n\tvec4 oy2 = mod7(floor(p2*K))*K - Ko;\n\tvec4 oz2 = floor(p2*K2)*Kz - Kzo;\n\tvec4 dx1 = Pfx + jitter*ox1;\n\tvec4 dy1 = Pfy + jitter*oy1;\n\tvec4 dz1 = Pf.z + jitter*oz1;\n\tvec4 dx2 = Pfx + jitter*ox2;\n\tvec4 dy2 = Pfy + jitter*oy2;\n\tvec4 dz2 = Pf.z - 1.0 + jitter*oz2;\n\tvec4 d1 = dx1 * dx1 + dy1 * dy1 + dz1 * dz1; // z+0\n\tvec4 d2 = dx2 * dx2 + dy2 * dy2 + dz2 * dz2; // z+1\n\n\t// Sort out the two smallest distances (F1, F2)\n#if 0\n\t// Cheat and sort out only F1\n\td1 = min(d1, d2);\n\td1.xy = min(d1.xy, d1.wz);\n\td1.x = min(d1.x, d1.y);\n\treturn vec2(sqrt(d1.x));\n#else\n\t// Do it right and sort out both F1 and F2\n\tvec4 d = min(d1,d2); // F1 is now in d\n\td2 = max(d1,d2); // Make sure we keep all candidates for F2\n\td.xy = (d.x < d.y) ? d.xy : d.yx; // Swap smallest to d.x\n\td.xz = (d.x < d.z) ? d.xz : d.zx;\n\td.xw = (d.x < d.w) ? d.xw : d.wx; // F1 is now in d.x\n\td.yzw = min(d.yzw, d2.yzw); // F2 now not in d2.yzw\n\td.y = min(d.y, d.z); // nor in d.z\n\td.y = min(d.y, d.w); // nor in d.w\n\td.y = min(d.y, d2.x); // F2 is now in d.y\n\treturn sqrt(d.xy); // F1 and F2\n#endif\n}\n";

	var Cellular3D = "\n// #version 120\n\n// Cellular noise (\"Worley noise\") in 3D in GLSL.\n// Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.\n// This code is released under the conditions of the MIT license.\n// See LICENSE file for details.\n// https://github.com/stegu/webgl-noise\n\n#ifndef MOD289_3\n#define MOD289_3\n// Modulo 289 without a division (only multiplications)\nvec3 mod289(vec3 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n#endif\n\n#ifndef MOD7_3\n#define MOD7_3\n// Modulo 7 without a division\nvec3 mod7(vec3 x) {\n  return x - floor(x * (1.0 / 7.0)) * 7.0;\n}\n#endif\n\n#ifndef PERMUTE_3\n#define PERMUTE_3\n// Permutation polynomial: (34x^2 + 6x) mod 289\nvec3 permute(vec3 x) {\n  return mod289((34.0 * x + 10.0) * x);\n}\n#endif\n\n// Cellular noise, returning F1 and F2 in a vec2.\n// 3x3x3 search region for good F2 everywhere, but a lot\n// slower than the 2x2x2 version.\n// The code below is a bit scary even to its author,\n// but it has at least half decent performance on a\n// modern GPU. In any case, it beats any software\n// implementation of Worley noise hands down.\n\nvec2 cellular(vec3 P) {\n#define K 0.142857142857 // 1/7\n#define Ko 0.428571428571 // 1/2-K/2\n#define K2 0.020408163265306 // 1/(7*7)\n#define Kz 0.166666666667 // 1/6\n#define Kzo 0.416666666667 // 1/2-1/6*2\n#define jitter_cell_noise 1.0 // smaller jitter_cell_noise gives more regular pattern\n\n\tvec3 Pi = mod289(floor(P));\n \tvec3 Pf = fract(P) - 0.5;\n\n\tvec3 Pfx = Pf.x + vec3(1.0, 0.0, -1.0);\n\tvec3 Pfy = Pf.y + vec3(1.0, 0.0, -1.0);\n\tvec3 Pfz = Pf.z + vec3(1.0, 0.0, -1.0);\n\n\tvec3 p = permute(Pi.x + vec3(-1.0, 0.0, 1.0));\n\tvec3 p1 = permute(p + Pi.y - 1.0);\n\tvec3 p2 = permute(p + Pi.y);\n\tvec3 p3 = permute(p + Pi.y + 1.0);\n\n\tvec3 p11 = permute(p1 + Pi.z - 1.0);\n\tvec3 p12 = permute(p1 + Pi.z);\n\tvec3 p13 = permute(p1 + Pi.z + 1.0);\n\n\tvec3 p21 = permute(p2 + Pi.z - 1.0);\n\tvec3 p22 = permute(p2 + Pi.z);\n\tvec3 p23 = permute(p2 + Pi.z + 1.0);\n\n\tvec3 p31 = permute(p3 + Pi.z - 1.0);\n\tvec3 p32 = permute(p3 + Pi.z);\n\tvec3 p33 = permute(p3 + Pi.z + 1.0);\n\n\tvec3 ox11 = fract(p11*K) - Ko;\n\tvec3 oy11 = mod7(floor(p11*K))*K - Ko;\n\tvec3 oz11 = floor(p11*K2)*Kz - Kzo; // p11 < 289 guaranteed\n\n\tvec3 ox12 = fract(p12*K) - Ko;\n\tvec3 oy12 = mod7(floor(p12*K))*K - Ko;\n\tvec3 oz12 = floor(p12*K2)*Kz - Kzo;\n\n\tvec3 ox13 = fract(p13*K) - Ko;\n\tvec3 oy13 = mod7(floor(p13*K))*K - Ko;\n\tvec3 oz13 = floor(p13*K2)*Kz - Kzo;\n\n\tvec3 ox21 = fract(p21*K) - Ko;\n\tvec3 oy21 = mod7(floor(p21*K))*K - Ko;\n\tvec3 oz21 = floor(p21*K2)*Kz - Kzo;\n\n\tvec3 ox22 = fract(p22*K) - Ko;\n\tvec3 oy22 = mod7(floor(p22*K))*K - Ko;\n\tvec3 oz22 = floor(p22*K2)*Kz - Kzo;\n\n\tvec3 ox23 = fract(p23*K) - Ko;\n\tvec3 oy23 = mod7(floor(p23*K))*K - Ko;\n\tvec3 oz23 = floor(p23*K2)*Kz - Kzo;\n\n\tvec3 ox31 = fract(p31*K) - Ko;\n\tvec3 oy31 = mod7(floor(p31*K))*K - Ko;\n\tvec3 oz31 = floor(p31*K2)*Kz - Kzo;\n\n\tvec3 ox32 = fract(p32*K) - Ko;\n\tvec3 oy32 = mod7(floor(p32*K))*K - Ko;\n\tvec3 oz32 = floor(p32*K2)*Kz - Kzo;\n\n\tvec3 ox33 = fract(p33*K) - Ko;\n\tvec3 oy33 = mod7(floor(p33*K))*K - Ko;\n\tvec3 oz33 = floor(p33*K2)*Kz - Kzo;\n\n\tvec3 dx11 = Pfx + jitter_cell_noise*ox11;\n\tvec3 dy11 = Pfy.x + jitter_cell_noise*oy11;\n\tvec3 dz11 = Pfz.x + jitter_cell_noise*oz11;\n\n\tvec3 dx12 = Pfx + jitter_cell_noise*ox12;\n\tvec3 dy12 = Pfy.x + jitter_cell_noise*oy12;\n\tvec3 dz12 = Pfz.y + jitter_cell_noise*oz12;\n\n\tvec3 dx13 = Pfx + jitter_cell_noise*ox13;\n\tvec3 dy13 = Pfy.x + jitter_cell_noise*oy13;\n\tvec3 dz13 = Pfz.z + jitter_cell_noise*oz13;\n\n\tvec3 dx21 = Pfx + jitter_cell_noise*ox21;\n\tvec3 dy21 = Pfy.y + jitter_cell_noise*oy21;\n\tvec3 dz21 = Pfz.x + jitter_cell_noise*oz21;\n\n\tvec3 dx22 = Pfx + jitter_cell_noise*ox22;\n\tvec3 dy22 = Pfy.y + jitter_cell_noise*oy22;\n\tvec3 dz22 = Pfz.y + jitter_cell_noise*oz22;\n\n\tvec3 dx23 = Pfx + jitter_cell_noise*ox23;\n\tvec3 dy23 = Pfy.y + jitter_cell_noise*oy23;\n\tvec3 dz23 = Pfz.z + jitter_cell_noise*oz23;\n\n\tvec3 dx31 = Pfx + jitter_cell_noise*ox31;\n\tvec3 dy31 = Pfy.z + jitter_cell_noise*oy31;\n\tvec3 dz31 = Pfz.x + jitter_cell_noise*oz31;\n\n\tvec3 dx32 = Pfx + jitter_cell_noise*ox32;\n\tvec3 dy32 = Pfy.z + jitter_cell_noise*oy32;\n\tvec3 dz32 = Pfz.y + jitter_cell_noise*oz32;\n\n\tvec3 dx33 = Pfx + jitter_cell_noise*ox33;\n\tvec3 dy33 = Pfy.z + jitter_cell_noise*oy33;\n\tvec3 dz33 = Pfz.z + jitter_cell_noise*oz33;\n\n\tvec3 d11 = dx11 * dx11 + dy11 * dy11 + dz11 * dz11;\n\tvec3 d12 = dx12 * dx12 + dy12 * dy12 + dz12 * dz12;\n\tvec3 d13 = dx13 * dx13 + dy13 * dy13 + dz13 * dz13;\n\tvec3 d21 = dx21 * dx21 + dy21 * dy21 + dz21 * dz21;\n\tvec3 d22 = dx22 * dx22 + dy22 * dy22 + dz22 * dz22;\n\tvec3 d23 = dx23 * dx23 + dy23 * dy23 + dz23 * dz23;\n\tvec3 d31 = dx31 * dx31 + dy31 * dy31 + dz31 * dz31;\n\tvec3 d32 = dx32 * dx32 + dy32 * dy32 + dz32 * dz32;\n\tvec3 d33 = dx33 * dx33 + dy33 * dy33 + dz33 * dz33;\n\n\t// Sort out the two smallest distances (F1, F2)\n#if 0\n\t// Cheat and sort out only F1\n\tvec3 d1 = min(min(d11,d12), d13);\n\tvec3 d2 = min(min(d21,d22), d23);\n\tvec3 d3 = min(min(d31,d32), d33);\n\tvec3 d = min(min(d1,d2), d3);\n\td.x = min(min(d.x,d.y),d.z);\n\treturn vec2(sqrt(d.x)); // F1 duplicated, no F2 computed\n#else\n\t// Do it right and sort out both F1 and F2\n\tvec3 d1a = min(d11, d12);\n\td12 = max(d11, d12);\n\td11 = min(d1a, d13); // Smallest now not in d12 or d13\n\td13 = max(d1a, d13);\n\td12 = min(d12, d13); // 2nd smallest now not in d13\n\tvec3 d2a = min(d21, d22);\n\td22 = max(d21, d22);\n\td21 = min(d2a, d23); // Smallest now not in d22 or d23\n\td23 = max(d2a, d23);\n\td22 = min(d22, d23); // 2nd smallest now not in d23\n\tvec3 d3a = min(d31, d32);\n\td32 = max(d31, d32);\n\td31 = min(d3a, d33); // Smallest now not in d32 or d33\n\td33 = max(d3a, d33);\n\td32 = min(d32, d33); // 2nd smallest now not in d33\n\tvec3 da = min(d11, d21);\n\td21 = max(d11, d21);\n\td11 = min(da, d31); // Smallest now in d11\n\td31 = max(da, d31); // 2nd smallest now not in d31\n\td11.xy = (d11.x < d11.y) ? d11.xy : d11.yx;\n\td11.xz = (d11.x < d11.z) ? d11.xz : d11.zx; // d11.x now smallest\n\td12 = min(d12, d21); // 2nd smallest now not in d21\n\td12 = min(d12, d22); // nor in d22\n\td12 = min(d12, d31); // nor in d31\n\td12 = min(d12, d32); // nor in d32\n\td11.yz = min(d11.yz,d12.xy); // nor in d12.yz\n\td11.y = min(d11.y,d12.z); // Only two more to go\n\td11.y = min(d11.y,d11.z); // Done! (Phew!)\n\treturn sqrt(d11.xy); // F1, F2\n#endif\n}\n\n";

	var Noise3D = "\n//\n// Description : Array and textureless GLSL 2D/3D/4D simplex \n//               noise functions.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : stegu\n//     Lastmod : 20201014 (stegu)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               https://github.com/ashima/webgl-noise\n//               https://github.com/stegu/webgl-noise\n// \n\n#ifndef MOD289_3\n#define MOD289_3\nvec3 mod289(vec3 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n#endif\n\n#ifndef MOD289_4\n#define MOD289_4\nvec4 mod289(vec4 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n#endif\n\n#ifndef PERMUTE_4\n#define PERMUTE_4\nvec4 permute(vec4 x) {\n     return mod289(((x*34.0)+10.0)*x);\n}\n#endif\n\n#ifndef TAYLORINVSQRT\n#define TAYLORINVSQRT\nvec4 taylorInvSqrt(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n#endif\n\nfloat snoise(vec3 v)\n  { \n  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n// First corner\n  vec3 i  = floor(v + dot(v, C.yyy) );\n  vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n// Other corners\n  vec3 g = step(x0.yzx, x0.xyz);\n  vec3 l = 1.0 - g;\n  vec3 i1 = min( g.xyz, l.zxy );\n  vec3 i2 = max( g.xyz, l.zxy );\n\n  //   x0 = x0 - 0.0 + 0.0 * C.xxx;\n  //   x1 = x0 - i1  + 1.0 * C.xxx;\n  //   x2 = x0 - i2  + 2.0 * C.xxx;\n  //   x3 = x0 - 1.0 + 3.0 * C.xxx;\n  vec3 x1 = x0 - i1 + C.xxx;\n  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\n// Permutations\n  i = mod289(i); \n  vec4 p = permute( permute( permute( \n             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) \n           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n// Gradients: 7x7 points over a square, mapped onto an octahedron.\n// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\n  float n_ = 0.142857142857; // 1.0/7.0\n  vec3  ns = n_ * D.wyz - D.xzx;\n\n  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\n  vec4 x_ = floor(j * ns.z);\n  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\n  vec4 x = x_ *ns.x + ns.yyyy;\n  vec4 y = y_ *ns.x + ns.yyyy;\n  vec4 h = 1.0 - abs(x) - abs(y);\n\n  vec4 b0 = vec4( x.xy, y.xy );\n  vec4 b1 = vec4( x.zw, y.zw );\n\n  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\n  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\n  vec4 s0 = floor(b0)*2.0 + 1.0;\n  vec4 s1 = floor(b1)*2.0 + 1.0;\n  vec4 sh = -step(h, vec4(0.0));\n\n  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n  vec3 p0 = vec3(a0.xy,h.x);\n  vec3 p1 = vec3(a0.zw,h.y);\n  vec3 p2 = vec3(a1.xy,h.z);\n  vec3 p3 = vec3(a1.zw,h.w);\n\n//Normalise gradients\n  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n  p0 *= norm.x;\n  p1 *= norm.y;\n  p2 *= norm.z;\n  p3 *= norm.w;\n\n// Mix final noise value\n  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n  m = m * m;\n  return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), \n                                dot(p2,x2), dot(p3,x3) ) );\n  }\n  ";

	var Noise3DGrad = "//\n// Description : Array and textureless GLSL 2D/3D/4D simplex \n//               noise functions.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : stegu\n//     Lastmod : 20201014 (stegu)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               https://github.com/ashima/webgl-noise\n//               https://github.com/stegu/webgl-noise\n// \n\n#ifndef MOD289_3\n#define MOD289_3\nvec3 mod289(vec3 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n#endif\n\n#ifndef MOD289_4\n#define MOD289_4\nvec4 mod289(vec4 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n#endif\n\n#ifndef PERMUTE_4\n#define PERMUTE_4\nvec4 permute(vec4 x) {\n     return mod289(((x*34.0)+10.0)*x);\n}\n#endif\n\n#ifndef TAYLORINVSQRT\n#define TAYLORINVSQRT\nvec4 taylorInvSqrt(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n#endif\n\nfloat snoise(vec3 v, out vec3 gradient)\n{\n  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n// First corner\n  vec3 i  = floor(v + dot(v, C.yyy) );\n  vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n// Other corners\n  vec3 g = step(x0.yzx, x0.xyz);\n  vec3 l = 1.0 - g;\n  vec3 i1 = min( g.xyz, l.zxy );\n  vec3 i2 = max( g.xyz, l.zxy );\n\n  //   x0 = x0 - 0.0 + 0.0 * C.xxx;\n  //   x1 = x0 - i1  + 1.0 * C.xxx;\n  //   x2 = x0 - i2  + 2.0 * C.xxx;\n  //   x3 = x0 - 1.0 + 3.0 * C.xxx;\n  vec3 x1 = x0 - i1 + C.xxx;\n  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\n// Permutations\n  i = mod289(i); \n  vec4 p = permute( permute( permute( \n             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) \n           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n// Gradients: 7x7 points over a square, mapped onto an octahedron.\n// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\n  float n_ = 0.142857142857; // 1.0/7.0\n  vec3  ns = n_ * D.wyz - D.xzx;\n\n  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\n  vec4 x_ = floor(j * ns.z);\n  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\n  vec4 x = x_ *ns.x + ns.yyyy;\n  vec4 y = y_ *ns.x + ns.yyyy;\n  vec4 h = 1.0 - abs(x) - abs(y);\n\n  vec4 b0 = vec4( x.xy, y.xy );\n  vec4 b1 = vec4( x.zw, y.zw );\n\n  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\n  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\n  vec4 s0 = floor(b0)*2.0 + 1.0;\n  vec4 s1 = floor(b1)*2.0 + 1.0;\n  vec4 sh = -step(h, vec4(0.0));\n\n  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n  vec3 p0 = vec3(a0.xy,h.x);\n  vec3 p1 = vec3(a0.zw,h.y);\n  vec3 p2 = vec3(a1.xy,h.z);\n  vec3 p3 = vec3(a1.zw,h.w);\n\n//Normalise gradients\n  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n  p0 *= norm.x;\n  p1 *= norm.y;\n  p2 *= norm.z;\n  p3 *= norm.w;\n\n// Mix final noise value\n  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n  vec4 m2 = m * m;\n  vec4 m4 = m2 * m2;\n  vec4 pdotx = vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3));\n\n// Determine noise gradient\n  vec4 temp = m2 * m * pdotx;\n  gradient = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);\n  gradient += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;\n  gradient *= 105.0;\n\n  return 105.0 * dot(m4, pdotx);\n}\n";

	var Saturate = "\n#ifndef saturate\n#define saturate(v) clamp(v, 0., 1.)\n#endif\n";

	var Shapes = "\n#ifndef SHAPES_GLSL\n#define SHAPES_GLSL\n\nfloat dot2( in vec2 v ) { return dot(v,v); }\nfloat ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }\n\nfloat sminCubic( float a, float b, float k )\n{\n    float h = max( k-abs(a-b), 0.0 )/k;\n    return min( a, b ) - h*h*h*k*(1.0/6.0);\n}\n\nfloat sdCircle( vec2 p, float r )\n{\n    return length(p) - r;\n}\n\nfloat sdRoundedBox( in vec2 p, in vec2 b, in vec4 r )\n{\n    r.xy = (p.x>0.0)?r.xy : r.zw;\n    r.x  = (p.y>0.0)?r.x  : r.y;\n    vec2 q = abs(p)-b+r.x;\n    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;\n}\n\nfloat sdBox( in vec2 p, in vec2 b )\n{\n    vec2 d = abs(p)-b;\n    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);\n}\n\nfloat sdOrientedBox( in vec2 p, in vec2 a, in vec2 b, float th )\n{\n    float l = length(b-a);\n    vec2  d = (b-a)/l;\n    vec2  q = (p-(a+b)*0.5);\n          q = mat2(d.x,-d.y,d.y,d.x)*q;\n          q = abs(q)-vec2(l,th)*0.5;\n    return length(max(q,0.0)) + min(max(q.x,q.y),0.0);    \n}\n\nfloat sdRhombus( in vec2 p, in vec2 b ) \n{\n    p = abs(p);\n    float h = clamp( ndot(b-2.0*p,b)/dot(b,b), -1.0, 1.0 );\n    float d = length( p-0.5*b*vec2(1.0-h,1.0+h) );\n    return d * sign( p.x*b.y + p.y*b.x - b.x*b.y );\n}\n\nfloat sdTrapezoid( in vec2 p, in float r1, float r2, float he )\n{\n    vec2 k1 = vec2(r2,he);\n    vec2 k2 = vec2(r2-r1,2.0*he);\n    p.x = abs(p.x);\n    vec2 ca = vec2(p.x-min(p.x,(p.y<0.0)?r1:r2), abs(p.y)-he);\n    vec2 cb = p - k1 + k2*clamp( dot(k1-p,k2)/dot2(k2), 0.0, 1.0 );\n    float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;\n    return s*sqrt( min(dot2(ca),dot2(cb)) );\n}\n\nfloat sdParallelogram( in vec2 p, float wi, float he, float sk )\n{\n    vec2 e = vec2(sk,he);\n    p = (p.y<0.0)?-p:p;\n    vec2  w = p - e; w.x -= clamp(w.x,-wi,wi);\n    vec2  d = vec2(dot(w,w), -w.y);\n    float s = p.x*e.y - p.y*e.x; \n    p = (s<0.0)?-p:p;\n    vec2  v = p - vec2(wi,0); v -= e*clamp(dot(v,e)/dot(e,e),-1.0,1.0);\n    d = min( d, vec2(dot(v,v), wi*he-abs(s)));\n    return sqrt(d.x)*sign(-d.y);\n}\n\nvec2 translate(vec2 p, vec2 t)\n{\n\treturn p - t;\n}\n\nvec3 translate(vec3 p, vec3 t)\n{\n    return p - t;\n}\n\nvec2 scale(vec2 p, float zoom)\n{\n    p *= zoom;\n    return p;\n}\n\nvec2 scale(vec2 p, vec2 origin, float zoom)\n{\n    p -= origin;\n    p *= zoom;\n    p += origin;\n\n    return p;\n}\n\nvec2 rotate(vec2 p, float a)\n{\n    mat2 m = mat2(cos(a),sin(a),-sin(a),cos(a));\n    return p*m;\n}\n\nvec2 rotate(vec2 p, vec2 origin, float a)\n{\n    p -= origin;\n    mat2 m = mat2(cos(a),sin(a),-sin(a),cos(a));\n    return p*m + origin;\t\n}\n\n#endif\n";

	var Includes = "\n".concat(Shapes, "\n").concat(Random, "\n").concat(Noise3DGrad, "\n").concat(Noise3D, "\n").concat(Saturate, "\n").concat(Cellular2x2x2, "\n").concat(Cellular3D, "\n\n#define TO_FLOAT (1./255.0)\n\n#define sin01(x) (sin(x)*.5)+.5\n\n#define disabled vec3(0.0)\n\n");
	var Types = "\n\nstruct Layer1\n{\n  vec3 color1;\n  vec3 color2;\n  float brightness;\n  float blobbyness;\n  float blur;\n\n  bool enabled;\n};\n\nstruct Layer2\n{\n  float brightness;\n  float cycleSpeed;\n  bool enabled;\n};\n\nstruct Feedback\n{\n  float amount;\n  float scaleX;\n  float scaleY;\n  float centerX;\n  float centerY;\n};\n\n";
	var Uniforms = "\nuniform vec2 resolution;\nuniform vec4 time; // [time, time/2, time*2, time/10]\nuniform sampler2D ramp;\nuniform Layer1 layer1;\nuniform Layer2 layer2;\nuniform Feedback feedback;\n\nuniform sampler2D backBufferTex;\n\nuniform float noiseDither;\n\n// uniform float feedback;\n\nout vec4 FragColor;\nin vec4 fragUV;\n";
	var Layer1 = "\nvec3 doLayer1(in vec4 uv, inout vec3 col)\n{\n  vec2 st = uv.zw;\n  st *= sin(time.x);\n\n  float sk = .1*sin(time.y*1.56);\n\n  float d = sdParallelogram(st + vec2(sin(time.z), sin(time.y*1.4)), .4, .1, sk);\n  float d2 = sdRhombus(st + vec2(sin(time.z*.85 + 12.23), sin(time.y)), vec2(1.,1.));\n  \n  float noise = snoise(vec3(uv.xy, time.x));\n  float dMix = smoothstep(.0,.2, mix(d,d2, sin01(time.y) ));\n\n  dMix+=layer1.blobbyness*noise;\n  d += noise*layer1.blobbyness;\n\n  vec3 layer1Col = layer1.brightness*(mix(layer1.color1*TO_FLOAT, layer1.color2*TO_FLOAT, saturate(smoothstep(-layer1.blur, layer1.blur, dMix))));\n\n  layer1Col = layer1.enabled ? layer1Col : disabled;\n  col += layer1Col;\n\n  return layer1Col;\n}\n";
	var Layer2 = "\nvec3 doLayer2(in vec4 uv, inout vec3 col)\n{\n  \n  vec3 grad;\n  float noise = snoise(vec3(uv.xy, time.x), grad);\n  noise *= 0.4;\n  noise = smoothstep(-1.,1., noise);\n  vec4 rampSample = texture2D(ramp, vec2(noise + time.z *layer2.cycleSpeed + rand(uv.xy)*.01  , .5));\n  \n  vec3 layer2Col = rampSample.rgb*noise*layer2.brightness;\n  vec3 color = layer2.enabled ? layer2Col : disabled;\n  col.rgb += color;\n\n  return color;\n\n}\n";
	var ScaleUV = "\n\nvec2 scaleUV(vec2 uv, vec2 scaleFactor, vec2 center)\n{\n return ( uv - center)*scaleFactor  + center;\n}\n";
	var FragAura = "\n#version 300 es\n\n#if __VERSION__ > 130\n#define texture2D texture\n#endif\n\nprecision mediump float;\n\n".concat(Includes, "\n").concat(Types, "\n").concat(Uniforms, "\n\n").concat(Layer1, "\n").concat(Layer2, "\n").concat(ScaleUV, "\n\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / resolution;\n  vec2 uvOrig = uv;\n  vec2 st = (uv*resolution - vec2(.5, .5)*resolution)/resolution.y;\n\n  // Init output\n  vec4 col = vec4(0.);\n  col.a = 1.;\n\n  // Calculate layers\n  vec3 l1 = doLayer1(vec4(uv, st), col.rgb);\n  vec3 l2 = doLayer2(vec4(uv, st), col.rgb);\n\n  // Comp Layers\n  col.rgb = l1 + l2;\n\n  // Feedback stage\n  vec3 grad;\n  float noise = snoise(vec3(uv.xy, time.x)*.5, grad);\n\n  vec4 lastFrame = texture2D(backBufferTex, uv+ grad.xy*.1);\n  col.rgb += lastFrame.rgb*feedback.amount;\n\n  // Clamp color values\n  col.rgb = saturate(col.rgb);\n\n  FragColor = col;\n}\n");

	var FragComp = "\n#version 300 es\n\n\n#if __VERSION__ > 130\n#define texture2D texture\n#endif\n\n\nprecision mediump float;\n\nout vec4 FragColor;\n\n".concat(Saturate, "\n").concat(Random, "\n").concat(LabColorSpace, "\n\nuniform float noiseDither;\n\nuniform vec2 resolution;\nuniform sampler2D backBuffer;\n\n\nuniform sampler2D ramp;\n\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / resolution;\n  uv += noiseDither*vec2(rand(uv), rand(uv + vec2(112.234,253.253)));\n\n  vec4 lastCol = texture2D(backBuffer, uv);\n  vec4 colOut;\n  colOut.a = 1.;\n\n  colOut.rgb = lastCol.rgb;\n\n  // linear to gamma\n  // colOut.rgb = pow( colOut.rgb, vec3(0.4545) );\n\n  FragColor = colOut;\n}\n\n");

	var CreateGradientTexture2 = function CreateGradientTexture2(gl, options) {
	  var _options$resolution, _options$height2, _options$colors;

	  var width = (_options$resolution = options.resolution) !== null && _options$resolution !== void 0 ? _options$resolution : 256;
	  var height = (_options$height2 = options.height) !== null && _options$height2 !== void 0 ? _options$height2 : 256;
	  var colors = (_options$colors = options.colors) !== null && _options$colors !== void 0 ? _options$colors : [[255, 0, 0], [0, 0, 255], [0, 255, 0]];

	  if (!colors || colors.length < 2) {
	    console.log("Need at least 2 colors to make a gradient");
	    return null;
	  }

	  var gradShader = createProgramInfo(gl, [VertDefault, FragGradientLab]);
	  var bufferInfo = createBufferInfoFromArrays(gl, FullScreenQuad);
	  gl.viewport(0, 0, width, height);
	  var gradTex = gl.createTexture();
	  gl.bindTexture(gl.TEXTURE_2D, gradTex);
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	  var fb = gl.createFramebuffer();
	  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	  var attachmentPoint = gl.COLOR_ATTACHMENT0;
	  gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, gradTex, 0);
	  gl.useProgram(gradShader.program);
	  gl.clearColor(0, 0, 0, 1);
	  setBuffersAndAttributes(gl, gradShader, bufferInfo);
	  setUniforms(gradShader, {
	    colors: colors.flat(),
	    numColors: colors.length,
	    resolution: [width, height]
	  });
	  drawBufferInfo(gl, bufferInfo);
	  return gradTex;
	};

	/**
	 * dat-gui JavaScript Controller Library
	 * http://code.google.com/p/dat-gui
	 *
	 * Copyright 2011 Data Arts Team, Google Creative Lab
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 * http://www.apache.org/licenses/LICENSE-2.0
	 */
	function ___$insertStyle(css) {
	  if (!css) {
	    return;
	  }

	  if (typeof window === 'undefined') {
	    return;
	  }

	  var style = document.createElement('style');
	  style.setAttribute('type', 'text/css');
	  style.innerHTML = css;
	  document.head.appendChild(style);
	  return css;
	}

	function colorToString(color, forceCSSHex) {
	  var colorFormat = color.__state.conversionName.toString();

	  var r = Math.round(color.r);
	  var g = Math.round(color.g);
	  var b = Math.round(color.b);
	  var a = color.a;
	  var h = Math.round(color.h);
	  var s = color.s.toFixed(1);
	  var v = color.v.toFixed(1);

	  if (forceCSSHex || colorFormat === 'THREE_CHAR_HEX' || colorFormat === 'SIX_CHAR_HEX') {
	    var str = color.hex.toString(16);

	    while (str.length < 6) {
	      str = '0' + str;
	    }

	    return '#' + str;
	  } else if (colorFormat === 'CSS_RGB') {
	    return 'rgb(' + r + ',' + g + ',' + b + ')';
	  } else if (colorFormat === 'CSS_RGBA') {
	    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
	  } else if (colorFormat === 'HEX') {
	    return '0x' + color.hex.toString(16);
	  } else if (colorFormat === 'RGB_ARRAY') {
	    return '[' + r + ',' + g + ',' + b + ']';
	  } else if (colorFormat === 'RGBA_ARRAY') {
	    return '[' + r + ',' + g + ',' + b + ',' + a + ']';
	  } else if (colorFormat === 'RGB_OBJ') {
	    return '{r:' + r + ',g:' + g + ',b:' + b + '}';
	  } else if (colorFormat === 'RGBA_OBJ') {
	    return '{r:' + r + ',g:' + g + ',b:' + b + ',a:' + a + '}';
	  } else if (colorFormat === 'HSV_OBJ') {
	    return '{h:' + h + ',s:' + s + ',v:' + v + '}';
	  } else if (colorFormat === 'HSVA_OBJ') {
	    return '{h:' + h + ',s:' + s + ',v:' + v + ',a:' + a + '}';
	  }

	  return 'unknown format';
	}

	var ARR_EACH = Array.prototype.forEach;
	var ARR_SLICE = Array.prototype.slice;
	var Common = {
	  BREAK: {},
	  extend: function extend(target) {
	    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
	      var keys = this.isObject(obj) ? Object.keys(obj) : [];
	      keys.forEach(function (key) {
	        if (!this.isUndefined(obj[key])) {
	          target[key] = obj[key];
	        }
	      }.bind(this));
	    }, this);
	    return target;
	  },
	  defaults: function defaults(target) {
	    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
	      var keys = this.isObject(obj) ? Object.keys(obj) : [];
	      keys.forEach(function (key) {
	        if (this.isUndefined(target[key])) {
	          target[key] = obj[key];
	        }
	      }.bind(this));
	    }, this);
	    return target;
	  },
	  compose: function compose() {
	    var toCall = ARR_SLICE.call(arguments);
	    return function () {
	      var args = ARR_SLICE.call(arguments);

	      for (var i = toCall.length - 1; i >= 0; i--) {
	        args = [toCall[i].apply(this, args)];
	      }

	      return args[0];
	    };
	  },
	  each: function each(obj, itr, scope) {
	    if (!obj) {
	      return;
	    }

	    if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
	      obj.forEach(itr, scope);
	    } else if (obj.length === obj.length + 0) {
	      var key = void 0;
	      var l = void 0;

	      for (key = 0, l = obj.length; key < l; key++) {
	        if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
	          return;
	        }
	      }
	    } else {
	      for (var _key in obj) {
	        if (itr.call(scope, obj[_key], _key) === this.BREAK) {
	          return;
	        }
	      }
	    }
	  },
	  defer: function defer(fnc) {
	    setTimeout(fnc, 0);
	  },
	  debounce: function debounce(func, threshold, callImmediately) {
	    var timeout = void 0;
	    return function () {
	      var obj = this;
	      var args = arguments;

	      function delayed() {
	        timeout = null;
	        if (!callImmediately) func.apply(obj, args);
	      }

	      var callNow = callImmediately || !timeout;
	      clearTimeout(timeout);
	      timeout = setTimeout(delayed, threshold);

	      if (callNow) {
	        func.apply(obj, args);
	      }
	    };
	  },
	  toArray: function toArray(obj) {
	    if (obj.toArray) return obj.toArray();
	    return ARR_SLICE.call(obj);
	  },
	  isUndefined: function isUndefined(obj) {
	    return obj === undefined;
	  },
	  isNull: function isNull(obj) {
	    return obj === null;
	  },
	  isNaN: function (_isNaN) {
	    function isNaN(_x) {
	      return _isNaN.apply(this, arguments);
	    }

	    isNaN.toString = function () {
	      return _isNaN.toString();
	    };

	    return isNaN;
	  }(function (obj) {
	    return isNaN(obj);
	  }),
	  isArray: Array.isArray || function (obj) {
	    return obj.constructor === Array;
	  },
	  isObject: function isObject(obj) {
	    return obj === Object(obj);
	  },
	  isNumber: function isNumber(obj) {
	    return obj === obj + 0;
	  },
	  isString: function isString(obj) {
	    return obj === obj + '';
	  },
	  isBoolean: function isBoolean(obj) {
	    return obj === false || obj === true;
	  },
	  isFunction: function isFunction(obj) {
	    return obj instanceof Function;
	  }
	};
	var INTERPRETATIONS = [{
	  litmus: Common.isString,
	  conversions: {
	    THREE_CHAR_HEX: {
	      read: function read(original) {
	        var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);

	        if (test === null) {
	          return false;
	        }

	        return {
	          space: 'HEX',
	          hex: parseInt('0x' + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
	        };
	      },
	      write: colorToString
	    },
	    SIX_CHAR_HEX: {
	      read: function read(original) {
	        var test = original.match(/^#([A-F0-9]{6})$/i);

	        if (test === null) {
	          return false;
	        }

	        return {
	          space: 'HEX',
	          hex: parseInt('0x' + test[1].toString(), 0)
	        };
	      },
	      write: colorToString
	    },
	    CSS_RGB: {
	      read: function read(original) {
	        var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);

	        if (test === null) {
	          return false;
	        }

	        return {
	          space: 'RGB',
	          r: parseFloat(test[1]),
	          g: parseFloat(test[2]),
	          b: parseFloat(test[3])
	        };
	      },
	      write: colorToString
	    },
	    CSS_RGBA: {
	      read: function read(original) {
	        var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);

	        if (test === null) {
	          return false;
	        }

	        return {
	          space: 'RGB',
	          r: parseFloat(test[1]),
	          g: parseFloat(test[2]),
	          b: parseFloat(test[3]),
	          a: parseFloat(test[4])
	        };
	      },
	      write: colorToString
	    }
	  }
	}, {
	  litmus: Common.isNumber,
	  conversions: {
	    HEX: {
	      read: function read(original) {
	        return {
	          space: 'HEX',
	          hex: original,
	          conversionName: 'HEX'
	        };
	      },
	      write: function write(color) {
	        return color.hex;
	      }
	    }
	  }
	}, {
	  litmus: Common.isArray,
	  conversions: {
	    RGB_ARRAY: {
	      read: function read(original) {
	        if (original.length !== 3) {
	          return false;
	        }

	        return {
	          space: 'RGB',
	          r: original[0],
	          g: original[1],
	          b: original[2]
	        };
	      },
	      write: function write(color) {
	        return [color.r, color.g, color.b];
	      }
	    },
	    RGBA_ARRAY: {
	      read: function read(original) {
	        if (original.length !== 4) return false;
	        return {
	          space: 'RGB',
	          r: original[0],
	          g: original[1],
	          b: original[2],
	          a: original[3]
	        };
	      },
	      write: function write(color) {
	        return [color.r, color.g, color.b, color.a];
	      }
	    }
	  }
	}, {
	  litmus: Common.isObject,
	  conversions: {
	    RGBA_OBJ: {
	      read: function read(original) {
	        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
	          return {
	            space: 'RGB',
	            r: original.r,
	            g: original.g,
	            b: original.b,
	            a: original.a
	          };
	        }

	        return false;
	      },
	      write: function write(color) {
	        return {
	          r: color.r,
	          g: color.g,
	          b: color.b,
	          a: color.a
	        };
	      }
	    },
	    RGB_OBJ: {
	      read: function read(original) {
	        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
	          return {
	            space: 'RGB',
	            r: original.r,
	            g: original.g,
	            b: original.b
	          };
	        }

	        return false;
	      },
	      write: function write(color) {
	        return {
	          r: color.r,
	          g: color.g,
	          b: color.b
	        };
	      }
	    },
	    HSVA_OBJ: {
	      read: function read(original) {
	        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
	          return {
	            space: 'HSV',
	            h: original.h,
	            s: original.s,
	            v: original.v,
	            a: original.a
	          };
	        }

	        return false;
	      },
	      write: function write(color) {
	        return {
	          h: color.h,
	          s: color.s,
	          v: color.v,
	          a: color.a
	        };
	      }
	    },
	    HSV_OBJ: {
	      read: function read(original) {
	        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
	          return {
	            space: 'HSV',
	            h: original.h,
	            s: original.s,
	            v: original.v
	          };
	        }

	        return false;
	      },
	      write: function write(color) {
	        return {
	          h: color.h,
	          s: color.s,
	          v: color.v
	        };
	      }
	    }
	  }
	}];
	var result = void 0;
	var toReturn = void 0;

	var interpret = function interpret() {
	  toReturn = false;
	  var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
	  Common.each(INTERPRETATIONS, function (family) {
	    if (family.litmus(original)) {
	      Common.each(family.conversions, function (conversion, conversionName) {
	        result = conversion.read(original);

	        if (toReturn === false && result !== false) {
	          toReturn = result;
	          result.conversionName = conversionName;
	          result.conversion = conversion;
	          return Common.BREAK;
	        }
	      });
	      return Common.BREAK;
	    }
	  });
	  return toReturn;
	};

	var tmpComponent = void 0;
	var ColorMath = {
	  hsv_to_rgb: function hsv_to_rgb(h, s, v) {
	    var hi = Math.floor(h / 60) % 6;
	    var f = h / 60 - Math.floor(h / 60);
	    var p = v * (1.0 - s);
	    var q = v * (1.0 - f * s);
	    var t = v * (1.0 - (1.0 - f) * s);
	    var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
	    return {
	      r: c[0] * 255,
	      g: c[1] * 255,
	      b: c[2] * 255
	    };
	  },
	  rgb_to_hsv: function rgb_to_hsv(r, g, b) {
	    var min = Math.min(r, g, b);
	    var max = Math.max(r, g, b);
	    var delta = max - min;
	    var h = void 0;
	    var s = void 0;

	    if (max !== 0) {
	      s = delta / max;
	    } else {
	      return {
	        h: NaN,
	        s: 0,
	        v: 0
	      };
	    }

	    if (r === max) {
	      h = (g - b) / delta;
	    } else if (g === max) {
	      h = 2 + (b - r) / delta;
	    } else {
	      h = 4 + (r - g) / delta;
	    }

	    h /= 6;

	    if (h < 0) {
	      h += 1;
	    }

	    return {
	      h: h * 360,
	      s: s,
	      v: max / 255
	    };
	  },
	  rgb_to_hex: function rgb_to_hex(r, g, b) {
	    var hex = this.hex_with_component(0, 2, r);
	    hex = this.hex_with_component(hex, 1, g);
	    hex = this.hex_with_component(hex, 0, b);
	    return hex;
	  },
	  component_from_hex: function component_from_hex(hex, componentIndex) {
	    return hex >> componentIndex * 8 & 0xFF;
	  },
	  hex_with_component: function hex_with_component(hex, componentIndex, value) {
	    return value << (tmpComponent = componentIndex * 8) | hex & ~(0xFF << tmpComponent);
	  }
	};

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

	var classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	var createClass = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      Object.defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();

	var get = function get(object, property, receiver) {
	  if (object === null) object = Function.prototype;
	  var desc = Object.getOwnPropertyDescriptor(object, property);

	  if (desc === undefined) {
	    var parent = Object.getPrototypeOf(object);

	    if (parent === null) {
	      return undefined;
	    } else {
	      return get(parent, property, receiver);
	    }
	  } else if ("value" in desc) {
	    return desc.value;
	  } else {
	    var getter = desc.get;

	    if (getter === undefined) {
	      return undefined;
	    }

	    return getter.call(receiver);
	  }
	};

	var inherits = function (subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
	  }

	  subClass.prototype = Object.create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	};

	var possibleConstructorReturn = function (self, call) {
	  if (!self) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return call && (typeof call === "object" || typeof call === "function") ? call : self;
	};

	var Color$1 = function () {
	  function Color() {
	    classCallCheck(this, Color);
	    this.__state = interpret.apply(this, arguments);

	    if (this.__state === false) {
	      throw new Error('Failed to interpret color arguments');
	    }

	    this.__state.a = this.__state.a || 1;
	  }

	  createClass(Color, [{
	    key: 'toString',
	    value: function toString() {
	      return colorToString(this);
	    }
	  }, {
	    key: 'toHexString',
	    value: function toHexString() {
	      return colorToString(this, true);
	    }
	  }, {
	    key: 'toOriginal',
	    value: function toOriginal() {
	      return this.__state.conversion.write(this);
	    }
	  }]);
	  return Color;
	}();

	function defineRGBComponent(target, component, componentHexIndex) {
	  Object.defineProperty(target, component, {
	    get: function get$$1() {
	      if (this.__state.space === 'RGB') {
	        return this.__state[component];
	      }

	      Color$1.recalculateRGB(this, component, componentHexIndex);
	      return this.__state[component];
	    },
	    set: function set$$1(v) {
	      if (this.__state.space !== 'RGB') {
	        Color$1.recalculateRGB(this, component, componentHexIndex);
	        this.__state.space = 'RGB';
	      }

	      this.__state[component] = v;
	    }
	  });
	}

	function defineHSVComponent(target, component) {
	  Object.defineProperty(target, component, {
	    get: function get$$1() {
	      if (this.__state.space === 'HSV') {
	        return this.__state[component];
	      }

	      Color$1.recalculateHSV(this);
	      return this.__state[component];
	    },
	    set: function set$$1(v) {
	      if (this.__state.space !== 'HSV') {
	        Color$1.recalculateHSV(this);
	        this.__state.space = 'HSV';
	      }

	      this.__state[component] = v;
	    }
	  });
	}

	Color$1.recalculateRGB = function (color, component, componentHexIndex) {
	  if (color.__state.space === 'HEX') {
	    color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
	  } else if (color.__state.space === 'HSV') {
	    Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
	  } else {
	    throw new Error('Corrupted color state');
	  }
	};

	Color$1.recalculateHSV = function (color) {
	  var result = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
	  Common.extend(color.__state, {
	    s: result.s,
	    v: result.v
	  });

	  if (!Common.isNaN(result.h)) {
	    color.__state.h = result.h;
	  } else if (Common.isUndefined(color.__state.h)) {
	    color.__state.h = 0;
	  }
	};

	Color$1.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];
	defineRGBComponent(Color$1.prototype, 'r', 2);
	defineRGBComponent(Color$1.prototype, 'g', 1);
	defineRGBComponent(Color$1.prototype, 'b', 0);
	defineHSVComponent(Color$1.prototype, 'h');
	defineHSVComponent(Color$1.prototype, 's');
	defineHSVComponent(Color$1.prototype, 'v');
	Object.defineProperty(Color$1.prototype, 'a', {
	  get: function get$$1() {
	    return this.__state.a;
	  },
	  set: function set$$1(v) {
	    this.__state.a = v;
	  }
	});
	Object.defineProperty(Color$1.prototype, 'hex', {
	  get: function get$$1() {
	    if (this.__state.space !== 'HEX') {
	      this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
	      this.__state.space = 'HEX';
	    }

	    return this.__state.hex;
	  },
	  set: function set$$1(v) {
	    this.__state.space = 'HEX';
	    this.__state.hex = v;
	  }
	});

	var Controller = function () {
	  function Controller(object, property) {
	    classCallCheck(this, Controller);
	    this.initialValue = object[property];
	    this.domElement = document.createElement('div');
	    this.object = object;
	    this.property = property;
	    this.__onChange = undefined;
	    this.__onFinishChange = undefined;
	  }

	  createClass(Controller, [{
	    key: 'onChange',
	    value: function onChange(fnc) {
	      this.__onChange = fnc;
	      return this;
	    }
	  }, {
	    key: 'onFinishChange',
	    value: function onFinishChange(fnc) {
	      this.__onFinishChange = fnc;
	      return this;
	    }
	  }, {
	    key: 'setValue',
	    value: function setValue(newValue) {
	      this.object[this.property] = newValue;

	      if (this.__onChange) {
	        this.__onChange.call(this, newValue);
	      }

	      this.updateDisplay();
	      return this;
	    }
	  }, {
	    key: 'getValue',
	    value: function getValue() {
	      return this.object[this.property];
	    }
	  }, {
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      return this;
	    }
	  }, {
	    key: 'isModified',
	    value: function isModified() {
	      return this.initialValue !== this.getValue();
	    }
	  }]);
	  return Controller;
	}();

	var EVENT_MAP = {
	  HTMLEvents: ['change'],
	  MouseEvents: ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
	  KeyboardEvents: ['keydown']
	};
	var EVENT_MAP_INV = {};
	Common.each(EVENT_MAP, function (v, k) {
	  Common.each(v, function (e) {
	    EVENT_MAP_INV[e] = k;
	  });
	});
	var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;

	function cssValueToPixels(val) {
	  if (val === '0' || Common.isUndefined(val)) {
	    return 0;
	  }

	  var match = val.match(CSS_VALUE_PIXELS);

	  if (!Common.isNull(match)) {
	    return parseFloat(match[1]);
	  }

	  return 0;
	}

	var dom = {
	  makeSelectable: function makeSelectable(elem, selectable) {
	    if (elem === undefined || elem.style === undefined) return;
	    elem.onselectstart = selectable ? function () {
	      return false;
	    } : function () {};
	    elem.style.MozUserSelect = selectable ? 'auto' : 'none';
	    elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
	    elem.unselectable = selectable ? 'on' : 'off';
	  },
	  makeFullscreen: function makeFullscreen(elem, hor, vert) {
	    var vertical = vert;
	    var horizontal = hor;

	    if (Common.isUndefined(horizontal)) {
	      horizontal = true;
	    }

	    if (Common.isUndefined(vertical)) {
	      vertical = true;
	    }

	    elem.style.position = 'absolute';

	    if (horizontal) {
	      elem.style.left = 0;
	      elem.style.right = 0;
	    }

	    if (vertical) {
	      elem.style.top = 0;
	      elem.style.bottom = 0;
	    }
	  },
	  fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
	    var params = pars || {};
	    var className = EVENT_MAP_INV[eventType];

	    if (!className) {
	      throw new Error('Event type ' + eventType + ' not supported.');
	    }

	    var evt = document.createEvent(className);

	    switch (className) {
	      case 'MouseEvents':
	        {
	          var clientX = params.x || params.clientX || 0;
	          var clientY = params.y || params.clientY || 0;
	          evt.initMouseEvent(eventType, params.bubbles || false, params.cancelable || true, window, params.clickCount || 1, 0, 0, clientX, clientY, false, false, false, false, 0, null);
	          break;
	        }

	      case 'KeyboardEvents':
	        {
	          var init = evt.initKeyboardEvent || evt.initKeyEvent;
	          Common.defaults(params, {
	            cancelable: true,
	            ctrlKey: false,
	            altKey: false,
	            shiftKey: false,
	            metaKey: false,
	            keyCode: undefined,
	            charCode: undefined
	          });
	          init(eventType, params.bubbles || false, params.cancelable, window, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.keyCode, params.charCode);
	          break;
	        }

	      default:
	        {
	          evt.initEvent(eventType, params.bubbles || false, params.cancelable || true);
	          break;
	        }
	    }

	    Common.defaults(evt, aux);
	    elem.dispatchEvent(evt);
	  },
	  bind: function bind(elem, event, func, newBool) {
	    var bool = newBool || false;

	    if (elem.addEventListener) {
	      elem.addEventListener(event, func, bool);
	    } else if (elem.attachEvent) {
	      elem.attachEvent('on' + event, func);
	    }

	    return dom;
	  },
	  unbind: function unbind(elem, event, func, newBool) {
	    var bool = newBool || false;

	    if (elem.removeEventListener) {
	      elem.removeEventListener(event, func, bool);
	    } else if (elem.detachEvent) {
	      elem.detachEvent('on' + event, func);
	    }

	    return dom;
	  },
	  addClass: function addClass(elem, className) {
	    if (elem.className === undefined) {
	      elem.className = className;
	    } else if (elem.className !== className) {
	      var classes = elem.className.split(/ +/);

	      if (classes.indexOf(className) === -1) {
	        classes.push(className);
	        elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
	      }
	    }

	    return dom;
	  },
	  removeClass: function removeClass(elem, className) {
	    if (className) {
	      if (elem.className === className) {
	        elem.removeAttribute('class');
	      } else {
	        var classes = elem.className.split(/ +/);
	        var index = classes.indexOf(className);

	        if (index !== -1) {
	          classes.splice(index, 1);
	          elem.className = classes.join(' ');
	        }
	      }
	    } else {
	      elem.className = undefined;
	    }

	    return dom;
	  },
	  hasClass: function hasClass(elem, className) {
	    return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
	  },
	  getWidth: function getWidth(elem) {
	    var style = getComputedStyle(elem);
	    return cssValueToPixels(style['border-left-width']) + cssValueToPixels(style['border-right-width']) + cssValueToPixels(style['padding-left']) + cssValueToPixels(style['padding-right']) + cssValueToPixels(style.width);
	  },
	  getHeight: function getHeight(elem) {
	    var style = getComputedStyle(elem);
	    return cssValueToPixels(style['border-top-width']) + cssValueToPixels(style['border-bottom-width']) + cssValueToPixels(style['padding-top']) + cssValueToPixels(style['padding-bottom']) + cssValueToPixels(style.height);
	  },
	  getOffset: function getOffset(el) {
	    var elem = el;
	    var offset = {
	      left: 0,
	      top: 0
	    };

	    if (elem.offsetParent) {
	      do {
	        offset.left += elem.offsetLeft;
	        offset.top += elem.offsetTop;
	        elem = elem.offsetParent;
	      } while (elem);
	    }

	    return offset;
	  },
	  isActive: function isActive(elem) {
	    return elem === document.activeElement && (elem.type || elem.href);
	  }
	};

	var BooleanController = function (_Controller) {
	  inherits(BooleanController, _Controller);

	  function BooleanController(object, property) {
	    classCallCheck(this, BooleanController);

	    var _this2 = possibleConstructorReturn(this, (BooleanController.__proto__ || Object.getPrototypeOf(BooleanController)).call(this, object, property));

	    var _this = _this2;
	    _this2.__prev = _this2.getValue();
	    _this2.__checkbox = document.createElement('input');

	    _this2.__checkbox.setAttribute('type', 'checkbox');

	    function onChange() {
	      _this.setValue(!_this.__prev);
	    }

	    dom.bind(_this2.__checkbox, 'change', onChange, false);

	    _this2.domElement.appendChild(_this2.__checkbox);

	    _this2.updateDisplay();

	    return _this2;
	  }

	  createClass(BooleanController, [{
	    key: 'setValue',
	    value: function setValue(v) {
	      var toReturn = get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'setValue', this).call(this, v);

	      if (this.__onFinishChange) {
	        this.__onFinishChange.call(this, this.getValue());
	      }

	      this.__prev = this.getValue();
	      return toReturn;
	    }
	  }, {
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      if (this.getValue() === true) {
	        this.__checkbox.setAttribute('checked', 'checked');

	        this.__checkbox.checked = true;
	        this.__prev = true;
	      } else {
	        this.__checkbox.checked = false;
	        this.__prev = false;
	      }

	      return get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return BooleanController;
	}(Controller);

	var OptionController = function (_Controller) {
	  inherits(OptionController, _Controller);

	  function OptionController(object, property, opts) {
	    classCallCheck(this, OptionController);

	    var _this2 = possibleConstructorReturn(this, (OptionController.__proto__ || Object.getPrototypeOf(OptionController)).call(this, object, property));

	    var options = opts;
	    var _this = _this2;
	    _this2.__select = document.createElement('select');

	    if (Common.isArray(options)) {
	      var map = {};
	      Common.each(options, function (element) {
	        map[element] = element;
	      });
	      options = map;
	    }

	    Common.each(options, function (value, key) {
	      var opt = document.createElement('option');
	      opt.innerHTML = key;
	      opt.setAttribute('value', value);

	      _this.__select.appendChild(opt);
	    });

	    _this2.updateDisplay();

	    dom.bind(_this2.__select, 'change', function () {
	      var desiredValue = this.options[this.selectedIndex].value;

	      _this.setValue(desiredValue);
	    });

	    _this2.domElement.appendChild(_this2.__select);

	    return _this2;
	  }

	  createClass(OptionController, [{
	    key: 'setValue',
	    value: function setValue(v) {
	      var toReturn = get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'setValue', this).call(this, v);

	      if (this.__onFinishChange) {
	        this.__onFinishChange.call(this, this.getValue());
	      }

	      return toReturn;
	    }
	  }, {
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      if (dom.isActive(this.__select)) return this;
	      this.__select.value = this.getValue();
	      return get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return OptionController;
	}(Controller);

	var StringController = function (_Controller) {
	  inherits(StringController, _Controller);

	  function StringController(object, property) {
	    classCallCheck(this, StringController);

	    var _this2 = possibleConstructorReturn(this, (StringController.__proto__ || Object.getPrototypeOf(StringController)).call(this, object, property));

	    var _this = _this2;

	    function onChange() {
	      _this.setValue(_this.__input.value);
	    }

	    function onBlur() {
	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.getValue());
	      }
	    }

	    _this2.__input = document.createElement('input');

	    _this2.__input.setAttribute('type', 'text');

	    dom.bind(_this2.__input, 'keyup', onChange);
	    dom.bind(_this2.__input, 'change', onChange);
	    dom.bind(_this2.__input, 'blur', onBlur);
	    dom.bind(_this2.__input, 'keydown', function (e) {
	      if (e.keyCode === 13) {
	        this.blur();
	      }
	    });

	    _this2.updateDisplay();

	    _this2.domElement.appendChild(_this2.__input);

	    return _this2;
	  }

	  createClass(StringController, [{
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      if (!dom.isActive(this.__input)) {
	        this.__input.value = this.getValue();
	      }

	      return get(StringController.prototype.__proto__ || Object.getPrototypeOf(StringController.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return StringController;
	}(Controller);

	function numDecimals(x) {
	  var _x = x.toString();

	  if (_x.indexOf('.') > -1) {
	    return _x.length - _x.indexOf('.') - 1;
	  }

	  return 0;
	}

	var NumberController = function (_Controller) {
	  inherits(NumberController, _Controller);

	  function NumberController(object, property, params) {
	    classCallCheck(this, NumberController);

	    var _this = possibleConstructorReturn(this, (NumberController.__proto__ || Object.getPrototypeOf(NumberController)).call(this, object, property));

	    var _params = params || {};

	    _this.__min = _params.min;
	    _this.__max = _params.max;
	    _this.__step = _params.step;

	    if (Common.isUndefined(_this.__step)) {
	      if (_this.initialValue === 0) {
	        _this.__impliedStep = 1;
	      } else {
	        _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
	      }
	    } else {
	      _this.__impliedStep = _this.__step;
	    }

	    _this.__precision = numDecimals(_this.__impliedStep);
	    return _this;
	  }

	  createClass(NumberController, [{
	    key: 'setValue',
	    value: function setValue(v) {
	      var _v = v;

	      if (this.__min !== undefined && _v < this.__min) {
	        _v = this.__min;
	      } else if (this.__max !== undefined && _v > this.__max) {
	        _v = this.__max;
	      }

	      if (this.__step !== undefined && _v % this.__step !== 0) {
	        _v = Math.round(_v / this.__step) * this.__step;
	      }

	      return get(NumberController.prototype.__proto__ || Object.getPrototypeOf(NumberController.prototype), 'setValue', this).call(this, _v);
	    }
	  }, {
	    key: 'min',
	    value: function min(minValue) {
	      this.__min = minValue;
	      return this;
	    }
	  }, {
	    key: 'max',
	    value: function max(maxValue) {
	      this.__max = maxValue;
	      return this;
	    }
	  }, {
	    key: 'step',
	    value: function step(stepValue) {
	      this.__step = stepValue;
	      this.__impliedStep = stepValue;
	      this.__precision = numDecimals(stepValue);
	      return this;
	    }
	  }]);
	  return NumberController;
	}(Controller);

	function roundToDecimal(value, decimals) {
	  var tenTo = Math.pow(10, decimals);
	  return Math.round(value * tenTo) / tenTo;
	}

	var NumberControllerBox = function (_NumberController) {
	  inherits(NumberControllerBox, _NumberController);

	  function NumberControllerBox(object, property, params) {
	    classCallCheck(this, NumberControllerBox);

	    var _this2 = possibleConstructorReturn(this, (NumberControllerBox.__proto__ || Object.getPrototypeOf(NumberControllerBox)).call(this, object, property, params));

	    _this2.__truncationSuspended = false;
	    var _this = _this2;
	    var prevY = void 0;

	    function onChange() {
	      var attempted = parseFloat(_this.__input.value);

	      if (!Common.isNaN(attempted)) {
	        _this.setValue(attempted);
	      }
	    }

	    function onFinish() {
	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.getValue());
	      }
	    }

	    function onBlur() {
	      onFinish();
	    }

	    function onMouseDrag(e) {
	      var diff = prevY - e.clientY;

	      _this.setValue(_this.getValue() + diff * _this.__impliedStep);

	      prevY = e.clientY;
	    }

	    function onMouseUp() {
	      dom.unbind(window, 'mousemove', onMouseDrag);
	      dom.unbind(window, 'mouseup', onMouseUp);
	      onFinish();
	    }

	    function onMouseDown(e) {
	      dom.bind(window, 'mousemove', onMouseDrag);
	      dom.bind(window, 'mouseup', onMouseUp);
	      prevY = e.clientY;
	    }

	    _this2.__input = document.createElement('input');

	    _this2.__input.setAttribute('type', 'text');

	    dom.bind(_this2.__input, 'change', onChange);
	    dom.bind(_this2.__input, 'blur', onBlur);
	    dom.bind(_this2.__input, 'mousedown', onMouseDown);
	    dom.bind(_this2.__input, 'keydown', function (e) {
	      if (e.keyCode === 13) {
	        _this.__truncationSuspended = true;
	        this.blur();
	        _this.__truncationSuspended = false;
	        onFinish();
	      }
	    });

	    _this2.updateDisplay();

	    _this2.domElement.appendChild(_this2.__input);

	    return _this2;
	  }

	  createClass(NumberControllerBox, [{
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
	      return get(NumberControllerBox.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return NumberControllerBox;
	}(NumberController);

	function map(v, i1, i2, o1, o2) {
	  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
	}

	var NumberControllerSlider = function (_NumberController) {
	  inherits(NumberControllerSlider, _NumberController);

	  function NumberControllerSlider(object, property, min, max, step) {
	    classCallCheck(this, NumberControllerSlider);

	    var _this2 = possibleConstructorReturn(this, (NumberControllerSlider.__proto__ || Object.getPrototypeOf(NumberControllerSlider)).call(this, object, property, {
	      min: min,
	      max: max,
	      step: step
	    }));

	    var _this = _this2;
	    _this2.__background = document.createElement('div');
	    _this2.__foreground = document.createElement('div');
	    dom.bind(_this2.__background, 'mousedown', onMouseDown);
	    dom.bind(_this2.__background, 'touchstart', onTouchStart);
	    dom.addClass(_this2.__background, 'slider');
	    dom.addClass(_this2.__foreground, 'slider-fg');

	    function onMouseDown(e) {
	      document.activeElement.blur();
	      dom.bind(window, 'mousemove', onMouseDrag);
	      dom.bind(window, 'mouseup', onMouseUp);
	      onMouseDrag(e);
	    }

	    function onMouseDrag(e) {
	      e.preventDefault();

	      var bgRect = _this.__background.getBoundingClientRect();

	      _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));

	      return false;
	    }

	    function onMouseUp() {
	      dom.unbind(window, 'mousemove', onMouseDrag);
	      dom.unbind(window, 'mouseup', onMouseUp);

	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.getValue());
	      }
	    }

	    function onTouchStart(e) {
	      if (e.touches.length !== 1) {
	        return;
	      }

	      dom.bind(window, 'touchmove', onTouchMove);
	      dom.bind(window, 'touchend', onTouchEnd);
	      onTouchMove(e);
	    }

	    function onTouchMove(e) {
	      var clientX = e.touches[0].clientX;

	      var bgRect = _this.__background.getBoundingClientRect();

	      _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
	    }

	    function onTouchEnd() {
	      dom.unbind(window, 'touchmove', onTouchMove);
	      dom.unbind(window, 'touchend', onTouchEnd);

	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.getValue());
	      }
	    }

	    _this2.updateDisplay();

	    _this2.__background.appendChild(_this2.__foreground);

	    _this2.domElement.appendChild(_this2.__background);

	    return _this2;
	  }

	  createClass(NumberControllerSlider, [{
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      var pct = (this.getValue() - this.__min) / (this.__max - this.__min);

	      this.__foreground.style.width = pct * 100 + '%';
	      return get(NumberControllerSlider.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider.prototype), 'updateDisplay', this).call(this);
	    }
	  }]);
	  return NumberControllerSlider;
	}(NumberController);

	var FunctionController = function (_Controller) {
	  inherits(FunctionController, _Controller);

	  function FunctionController(object, property, text) {
	    classCallCheck(this, FunctionController);

	    var _this2 = possibleConstructorReturn(this, (FunctionController.__proto__ || Object.getPrototypeOf(FunctionController)).call(this, object, property));

	    var _this = _this2;
	    _this2.__button = document.createElement('div');
	    _this2.__button.innerHTML = text === undefined ? 'Fire' : text;
	    dom.bind(_this2.__button, 'click', function (e) {
	      e.preventDefault();

	      _this.fire();

	      return false;
	    });
	    dom.addClass(_this2.__button, 'button');

	    _this2.domElement.appendChild(_this2.__button);

	    return _this2;
	  }

	  createClass(FunctionController, [{
	    key: 'fire',
	    value: function fire() {
	      if (this.__onChange) {
	        this.__onChange.call(this);
	      }

	      this.getValue().call(this.object);

	      if (this.__onFinishChange) {
	        this.__onFinishChange.call(this, this.getValue());
	      }
	    }
	  }]);
	  return FunctionController;
	}(Controller);

	var ColorController = function (_Controller) {
	  inherits(ColorController, _Controller);

	  function ColorController(object, property) {
	    classCallCheck(this, ColorController);

	    var _this2 = possibleConstructorReturn(this, (ColorController.__proto__ || Object.getPrototypeOf(ColorController)).call(this, object, property));

	    _this2.__color = new Color$1(_this2.getValue());
	    _this2.__temp = new Color$1(0);
	    var _this = _this2;
	    _this2.domElement = document.createElement('div');
	    dom.makeSelectable(_this2.domElement, false);
	    _this2.__selector = document.createElement('div');
	    _this2.__selector.className = 'selector';
	    _this2.__saturation_field = document.createElement('div');
	    _this2.__saturation_field.className = 'saturation-field';
	    _this2.__field_knob = document.createElement('div');
	    _this2.__field_knob.className = 'field-knob';
	    _this2.__field_knob_border = '2px solid ';
	    _this2.__hue_knob = document.createElement('div');
	    _this2.__hue_knob.className = 'hue-knob';
	    _this2.__hue_field = document.createElement('div');
	    _this2.__hue_field.className = 'hue-field';
	    _this2.__input = document.createElement('input');
	    _this2.__input.type = 'text';
	    _this2.__input_textShadow = '0 1px 1px ';
	    dom.bind(_this2.__input, 'keydown', function (e) {
	      if (e.keyCode === 13) {
	        onBlur.call(this);
	      }
	    });
	    dom.bind(_this2.__input, 'blur', onBlur);
	    dom.bind(_this2.__selector, 'mousedown', function () {
	      dom.addClass(this, 'drag').bind(window, 'mouseup', function () {
	        dom.removeClass(_this.__selector, 'drag');
	      });
	    });
	    dom.bind(_this2.__selector, 'touchstart', function () {
	      dom.addClass(this, 'drag').bind(window, 'touchend', function () {
	        dom.removeClass(_this.__selector, 'drag');
	      });
	    });
	    var valueField = document.createElement('div');
	    Common.extend(_this2.__selector.style, {
	      width: '122px',
	      height: '102px',
	      padding: '3px',
	      backgroundColor: '#222',
	      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
	    });
	    Common.extend(_this2.__field_knob.style, {
	      position: 'absolute',
	      width: '12px',
	      height: '12px',
	      border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? '#fff' : '#000'),
	      boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
	      borderRadius: '12px',
	      zIndex: 1
	    });
	    Common.extend(_this2.__hue_knob.style, {
	      position: 'absolute',
	      width: '15px',
	      height: '2px',
	      borderRight: '4px solid #fff',
	      zIndex: 1
	    });
	    Common.extend(_this2.__saturation_field.style, {
	      width: '100px',
	      height: '100px',
	      border: '1px solid #555',
	      marginRight: '3px',
	      display: 'inline-block',
	      cursor: 'pointer'
	    });
	    Common.extend(valueField.style, {
	      width: '100%',
	      height: '100%',
	      background: 'none'
	    });
	    linearGradient(valueField, 'top', 'rgba(0,0,0,0)', '#000');
	    Common.extend(_this2.__hue_field.style, {
	      width: '15px',
	      height: '100px',
	      border: '1px solid #555',
	      cursor: 'ns-resize',
	      position: 'absolute',
	      top: '3px',
	      right: '3px'
	    });
	    hueGradient(_this2.__hue_field);
	    Common.extend(_this2.__input.style, {
	      outline: 'none',
	      textAlign: 'center',
	      color: '#fff',
	      border: 0,
	      fontWeight: 'bold',
	      textShadow: _this2.__input_textShadow + 'rgba(0,0,0,0.7)'
	    });
	    dom.bind(_this2.__saturation_field, 'mousedown', fieldDown);
	    dom.bind(_this2.__saturation_field, 'touchstart', fieldDown);
	    dom.bind(_this2.__field_knob, 'mousedown', fieldDown);
	    dom.bind(_this2.__field_knob, 'touchstart', fieldDown);
	    dom.bind(_this2.__hue_field, 'mousedown', fieldDownH);
	    dom.bind(_this2.__hue_field, 'touchstart', fieldDownH);

	    function fieldDown(e) {
	      setSV(e);
	      dom.bind(window, 'mousemove', setSV);
	      dom.bind(window, 'touchmove', setSV);
	      dom.bind(window, 'mouseup', fieldUpSV);
	      dom.bind(window, 'touchend', fieldUpSV);
	    }

	    function fieldDownH(e) {
	      setH(e);
	      dom.bind(window, 'mousemove', setH);
	      dom.bind(window, 'touchmove', setH);
	      dom.bind(window, 'mouseup', fieldUpH);
	      dom.bind(window, 'touchend', fieldUpH);
	    }

	    function fieldUpSV() {
	      dom.unbind(window, 'mousemove', setSV);
	      dom.unbind(window, 'touchmove', setSV);
	      dom.unbind(window, 'mouseup', fieldUpSV);
	      dom.unbind(window, 'touchend', fieldUpSV);
	      onFinish();
	    }

	    function fieldUpH() {
	      dom.unbind(window, 'mousemove', setH);
	      dom.unbind(window, 'touchmove', setH);
	      dom.unbind(window, 'mouseup', fieldUpH);
	      dom.unbind(window, 'touchend', fieldUpH);
	      onFinish();
	    }

	    function onBlur() {
	      var i = interpret(this.value);

	      if (i !== false) {
	        _this.__color.__state = i;

	        _this.setValue(_this.__color.toOriginal());
	      } else {
	        this.value = _this.__color.toString();
	      }
	    }

	    function onFinish() {
	      if (_this.__onFinishChange) {
	        _this.__onFinishChange.call(_this, _this.__color.toOriginal());
	      }
	    }

	    _this2.__saturation_field.appendChild(valueField);

	    _this2.__selector.appendChild(_this2.__field_knob);

	    _this2.__selector.appendChild(_this2.__saturation_field);

	    _this2.__selector.appendChild(_this2.__hue_field);

	    _this2.__hue_field.appendChild(_this2.__hue_knob);

	    _this2.domElement.appendChild(_this2.__input);

	    _this2.domElement.appendChild(_this2.__selector);

	    _this2.updateDisplay();

	    function setSV(e) {
	      if (e.type.indexOf('touch') === -1) {
	        e.preventDefault();
	      }

	      var fieldRect = _this.__saturation_field.getBoundingClientRect();

	      var _ref = e.touches && e.touches[0] || e,
	          clientX = _ref.clientX,
	          clientY = _ref.clientY;

	      var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
	      var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

	      if (v > 1) {
	        v = 1;
	      } else if (v < 0) {
	        v = 0;
	      }

	      if (s > 1) {
	        s = 1;
	      } else if (s < 0) {
	        s = 0;
	      }

	      _this.__color.v = v;
	      _this.__color.s = s;

	      _this.setValue(_this.__color.toOriginal());

	      return false;
	    }

	    function setH(e) {
	      if (e.type.indexOf('touch') === -1) {
	        e.preventDefault();
	      }

	      var fieldRect = _this.__hue_field.getBoundingClientRect();

	      var _ref2 = e.touches && e.touches[0] || e,
	          clientY = _ref2.clientY;

	      var h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

	      if (h > 1) {
	        h = 1;
	      } else if (h < 0) {
	        h = 0;
	      }

	      _this.__color.h = h * 360;

	      _this.setValue(_this.__color.toOriginal());

	      return false;
	    }

	    return _this2;
	  }

	  createClass(ColorController, [{
	    key: 'updateDisplay',
	    value: function updateDisplay() {
	      var i = interpret(this.getValue());

	      if (i !== false) {
	        var mismatch = false;
	        Common.each(Color$1.COMPONENTS, function (component) {
	          if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
	            mismatch = true;
	            return {};
	          }
	        }, this);

	        if (mismatch) {
	          Common.extend(this.__color.__state, i);
	        }
	      }

	      Common.extend(this.__temp.__state, this.__color.__state);
	      this.__temp.a = 1;
	      var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;

	      var _flip = 255 - flip;

	      Common.extend(this.__field_knob.style, {
	        marginLeft: 100 * this.__color.s - 7 + 'px',
	        marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
	        backgroundColor: this.__temp.toHexString(),
	        border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
	      });
	      this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';
	      this.__temp.s = 1;
	      this.__temp.v = 1;
	      linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toHexString());
	      this.__input.value = this.__color.toString();
	      Common.extend(this.__input.style, {
	        backgroundColor: this.__color.toHexString(),
	        color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
	        textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
	      });
	    }
	  }]);
	  return ColorController;
	}(Controller);

	var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];

	function linearGradient(elem, x, a, b) {
	  elem.style.background = '';
	  Common.each(vendors, function (vendor) {
	    elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
	  });
	}

	function hueGradient(elem) {
	  elem.style.background = '';
	  elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
	  elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
	  elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
	  elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
	  elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
	}

	var css = {
	  load: function load(url, indoc) {
	    var doc = indoc || document;
	    var link = doc.createElement('link');
	    link.type = 'text/css';
	    link.rel = 'stylesheet';
	    link.href = url;
	    doc.getElementsByTagName('head')[0].appendChild(link);
	  },
	  inject: function inject(cssContent, indoc) {
	    var doc = indoc || document;
	    var injected = document.createElement('style');
	    injected.type = 'text/css';
	    injected.innerHTML = cssContent;
	    var head = doc.getElementsByTagName('head')[0];

	    try {
	      head.appendChild(injected);
	    } catch (e) {}
	  }
	};
	var saveDialogContents = "<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>";

	var ControllerFactory = function ControllerFactory(object, property) {
	  var initialValue = object[property];

	  if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
	    return new OptionController(object, property, arguments[2]);
	  }

	  if (Common.isNumber(initialValue)) {
	    if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
	      if (Common.isNumber(arguments[4])) {
	        return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
	      }

	      return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
	    }

	    if (Common.isNumber(arguments[4])) {
	      return new NumberControllerBox(object, property, {
	        min: arguments[2],
	        max: arguments[3],
	        step: arguments[4]
	      });
	    }

	    return new NumberControllerBox(object, property, {
	      min: arguments[2],
	      max: arguments[3]
	    });
	  }

	  if (Common.isString(initialValue)) {
	    return new StringController(object, property);
	  }

	  if (Common.isFunction(initialValue)) {
	    return new FunctionController(object, property, '');
	  }

	  if (Common.isBoolean(initialValue)) {
	    return new BooleanController(object, property);
	  }

	  return null;
	};

	function requestAnimationFrame$1(callback) {
	  setTimeout(callback, 1000 / 60);
	}

	var requestAnimationFrame$1$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame$1;

	var CenteredDiv = function () {
	  function CenteredDiv() {
	    classCallCheck(this, CenteredDiv);
	    this.backgroundElement = document.createElement('div');
	    Common.extend(this.backgroundElement.style, {
	      backgroundColor: 'rgba(0,0,0,0.8)',
	      top: 0,
	      left: 0,
	      display: 'none',
	      zIndex: '1000',
	      opacity: 0,
	      WebkitTransition: 'opacity 0.2s linear',
	      transition: 'opacity 0.2s linear'
	    });
	    dom.makeFullscreen(this.backgroundElement);
	    this.backgroundElement.style.position = 'fixed';
	    this.domElement = document.createElement('div');
	    Common.extend(this.domElement.style, {
	      position: 'fixed',
	      display: 'none',
	      zIndex: '1001',
	      opacity: 0,
	      WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
	      transition: 'transform 0.2s ease-out, opacity 0.2s linear'
	    });
	    document.body.appendChild(this.backgroundElement);
	    document.body.appendChild(this.domElement);

	    var _this = this;

	    dom.bind(this.backgroundElement, 'click', function () {
	      _this.hide();
	    });
	  }

	  createClass(CenteredDiv, [{
	    key: 'show',
	    value: function show() {
	      var _this = this;

	      this.backgroundElement.style.display = 'block';
	      this.domElement.style.display = 'block';
	      this.domElement.style.opacity = 0;
	      this.domElement.style.webkitTransform = 'scale(1.1)';
	      this.layout();
	      Common.defer(function () {
	        _this.backgroundElement.style.opacity = 1;
	        _this.domElement.style.opacity = 1;
	        _this.domElement.style.webkitTransform = 'scale(1)';
	      });
	    }
	  }, {
	    key: 'hide',
	    value: function hide() {
	      var _this = this;

	      var hide = function hide() {
	        _this.domElement.style.display = 'none';
	        _this.backgroundElement.style.display = 'none';
	        dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
	        dom.unbind(_this.domElement, 'transitionend', hide);
	        dom.unbind(_this.domElement, 'oTransitionEnd', hide);
	      };

	      dom.bind(this.domElement, 'webkitTransitionEnd', hide);
	      dom.bind(this.domElement, 'transitionend', hide);
	      dom.bind(this.domElement, 'oTransitionEnd', hide);
	      this.backgroundElement.style.opacity = 0;
	      this.domElement.style.opacity = 0;
	      this.domElement.style.webkitTransform = 'scale(1.1)';
	    }
	  }, {
	    key: 'layout',
	    value: function layout() {
	      this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
	      this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
	    }
	  }]);
	  return CenteredDiv;
	}();

	var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");

	css.inject(styleSheet);
	var CSS_NAMESPACE = 'dg';
	var HIDE_KEY_CODE = 72;
	var CLOSE_BUTTON_HEIGHT = 20;
	var DEFAULT_DEFAULT_PRESET_NAME = 'Default';

	var SUPPORTS_LOCAL_STORAGE = function () {
	  try {
	    return !!window.localStorage;
	  } catch (e) {
	    return false;
	  }
	}();

	var SAVE_DIALOGUE = void 0;
	var autoPlaceVirgin = true;
	var autoPlaceContainer = void 0;
	var hide = false;
	var hideableGuis = [];

	var GUI = function GUI(pars) {
	  var _this = this;

	  var params = pars || {};
	  this.domElement = document.createElement('div');
	  this.__ul = document.createElement('ul');
	  this.domElement.appendChild(this.__ul);
	  dom.addClass(this.domElement, CSS_NAMESPACE);
	  this.__folders = {};
	  this.__controllers = [];
	  this.__rememberedObjects = [];
	  this.__rememberedObjectIndecesToControllers = [];
	  this.__listening = [];
	  params = Common.defaults(params, {
	    closeOnTop: false,
	    autoPlace: true,
	    width: GUI.DEFAULT_WIDTH
	  });
	  params = Common.defaults(params, {
	    resizable: params.autoPlace,
	    hideable: params.autoPlace
	  });

	  if (!Common.isUndefined(params.load)) {
	    if (params.preset) {
	      params.load.preset = params.preset;
	    }
	  } else {
	    params.load = {
	      preset: DEFAULT_DEFAULT_PRESET_NAME
	    };
	  }

	  if (Common.isUndefined(params.parent) && params.hideable) {
	    hideableGuis.push(this);
	  }

	  params.resizable = Common.isUndefined(params.parent) && params.resizable;

	  if (params.autoPlace && Common.isUndefined(params.scrollable)) {
	    params.scrollable = true;
	  }

	  var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';
	  var saveToLocalStorage = void 0;
	  var titleRow = void 0;
	  Object.defineProperties(this, {
	    parent: {
	      get: function get$$1() {
	        return params.parent;
	      }
	    },
	    scrollable: {
	      get: function get$$1() {
	        return params.scrollable;
	      }
	    },
	    autoPlace: {
	      get: function get$$1() {
	        return params.autoPlace;
	      }
	    },
	    closeOnTop: {
	      get: function get$$1() {
	        return params.closeOnTop;
	      }
	    },
	    preset: {
	      get: function get$$1() {
	        if (_this.parent) {
	          return _this.getRoot().preset;
	        }

	        return params.load.preset;
	      },
	      set: function set$$1(v) {
	        if (_this.parent) {
	          _this.getRoot().preset = v;
	        } else {
	          params.load.preset = v;
	        }

	        setPresetSelectIndex(this);

	        _this.revert();
	      }
	    },
	    width: {
	      get: function get$$1() {
	        return params.width;
	      },
	      set: function set$$1(v) {
	        params.width = v;
	        setWidth(_this, v);
	      }
	    },
	    name: {
	      get: function get$$1() {
	        return params.name;
	      },
	      set: function set$$1(v) {
	        params.name = v;

	        if (titleRow) {
	          titleRow.innerHTML = params.name;
	        }
	      }
	    },
	    closed: {
	      get: function get$$1() {
	        return params.closed;
	      },
	      set: function set$$1(v) {
	        params.closed = v;

	        if (params.closed) {
	          dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
	        } else {
	          dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
	        }

	        this.onResize();

	        if (_this.__closeButton) {
	          _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
	        }
	      }
	    },
	    load: {
	      get: function get$$1() {
	        return params.load;
	      }
	    },
	    useLocalStorage: {
	      get: function get$$1() {
	        return useLocalStorage;
	      },
	      set: function set$$1(bool) {
	        if (SUPPORTS_LOCAL_STORAGE) {
	          useLocalStorage = bool;

	          if (bool) {
	            dom.bind(window, 'unload', saveToLocalStorage);
	          } else {
	            dom.unbind(window, 'unload', saveToLocalStorage);
	          }

	          localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
	        }
	      }
	    }
	  });

	  if (Common.isUndefined(params.parent)) {
	    this.closed = params.closed || false;
	    dom.addClass(this.domElement, GUI.CLASS_MAIN);
	    dom.makeSelectable(this.domElement, false);

	    if (SUPPORTS_LOCAL_STORAGE) {
	      if (useLocalStorage) {
	        _this.useLocalStorage = true;
	        var savedGui = localStorage.getItem(getLocalStorageHash(this, 'gui'));

	        if (savedGui) {
	          params.load = JSON.parse(savedGui);
	        }
	      }
	    }

	    this.__closeButton = document.createElement('div');
	    this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
	    dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);

	    if (params.closeOnTop) {
	      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_TOP);
	      this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
	    } else {
	      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BOTTOM);
	      this.domElement.appendChild(this.__closeButton);
	    }

	    dom.bind(this.__closeButton, 'click', function () {
	      _this.closed = !_this.closed;
	    });
	  } else {
	    if (params.closed === undefined) {
	      params.closed = true;
	    }

	    var titleRowName = document.createTextNode(params.name);
	    dom.addClass(titleRowName, 'controller-name');
	    titleRow = addRow(_this, titleRowName);

	    var onClickTitle = function onClickTitle(e) {
	      e.preventDefault();
	      _this.closed = !_this.closed;
	      return false;
	    };

	    dom.addClass(this.__ul, GUI.CLASS_CLOSED);
	    dom.addClass(titleRow, 'title');
	    dom.bind(titleRow, 'click', onClickTitle);

	    if (!params.closed) {
	      this.closed = false;
	    }
	  }

	  if (params.autoPlace) {
	    if (Common.isUndefined(params.parent)) {
	      if (autoPlaceVirgin) {
	        autoPlaceContainer = document.createElement('div');
	        dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
	        dom.addClass(autoPlaceContainer, GUI.CLASS_AUTO_PLACE_CONTAINER);
	        document.body.appendChild(autoPlaceContainer);
	        autoPlaceVirgin = false;
	      }

	      autoPlaceContainer.appendChild(this.domElement);
	      dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);
	    }

	    if (!this.parent) {
	      setWidth(_this, params.width);
	    }
	  }

	  this.__resizeHandler = function () {
	    _this.onResizeDebounced();
	  };

	  dom.bind(window, 'resize', this.__resizeHandler);
	  dom.bind(this.__ul, 'webkitTransitionEnd', this.__resizeHandler);
	  dom.bind(this.__ul, 'transitionend', this.__resizeHandler);
	  dom.bind(this.__ul, 'oTransitionEnd', this.__resizeHandler);
	  this.onResize();

	  if (params.resizable) {
	    addResizeHandle(this);
	  }

	  saveToLocalStorage = function saveToLocalStorage() {
	    if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
	      localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
	    }
	  };

	  this.saveToLocalStorageIfPossible = saveToLocalStorage;

	  function resetWidth() {
	    var root = _this.getRoot();

	    root.width += 1;
	    Common.defer(function () {
	      root.width -= 1;
	    });
	  }

	  if (!params.parent) {
	    resetWidth();
	  }
	};

	GUI.toggleHide = function () {
	  hide = !hide;
	  Common.each(hideableGuis, function (gui) {
	    gui.domElement.style.display = hide ? 'none' : '';
	  });
	};

	GUI.CLASS_AUTO_PLACE = 'a';
	GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
	GUI.CLASS_MAIN = 'main';
	GUI.CLASS_CONTROLLER_ROW = 'cr';
	GUI.CLASS_TOO_TALL = 'taller-than-window';
	GUI.CLASS_CLOSED = 'closed';
	GUI.CLASS_CLOSE_BUTTON = 'close-button';
	GUI.CLASS_CLOSE_TOP = 'close-top';
	GUI.CLASS_CLOSE_BOTTOM = 'close-bottom';
	GUI.CLASS_DRAG = 'drag';
	GUI.DEFAULT_WIDTH = 245;
	GUI.TEXT_CLOSED = 'Close Controls';
	GUI.TEXT_OPEN = 'Open Controls';

	GUI._keydownHandler = function (e) {
	  if (document.activeElement.type !== 'text' && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
	    GUI.toggleHide();
	  }
	};

	dom.bind(window, 'keydown', GUI._keydownHandler, false);
	Common.extend(GUI.prototype, {
	  add: function add(object, property) {
	    return _add(this, object, property, {
	      factoryArgs: Array.prototype.slice.call(arguments, 2)
	    });
	  },
	  addColor: function addColor(object, property) {
	    return _add(this, object, property, {
	      color: true
	    });
	  },
	  remove: function remove(controller) {
	    this.__ul.removeChild(controller.__li);

	    this.__controllers.splice(this.__controllers.indexOf(controller), 1);

	    var _this = this;

	    Common.defer(function () {
	      _this.onResize();
	    });
	  },
	  destroy: function destroy() {
	    if (this.parent) {
	      throw new Error('Only the root GUI should be removed with .destroy(). ' + 'For subfolders, use gui.removeFolder(folder) instead.');
	    }

	    if (this.autoPlace) {
	      autoPlaceContainer.removeChild(this.domElement);
	    }

	    var _this = this;

	    Common.each(this.__folders, function (subfolder) {
	      _this.removeFolder(subfolder);
	    });
	    dom.unbind(window, 'keydown', GUI._keydownHandler, false);
	    removeListeners(this);
	  },
	  addFolder: function addFolder(name) {
	    if (this.__folders[name] !== undefined) {
	      throw new Error('You already have a folder in this GUI by the' + ' name "' + name + '"');
	    }

	    var newGuiParams = {
	      name: name,
	      parent: this
	    };
	    newGuiParams.autoPlace = this.autoPlace;

	    if (this.load && this.load.folders && this.load.folders[name]) {
	      newGuiParams.closed = this.load.folders[name].closed;
	      newGuiParams.load = this.load.folders[name];
	    }

	    var gui = new GUI(newGuiParams);
	    this.__folders[name] = gui;
	    var li = addRow(this, gui.domElement);
	    dom.addClass(li, 'folder');
	    return gui;
	  },
	  removeFolder: function removeFolder(folder) {
	    this.__ul.removeChild(folder.domElement.parentElement);

	    delete this.__folders[folder.name];

	    if (this.load && this.load.folders && this.load.folders[folder.name]) {
	      delete this.load.folders[folder.name];
	    }

	    removeListeners(folder);

	    var _this = this;

	    Common.each(folder.__folders, function (subfolder) {
	      folder.removeFolder(subfolder);
	    });
	    Common.defer(function () {
	      _this.onResize();
	    });
	  },
	  open: function open() {
	    this.closed = false;
	  },
	  close: function close() {
	    this.closed = true;
	  },
	  hide: function hide() {
	    this.domElement.style.display = 'none';
	  },
	  show: function show() {
	    this.domElement.style.display = '';
	  },
	  onResize: function onResize() {
	    var root = this.getRoot();

	    if (root.scrollable) {
	      var top = dom.getOffset(root.__ul).top;
	      var h = 0;
	      Common.each(root.__ul.childNodes, function (node) {
	        if (!(root.autoPlace && node === root.__save_row)) {
	          h += dom.getHeight(node);
	        }
	      });

	      if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
	        dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
	        root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
	      } else {
	        dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
	        root.__ul.style.height = 'auto';
	      }
	    }

	    if (root.__resize_handle) {
	      Common.defer(function () {
	        root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
	      });
	    }

	    if (root.__closeButton) {
	      root.__closeButton.style.width = root.width + 'px';
	    }
	  },
	  onResizeDebounced: Common.debounce(function () {
	    this.onResize();
	  }, 50),
	  remember: function remember() {
	    if (Common.isUndefined(SAVE_DIALOGUE)) {
	      SAVE_DIALOGUE = new CenteredDiv();
	      SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
	    }

	    if (this.parent) {
	      throw new Error('You can only call remember on a top level GUI.');
	    }

	    var _this = this;

	    Common.each(Array.prototype.slice.call(arguments), function (object) {
	      if (_this.__rememberedObjects.length === 0) {
	        addSaveMenu(_this);
	      }

	      if (_this.__rememberedObjects.indexOf(object) === -1) {
	        _this.__rememberedObjects.push(object);
	      }
	    });

	    if (this.autoPlace) {
	      setWidth(this, this.width);
	    }
	  },
	  getRoot: function getRoot() {
	    var gui = this;

	    while (gui.parent) {
	      gui = gui.parent;
	    }

	    return gui;
	  },
	  getSaveObject: function getSaveObject() {
	    var toReturn = this.load;
	    toReturn.closed = this.closed;

	    if (this.__rememberedObjects.length > 0) {
	      toReturn.preset = this.preset;

	      if (!toReturn.remembered) {
	        toReturn.remembered = {};
	      }

	      toReturn.remembered[this.preset] = getCurrentPreset(this);
	    }

	    toReturn.folders = {};
	    Common.each(this.__folders, function (element, key) {
	      toReturn.folders[key] = element.getSaveObject();
	    });
	    return toReturn;
	  },
	  save: function save() {
	    if (!this.load.remembered) {
	      this.load.remembered = {};
	    }

	    this.load.remembered[this.preset] = getCurrentPreset(this);
	    markPresetModified(this, false);
	    this.saveToLocalStorageIfPossible();
	  },
	  saveAs: function saveAs(presetName) {
	    if (!this.load.remembered) {
	      this.load.remembered = {};
	      this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
	    }

	    this.load.remembered[presetName] = getCurrentPreset(this);
	    this.preset = presetName;
	    addPresetOption(this, presetName, true);
	    this.saveToLocalStorageIfPossible();
	  },
	  revert: function revert(gui) {
	    Common.each(this.__controllers, function (controller) {
	      if (!this.getRoot().load.remembered) {
	        controller.setValue(controller.initialValue);
	      } else {
	        recallSavedValue(gui || this.getRoot(), controller);
	      }

	      if (controller.__onFinishChange) {
	        controller.__onFinishChange.call(controller, controller.getValue());
	      }
	    }, this);
	    Common.each(this.__folders, function (folder) {
	      folder.revert(folder);
	    });

	    if (!gui) {
	      markPresetModified(this.getRoot(), false);
	    }
	  },
	  listen: function listen(controller) {
	    var init = this.__listening.length === 0;

	    this.__listening.push(controller);

	    if (init) {
	      updateDisplays(this.__listening);
	    }
	  },
	  updateDisplay: function updateDisplay() {
	    Common.each(this.__controllers, function (controller) {
	      controller.updateDisplay();
	    });
	    Common.each(this.__folders, function (folder) {
	      folder.updateDisplay();
	    });
	  }
	});

	function addRow(gui, newDom, liBefore) {
	  var li = document.createElement('li');

	  if (newDom) {
	    li.appendChild(newDom);
	  }

	  if (liBefore) {
	    gui.__ul.insertBefore(li, liBefore);
	  } else {
	    gui.__ul.appendChild(li);
	  }

	  gui.onResize();
	  return li;
	}

	function removeListeners(gui) {
	  dom.unbind(window, 'resize', gui.__resizeHandler);

	  if (gui.saveToLocalStorageIfPossible) {
	    dom.unbind(window, 'unload', gui.saveToLocalStorageIfPossible);
	  }
	}

	function markPresetModified(gui, modified) {
	  var opt = gui.__preset_select[gui.__preset_select.selectedIndex];

	  if (modified) {
	    opt.innerHTML = opt.value + '*';
	  } else {
	    opt.innerHTML = opt.value;
	  }
	}

	function augmentController(gui, li, controller) {
	  controller.__li = li;
	  controller.__gui = gui;
	  Common.extend(controller, {
	    options: function options(_options) {
	      if (arguments.length > 1) {
	        var nextSibling = controller.__li.nextElementSibling;
	        controller.remove();
	        return _add(gui, controller.object, controller.property, {
	          before: nextSibling,
	          factoryArgs: [Common.toArray(arguments)]
	        });
	      }

	      if (Common.isArray(_options) || Common.isObject(_options)) {
	        var _nextSibling = controller.__li.nextElementSibling;
	        controller.remove();
	        return _add(gui, controller.object, controller.property, {
	          before: _nextSibling,
	          factoryArgs: [_options]
	        });
	      }
	    },
	    name: function name(_name) {
	      controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
	      return controller;
	    },
	    listen: function listen() {
	      controller.__gui.listen(controller);

	      return controller;
	    },
	    remove: function remove() {
	      controller.__gui.remove(controller);

	      return controller;
	    }
	  });

	  if (controller instanceof NumberControllerSlider) {
	    var box = new NumberControllerBox(controller.object, controller.property, {
	      min: controller.__min,
	      max: controller.__max,
	      step: controller.__step
	    });
	    Common.each(['updateDisplay', 'onChange', 'onFinishChange', 'step', 'min', 'max'], function (method) {
	      var pc = controller[method];
	      var pb = box[method];

	      controller[method] = box[method] = function () {
	        var args = Array.prototype.slice.call(arguments);
	        pb.apply(box, args);
	        return pc.apply(controller, args);
	      };
	    });
	    dom.addClass(li, 'has-slider');
	    controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
	  } else if (controller instanceof NumberControllerBox) {
	    var r = function r(returned) {
	      if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
	        var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
	        var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
	        controller.remove();

	        var newController = _add(gui, controller.object, controller.property, {
	          before: controller.__li.nextElementSibling,
	          factoryArgs: [controller.__min, controller.__max, controller.__step]
	        });

	        newController.name(oldName);
	        if (wasListening) newController.listen();
	        return newController;
	      }

	      return returned;
	    };

	    controller.min = Common.compose(r, controller.min);
	    controller.max = Common.compose(r, controller.max);
	  } else if (controller instanceof BooleanController) {
	    dom.bind(li, 'click', function () {
	      dom.fakeEvent(controller.__checkbox, 'click');
	    });
	    dom.bind(controller.__checkbox, 'click', function (e) {
	      e.stopPropagation();
	    });
	  } else if (controller instanceof FunctionController) {
	    dom.bind(li, 'click', function () {
	      dom.fakeEvent(controller.__button, 'click');
	    });
	    dom.bind(li, 'mouseover', function () {
	      dom.addClass(controller.__button, 'hover');
	    });
	    dom.bind(li, 'mouseout', function () {
	      dom.removeClass(controller.__button, 'hover');
	    });
	  } else if (controller instanceof ColorController) {
	    dom.addClass(li, 'color');
	    controller.updateDisplay = Common.compose(function (val) {
	      li.style.borderLeftColor = controller.__color.toString();
	      return val;
	    }, controller.updateDisplay);
	    controller.updateDisplay();
	  }

	  controller.setValue = Common.compose(function (val) {
	    if (gui.getRoot().__preset_select && controller.isModified()) {
	      markPresetModified(gui.getRoot(), true);
	    }

	    return val;
	  }, controller.setValue);
	}

	function recallSavedValue(gui, controller) {
	  var root = gui.getRoot();

	  var matchedIndex = root.__rememberedObjects.indexOf(controller.object);

	  if (matchedIndex !== -1) {
	    var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];

	    if (controllerMap === undefined) {
	      controllerMap = {};
	      root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
	    }

	    controllerMap[controller.property] = controller;

	    if (root.load && root.load.remembered) {
	      var presetMap = root.load.remembered;
	      var preset = void 0;

	      if (presetMap[gui.preset]) {
	        preset = presetMap[gui.preset];
	      } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
	        preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
	      } else {
	        return;
	      }

	      if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== undefined) {
	        var value = preset[matchedIndex][controller.property];
	        controller.initialValue = value;
	        controller.setValue(value);
	      }
	    }
	  }
	}

	function _add(gui, object, property, params) {
	  if (object[property] === undefined) {
	    throw new Error('Object "' + object + '" has no property "' + property + '"');
	  }

	  var controller = void 0;

	  if (params.color) {
	    controller = new ColorController(object, property);
	  } else {
	    var factoryArgs = [object, property].concat(params.factoryArgs);
	    controller = ControllerFactory.apply(gui, factoryArgs);
	  }

	  if (params.before instanceof Controller) {
	    params.before = params.before.__li;
	  }

	  recallSavedValue(gui, controller);
	  dom.addClass(controller.domElement, 'c');
	  var name = document.createElement('span');
	  dom.addClass(name, 'property-name');
	  name.innerHTML = controller.property;
	  var container = document.createElement('div');
	  container.appendChild(name);
	  container.appendChild(controller.domElement);
	  var li = addRow(gui, container, params.before);
	  dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);

	  if (controller instanceof ColorController) {
	    dom.addClass(li, 'color');
	  } else {
	    dom.addClass(li, _typeof(controller.getValue()));
	  }

	  augmentController(gui, li, controller);

	  gui.__controllers.push(controller);

	  return controller;
	}

	function getLocalStorageHash(gui, key) {
	  return document.location.href + '.' + key;
	}

	function addPresetOption(gui, name, setSelected) {
	  var opt = document.createElement('option');
	  opt.innerHTML = name;
	  opt.value = name;

	  gui.__preset_select.appendChild(opt);

	  if (setSelected) {
	    gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
	  }
	}

	function showHideExplain(gui, explain) {
	  explain.style.display = gui.useLocalStorage ? 'block' : 'none';
	}

	function addSaveMenu(gui) {
	  var div = gui.__save_row = document.createElement('li');
	  dom.addClass(gui.domElement, 'has-save');

	  gui.__ul.insertBefore(div, gui.__ul.firstChild);

	  dom.addClass(div, 'save-row');
	  var gears = document.createElement('span');
	  gears.innerHTML = '&nbsp;';
	  dom.addClass(gears, 'button gears');
	  var button = document.createElement('span');
	  button.innerHTML = 'Save';
	  dom.addClass(button, 'button');
	  dom.addClass(button, 'save');
	  var button2 = document.createElement('span');
	  button2.innerHTML = 'New';
	  dom.addClass(button2, 'button');
	  dom.addClass(button2, 'save-as');
	  var button3 = document.createElement('span');
	  button3.innerHTML = 'Revert';
	  dom.addClass(button3, 'button');
	  dom.addClass(button3, 'revert');
	  var select = gui.__preset_select = document.createElement('select');

	  if (gui.load && gui.load.remembered) {
	    Common.each(gui.load.remembered, function (value, key) {
	      addPresetOption(gui, key, key === gui.preset);
	    });
	  } else {
	    addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
	  }

	  dom.bind(select, 'change', function () {
	    for (var index = 0; index < gui.__preset_select.length; index++) {
	      gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
	    }

	    gui.preset = this.value;
	  });
	  div.appendChild(select);
	  div.appendChild(gears);
	  div.appendChild(button);
	  div.appendChild(button2);
	  div.appendChild(button3);

	  if (SUPPORTS_LOCAL_STORAGE) {
	    var explain = document.getElementById('dg-local-explain');
	    var localStorageCheckBox = document.getElementById('dg-local-storage');
	    var saveLocally = document.getElementById('dg-save-locally');
	    saveLocally.style.display = 'block';

	    if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
	      localStorageCheckBox.setAttribute('checked', 'checked');
	    }

	    showHideExplain(gui, explain);
	    dom.bind(localStorageCheckBox, 'change', function () {
	      gui.useLocalStorage = !gui.useLocalStorage;
	      showHideExplain(gui, explain);
	    });
	  }

	  var newConstructorTextArea = document.getElementById('dg-new-constructor');
	  dom.bind(newConstructorTextArea, 'keydown', function (e) {
	    if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
	      SAVE_DIALOGUE.hide();
	    }
	  });
	  dom.bind(gears, 'click', function () {
	    newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
	    SAVE_DIALOGUE.show();
	    newConstructorTextArea.focus();
	    newConstructorTextArea.select();
	  });
	  dom.bind(button, 'click', function () {
	    gui.save();
	  });
	  dom.bind(button2, 'click', function () {
	    var presetName = prompt('Enter a new preset name.');

	    if (presetName) {
	      gui.saveAs(presetName);
	    }
	  });
	  dom.bind(button3, 'click', function () {
	    gui.revert();
	  });
	}

	function addResizeHandle(gui) {
	  var pmouseX = void 0;
	  gui.__resize_handle = document.createElement('div');
	  Common.extend(gui.__resize_handle.style, {
	    width: '6px',
	    marginLeft: '-3px',
	    height: '200px',
	    cursor: 'ew-resize',
	    position: 'absolute'
	  });

	  function drag(e) {
	    e.preventDefault();
	    gui.width += pmouseX - e.clientX;
	    gui.onResize();
	    pmouseX = e.clientX;
	    return false;
	  }

	  function dragStop() {
	    dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
	    dom.unbind(window, 'mousemove', drag);
	    dom.unbind(window, 'mouseup', dragStop);
	  }

	  function dragStart(e) {
	    e.preventDefault();
	    pmouseX = e.clientX;
	    dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
	    dom.bind(window, 'mousemove', drag);
	    dom.bind(window, 'mouseup', dragStop);
	    return false;
	  }

	  dom.bind(gui.__resize_handle, 'mousedown', dragStart);
	  dom.bind(gui.__closeButton, 'mousedown', dragStart);
	  gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);
	}

	function setWidth(gui, w) {
	  gui.domElement.style.width = w + 'px';

	  if (gui.__save_row && gui.autoPlace) {
	    gui.__save_row.style.width = w + 'px';
	  }

	  if (gui.__closeButton) {
	    gui.__closeButton.style.width = w + 'px';
	  }
	}

	function getCurrentPreset(gui, useInitialValues) {
	  var toReturn = {};
	  Common.each(gui.__rememberedObjects, function (val, index) {
	    var savedValues = {};
	    var controllerMap = gui.__rememberedObjectIndecesToControllers[index];
	    Common.each(controllerMap, function (controller, property) {
	      savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
	    });
	    toReturn[index] = savedValues;
	  });
	  return toReturn;
	}

	function setPresetSelectIndex(gui) {
	  for (var index = 0; index < gui.__preset_select.length; index++) {
	    if (gui.__preset_select[index].value === gui.preset) {
	      gui.__preset_select.selectedIndex = index;
	    }
	  }
	}

	function updateDisplays(controllerArray) {
	  if (controllerArray.length !== 0) {
	    requestAnimationFrame$1$1.call(window, function () {
	      updateDisplays(controllerArray);
	    });
	  }

	  Common.each(controllerArray, function (c) {
	    c.updateDisplay();
	  });
	}
	var GUI$1 = GUI;

	var preset = "Default";
	var remembered = {
		Default: {
			"0": {
				autoSave: true,
				fullscreen: false
			},
			"1": {
				speed: 0.21,
				noise: 0.003,
				feedback: 1
			},
			"2": {
				amount: 0.42,
				scaleX: 0.74,
				scaleY: 0.76,
				centerX: 0.5,
				centerY: 0.51
			},
			"3": {
				color1: [
					150.74536663980655,
					50.183823529411775,
					200
				],
				color2: [
					0,
					0,
					0
				],
				brightness: 1,
				blobbyness: 1.2000000000000002,
				blur: 1.47,
				enabled: true
			},
			"4": {
				brightness: 1,
				enabled: true,
				cycleSpeed: 0.2
			}
		}
	};
	var closed = false;
	var folders = {
		Global: {
			preset: "Default",
			closed: false,
			folders: {
			}
		},
		Feedback: {
			preset: "Default",
			closed: false,
			folders: {
			}
		},
		"Layer 1": {
			preset: "Default",
			closed: false,
			folders: {
			}
		},
		"Layer 2": {
			preset: "Default",
			closed: false,
			folders: {
			}
		}
	};
	var settings = {
		preset: preset,
		remembered: remembered,
		closed: closed,
		folders: folders
	};

	var Settings = /*#__PURE__*/Object.freeze({
		__proto__: null,
		preset: preset,
		remembered: remembered,
		closed: closed,
		folders: folders,
		'default': settings
	});

	function _classCallCheck(instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	}

	function _defineProperties(target, props) {
	  for (var i = 0; i < props.length; i++) {
	    var descriptor = props[i];
	    descriptor.enumerable = descriptor.enumerable || false;
	    descriptor.configurable = true;
	    if ("value" in descriptor) descriptor.writable = true;
	    Object.defineProperty(target, descriptor.key, descriptor);
	  }
	}

	function _createClass(Constructor, protoProps, staticProps) {
	  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	  if (staticProps) _defineProperties(Constructor, staticProps);
	  Object.defineProperty(Constructor, "prototype", {
	    writable: false
	  });
	  return Constructor;
	}

	function _defineProperty(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	var initTexture = function initTexture(gl, params) {
	  var _params$width, _params$height;

	  var width = (_params$width = params.width) !== null && _params$width !== void 0 ? _params$width : 256;
	  var height = (_params$height = params.height) !== null && _params$height !== void 0 ? _params$height : 256;
	  var tex = gl.createTexture();
	  gl.bindTexture(gl.TEXTURE_2D, tex);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	  return tex;
	};

	var initFrameBuffer = function initFrameBuffer(gl, texture) {
	  var fbo = gl.createFramebuffer();
	  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	  return fbo;
	};

	var PingPongBuffer = /*#__PURE__*/_createClass(function PingPongBuffer(gl, params) {
	  var _this = this,
	      _params$width2,
	      _params$height2;

	  _classCallCheck(this, PingPongBuffer);

	  _defineProperty(this, "currentTexture", function () {
	    return _this.swp ? _this.texture2 : _this.texture1;
	  });

	  _defineProperty(this, "lastTexture", function () {
	    return _this.swp ? _this.texture1 : _this.texture2;
	  });

	  _defineProperty(this, "currentFramebuffer", function () {
	    return _this.swp ? _this.fb2 : _this.fb1;
	  });

	  _defineProperty(this, "swap", function () {
	    return _this.swp = !_this.swp;
	  });

	  _defineProperty(this, "bind", function () {
	    _this.gl.bindFramebuffer(_this.gl.FRAMEBUFFER, _this.currentFramebuffer());

	    _this.gl.viewport(0, 0, _this.width, _this.height);
	  });

	  this.width = params.width = (_params$width2 = params.width) !== null && _params$width2 !== void 0 ? _params$width2 : 256;
	  this.height = params.height = (_params$height2 = params.height) !== null && _params$height2 !== void 0 ? _params$height2 : 256;
	  this.texture1 = initTexture(gl, params);
	  this.texture2 = initTexture(gl, params);
	  this.fb1 = initFrameBuffer(gl, this.texture1);
	  this.fb2 = initFrameBuffer(gl, this.texture2);
	  this.swp = false;
	  this.gl = gl;
	});

	var auraCanvas = document.getElementById('aura_canvas');
	var gl = auraCanvas.getContext('webgl2');
	var programInfo = createProgramInfo(gl, [VertDefault, FragAura]);
	var programFinal = createProgramInfo(gl, [VertDefault, FragComp]);
	var pauseButton = document.getElementById('pause_btn');
	var playButton = document.getElementById('play_btn');
	var timer = document.getElementById('timer');
	var fpsDisp = document.getElementById('fps');
	var layer1 = {
	  color1: [255.0, 0.0, 0.0],
	  color2: [0., 255., 0.],
	  brightness: .2,
	  blobbyness: 1.,
	  blur: .4,
	  enabled: true
	};
	var layer2 = {
	  brightness: 1,
	  cycleSpeed: .2,
	  enabled: false
	};
	var appParams = {
	  autoSave: true,
	  fullscreen: false
	};
	var feedbackSettings = {
	  amount: .4,
	  scaleX: 1.01,
	  scaleY: 1.01,
	  centerX: 0.5,
	  centerY: 0.5
	};
	var globalParams = {
	  time: 0.,
	  speed: .1,
	  seed: 100,
	  noise: .003,
	  feedback: .99
	};
	console.log("Settings: ", Settings);

	var setFullscreen = function setFullscreen(isFullscreen) {
	  console.log("set fullscreen: ".concat(isFullscreen));
	  auraCanvas.style = isFullscreen ? fullscreenStyle : null;

	  if (!isFullscreen) {
	    console.log('set width height');
	    auraCanvas.width = width;
	    auraCanvas.height = height;
	  }
	};

	var initGui = function initGui() {
	  var gui = new GUI$1({
	    name: 'params',
	    load: Settings
	  }); // App

	  gui.remember(appParams);
	  gui.add(appParams, 'autoSave');
	  gui.add(appParams, 'fullscreen').listen().onChange(setFullscreen); // Global

	  gui.remember(globalParams);
	  var folder = gui.addFolder('Global');
	  folder.add(globalParams, 'speed').min(0.01).max(1).step(.01).listen();
	  folder.add(globalParams, 'noise').min(0.).max(.1).step(.001).listen();
	  folder.open(); // Feedback settings

	  gui.remember(feedbackSettings);
	  var feedbackFolder = gui.addFolder('Feedback');
	  feedbackFolder.add(feedbackSettings, 'amount').min(0).max(1).step(.01).listen(); // feedbackFolder.add(feedbackSettings, 'scaleX').min(0.1).max(2.0).step(.01).listen();
	  // feedbackFolder.add(feedbackSettings, 'scaleY').min(0.1).max(2.0).step(.01).listen();
	  // feedbackFolder.add(feedbackSettings, 'centerX').min(0).max(1).step(.01).listen();
	  // feedbackFolder.add(feedbackSettings, 'centerY').min(0).max(1).step(0.01).listen();

	  feedbackFolder.open(); // Layer 1

	  gui.remember(layer1);
	  var layer1Folder = gui.addFolder('Layer 1');
	  layer1Folder.addColor(layer1, 'color1').listen();
	  layer1Folder.addColor(layer1, 'color2').listen();
	  layer1Folder.add(layer1, 'brightness').min(0).max(1).step(.01).listen();
	  layer1Folder.add(layer1, 'blobbyness').min(0).max(4).step(.1).listen();
	  layer1Folder.add(layer1, 'blur').min(0).max(3).step(.01).listen();
	  layer1Folder.add(layer1, 'enabled').listen();
	  layer1Folder.open(); // Layer 2

	  gui.remember(layer2);
	  var layer2Folder = gui.addFolder('Layer 2');
	  layer2Folder.add(layer2, 'brightness').min(0).max(1).step(.01).listen();
	  layer2Folder.add(layer2, 'enabled').listen();
	  layer2Folder.add(layer2, 'cycleSpeed').min(0).max(2).step(.01).listen();
	  layer2Folder.open(); // Autosave interval

	  setInterval(function () {
	    if (appParams.autoSave) gui.save();
	  }, 1000);
	};

	var rgbVals = [// [0, 0, 0],
	[14, 39, 35], [8, 69, 62], [118, 81, 121], [223, 179, 109], [217, 229, 199]];
	var rgbArray = rgbVals;
	rgbVals = rgbVals.map(function (e) {
	  return new Color$1$1('sRGB', e.map(function (f) {
	    return f / 255;
	  }));
	});
	var playing = true;
	var startTime, prevTimestamp, deltaTime, now;
	var fps = 60;
	var fixedDeltaTime = 1000 / fps;
	var animTime = 0;
	var frameCount = 0;
	var width = 600;
	var height = 400;
	var fullscreenStyle = "position: fixed;    width: 100vw;    height: 100vh;    z-index: 0;";
	window.addEventListener('blur', function () {
	  return console.log('blur');
	}, false);
	window.addEventListener('focus', function () {
	  return console.log('focus');
	}, false);
	var bufferInfo = createBufferInfoFromArrays(gl, FullScreenQuad);
	var backBufferTex = gl.createTexture(); // const backBufferTex = twgl.createTexture(gl, { width: targetTexWidth, height: targetTexHeight, color: [255, 0, 0], format: gl.RGBA, internalFormat:gl.RGBA });

	var targetTexWidth = 256;
	var targetTexHeight = 256;
	gl.bindTexture(gl.TEXTURE_2D, backBufferTex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, targetTexWidth, targetTexHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	var fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	var attachmentPoint = gl.COLOR_ATTACHMENT0;
	gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, backBufferTex, 0);

	var start = function start(fps) {
	  fixedDeltaTime = 1000 / fps;
	  prevTimestamp = window.performance.now();
	  startTime = prevTimestamp;
	  render();
	};

	var ramp = CreateGradientTexture2(gl, {
	  colors: rgbArray,
	  resolution: 256
	});
	var ppb = new PingPongBuffer(gl, {
	  width: targetTexWidth,
	  height: targetTexHeight
	});

	var render = function render(time) {
	  requestAnimationFrame(render);
	  now = time;
	  deltaTime = now - prevTimestamp;

	  if (deltaTime > fixedDeltaTime) {
	    if (playing) animTime += deltaTime * globalParams.speed;
	    globalParams.time = animTime * .001;
	    prevTimestamp = now - deltaTime % fixedDeltaTime;
	    var sinceStart = now - startTime;
	    var currFps = Math.round(1000 / (sinceStart / ++frameCount) * 100) / 100;
	    fpsDisp.textContent = "FPS: ".concat(currFps.toFixed(2));
	    resizeCanvasToDisplaySize(gl.canvas);
	    timer.textContent = "Time: ".concat((animTime / 1000).toFixed(2));
	    var uniforms = {
	      time: [globalParams.time, globalParams.time / 2, globalParams.time * 2, globalParams.time / 10],
	      resolution: [targetTexWidth, targetTexHeight],
	      ramp: ramp,
	      layer1: layer1,
	      layer2: layer2,
	      feedback: feedbackSettings,
	      noiseDither: globalParams.noise,
	      backBufferTex: ppb.lastTexture()
	    };
	    var compUniforms = {
	      resolution: [gl.canvas.width, gl.canvas.height],
	      backBuffer: ppb.currentTexture(),
	      noiseDither: globalParams.noise,
	      ramp: ramp
	    };
	    {
	      // Render new frame 
	      ppb.bind();
	      gl.useProgram(programInfo.program);
	      setBuffersAndAttributes(gl, programInfo, bufferInfo);
	      setUniforms(programInfo, uniforms);
	      drawBufferInfo(gl, bufferInfo);
	    }
	    {
	      compUniforms.backBuffer = ppb.currentTexture(); //   // Set dst buffer back to screen

	      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	      gl.useProgram(programFinal.program);
	      setBuffersAndAttributes(gl, programFinal, bufferInfo);
	      setUniforms(programFinal, compUniforms);
	      drawBufferInfo(gl, bufferInfo);
	      ppb.swap();
	    }
	  }
	};

	if (programInfo) start(fps);else timer.textContent = 'Failed to Compile Shaders';

	pauseButton.onclick = function () {
	  return playing = false;
	};

	playButton.onclick = function () {
	  return playing = true;
	};

	initGui();
	setFullscreen(appParams.fullscreen);

})();
